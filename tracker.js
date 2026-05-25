/**
 * tracker.js — Passive Behavioral Analytics
 * Self-contained. Attach via tracker.init(getStateFn, saveFn).
 * Electron-ready: all data in localStorage, no external deps.
 */
 
const TRACKER_KEY = 'mb_tracker';
const IDLE_THRESHOLD = 90;      // seconds before marking idle
const DISTRACTION_THRESHOLD = 8; // seconds hidden before counting
const SAVE_INTERVAL = 30;        // seconds between auto-saves
const INSIGHT_COOLDOWN = 3600;   // min seconds between AI insight calls
 
// ─── SCHEMA ──────────────────────────────────────────────────────────────────
function defaultTrackerState() {
  return {
    today: todayKey(),
    sessions: [],           // [{ start, end, focusSecs, idleSecs, distractions }]
    dailyScores: {},        // { 'YYYY-MM-DD': score }
    distractionLog: [],     // [{ ts, durationMs }]
    idleLog: [],            // [{ ts, durationSecs }]
    lastInsightTs: 0,
    lastInsightText: '',
    totalFocusSecs: 0,
    streak: 0,
    lastActiveDay: ''
  };
}
 
// ─── STATE ───────────────────────────────────────────────────────────────────
let _tState = null;
let _getAppState = null;
let _saveAppState = null;
 
let _sessionStart = null;
let _sessionFocusSecs = 0;
let _sessionIdleSecs = 0;
let _sessionDistractions = 0;
 
let _idleTimer = null;
let _idleStart = null;
let _isIdle = false;
 
let _hiddenAt = null;
 
let _tickInterval = null;
let _lastActivity = Date.now();
 
// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return { ...defaultTrackerState(), ...saved };
  } catch { return defaultTrackerState(); }
}
 
function save() {
  localStorage.setItem(TRACKER_KEY, JSON.stringify(_tState));
}
 
// ─── INIT ────────────────────────────────────────────────────────────────────
export const tracker = {
  init(getStateFn, saveStateFn) {
    _getAppState = getStateFn;
    _saveAppState = saveStateFn;
    _tState = load();
    rolloverIfNewDay();
    startSession();
    attachListeners();
    startTick();
    renderInsightPanel();
    console.debug('[tracker] initialized');
  },
 
  // Called by app.js when a sprint starts
  onSprintStart() {
    _isIdle = false;
    resetIdleTimer();
  },
 
  // Called by app.js when a sprint ends
  onSprintEnd(durationSecs) {
    _sessionFocusSecs += durationSecs;
    _tState.totalFocusSecs += durationSecs;
    computeDailyScore();
    save();
    renderInsightPanel();
  },
 
  // Called by app.js on task check
  onTaskComplete() {
    _lastActivity = Date.now();
    _isIdle = false;
    resetIdleTimer();
    computeDailyScore();
    save();
    renderInsightPanel();
  },
 
  getScore() {
    return _tState.dailyScores[todayKey()] ?? 0;
  },
 
  getDailyData() {
    return _tState;
  }
};
 
// ─── SESSION ─────────────────────────────────────────────────────────────────
function startSession() {
  _sessionStart = Date.now();
  _sessionFocusSecs = 0;
  _sessionIdleSecs = 0;
  _sessionDistractions = 0;
}
 
function closeSession() {
  if (!_sessionStart) return;
  const session = {
    start: _sessionStart,
    end: Date.now(),
    focusSecs: _sessionFocusSecs,
    idleSecs: _sessionIdleSecs,
    distractions: _sessionDistractions
  };
  if (!_tState.sessions) _tState.sessions = [];
  _tState.sessions.push(session);
  // Keep last 50 sessions only
  if (_tState.sessions.length > 50) _tState.sessions = _tState.sessions.slice(-50);
  save();
}
 
// ─── TICK (every second) ─────────────────────────────────────────────────────
function startTick() {
  let elapsed = 0;
  _tickInterval = setInterval(() => {
    if (document.hidden || _isIdle) return;
    _sessionFocusSecs += 1;
    _tState.totalFocusSecs = (_tState.totalFocusSecs || 0) + 1;
    elapsed += 1;
    if (elapsed % SAVE_INTERVAL === 0) {
      computeDailyScore();
      save();
      renderInsightPanel();
    }
  }, 1000);
}
 
// ─── IDLE DETECTION ──────────────────────────────────────────────────────────
function attachListeners() {
  // Activity signals
  ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(ev => {
    document.addEventListener(ev, onActivity, { passive: true });
  });
 
  // Tab/window visibility
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', onWindowBlur);
  window.addEventListener('focus', onWindowFocus);
  window.addEventListener('beforeunload', () => { closeSession(); save(); });
}
 
function onActivity() {
  _lastActivity = Date.now();
  if (_isIdle) {
    const idleDuration = Math.round((Date.now() - _idleStart) / 1000);
    if (idleDuration > 10) {
      _sessionIdleSecs += idleDuration;
      _tState.idleLog = _tState.idleLog || [];
      _tState.idleLog.push({ ts: Date.now(), durationSecs: idleDuration });
      if (_tState.idleLog.length > 100) _tState.idleLog = _tState.idleLog.slice(-100);
    }
    _isIdle = false;
    _idleStart = null;
    updateIdleUI(false);
  }
  resetIdleTimer();
}
 
function resetIdleTimer() {
  clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    _isIdle = true;
    _idleStart = Date.now();
    updateIdleUI(true);
  }, IDLE_THRESHOLD * 1000);
}
 
function onVisibilityChange() {
  if (document.hidden) {
    _hiddenAt = Date.now();
  } else {
    if (_hiddenAt) {
      const gone = (Date.now() - _hiddenAt) / 1000;
      if (gone > DISTRACTION_THRESHOLD) {
        _sessionDistractions += 1;
        _tState.distractionLog = _tState.distractionLog || [];
        _tState.distractionLog.push({ ts: Date.now(), durationMs: Date.now() - _hiddenAt });
        if (_tState.distractionLog.length > 200) _tState.distractionLog = _tState.distractionLog.slice(-200);
        showDistractionNudge(Math.round(gone));
      }
      _hiddenAt = null;
    }
    onActivity();
  }
}
 
function onWindowBlur() {
  _hiddenAt = _hiddenAt || Date.now();
}
 
function onWindowFocus() {
  if (_hiddenAt) {
    const gone = (Date.now() - _hiddenAt) / 1000;
    if (gone > DISTRACTION_THRESHOLD) {
      _sessionDistractions += 1;
      showDistractionNudge(Math.round(gone));
    }
    _hiddenAt = null;
  }
  onActivity();
}
 
// ─── DAILY SCORE (0–100) ─────────────────────────────────────────────────────
function computeDailyScore() {
  const appState = _getAppState?.();
  const tasks = appState?.mission?.roadmap?.find(d => d.day === appState?.mission?.currentDay)?.steps || [];
  const tasksDone = tasks.filter(s => s.done).length;
  const totalTasks = tasks.length || 1;
 
  const focusMins = _sessionFocusSecs / 60;
  const distractions = _sessionDistractions;
  const idleMins = _sessionIdleSecs / 60;
 
  // Weighted score components
  const taskScore    = (tasksDone / totalTasks) * 40;           // 40pts: task completion
  const focusScore   = Math.min(30, (focusMins / 90) * 30);    // 30pts: up to 90 min focus
  const idlePenalty  = Math.min(15, idleMins * 0.5);            // -15pts max: idle
  const distrPenalty = Math.min(15, distractions * 3);          // -15pts max: distractions
 
  const raw = Math.max(0, Math.round(taskScore + focusScore - idlePenalty - distrPenalty));
  const score = Math.min(100, raw);
 
  if (!_tState.dailyScores) _tState.dailyScores = {};
  _tState.dailyScores[todayKey()] = score;
  updateScoreUI(score);
  return score;
}
 
// ─── AI INSIGHTS ─────────────────────────────────────────────────────────────
async function fetchInsight() {
  const now = Math.floor(Date.now() / 1000);
  if (now - (_tState.lastInsightTs || 0) < INSIGHT_COOLDOWN) {
    return _tState.lastInsightText || '';
  }
 
  const appState = _getAppState?.();
  const idea = appState?.profile?.idea || 'their project';
  const name = appState?.profile?.name || 'Founder';
  const score = computeDailyScore();
  const focusMins = Math.round(_sessionFocusSecs / 60);
  const distractions = _sessionDistractions;
  const idleMins = Math.round(_sessionIdleSecs / 60);
  const tasks = appState?.mission?.roadmap?.find(d => d.day === appState?.mission?.currentDay)?.steps || [];
  const tasksDone = tasks.filter(s => s.done).length;
  const totalTasks = tasks.length;
  const vibe = appState?.profile?.coachVibe || 'zen';
 
  const prompt = `You are a ${vibe} productivity coach AI. Give a SHORT insight (2 sentences max) for this founder.
 
Founder: ${name} | Building: "${idea}"
Today's execution data:
- Focus time: ${focusMins} minutes
- Distractions: ${distractions}
- Idle time: ${idleMins} minutes  
- Tasks: ${tasksDone}/${totalTasks} done
- Execution score: ${score}/100
 
Give ONE specific, actionable insight based on the data. Be ${vibe === 'drill' ? 'blunt' : vibe === 'hype' ? 'energetic' : 'calm'}. No more than 2 sentences.`;
 
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    _tState.lastInsightText = text;
    _tState.lastInsightTs = now;
    save();
    return text;
  } catch {
    return _tState.lastInsightText || 'Stay focused. Small actions compound.';
  }
}
 
// ─── UI RENDERS ──────────────────────────────────────────────────────────────
function renderInsightPanel() {
  const panel = document.getElementById('trackerInsightPanel');
  if (!panel) return;
  const score = _tState.dailyScores?.[todayKey()] ?? 0;
  const focusMins = Math.round(_sessionFocusSecs / 60);
  const distractions = _sessionDistractions;
  const grade = score >= 80 ? { label: 'ELITE', color: '#10b981' }
              : score >= 60 ? { label: 'SOLID', color: '#6366f1' }
              : score >= 40 ? { label: 'BUILDING', color: '#f59e0b' }
              :               { label: 'WARMING UP', color: '#9ca3af' };
 
  panel.innerHTML = `
    <div class="tracker-row">
      <div class="tracker-score-ring" style="--score-color:${grade.color}">
        <svg viewBox="0 0 60 60" class="tracker-ring-svg">
          <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
          <circle cx="30" cy="30" r="24" fill="none" stroke="${grade.color}" stroke-width="5"
            stroke-dasharray="${Math.round(score * 1.508)} 150.8"
            stroke-linecap="round" transform="rotate(-90 30 30)"/>
        </svg>
        <div class="tracker-ring-inner">
          <span class="tracker-score-num">${score}</span>
          <span class="tracker-score-label" style="color:${grade.color}">${grade.label}</span>
        </div>
      </div>
      <div class="tracker-stats-col">
        <div class="tracker-stat"><span class="ts-icon">⏱</span><span class="ts-val">${focusMins}m</span><span class="ts-lbl">Focus</span></div>
        <div class="tracker-stat"><span class="ts-icon">📵</span><span class="ts-val">${distractions}</span><span class="ts-lbl">Distractions</span></div>
        <div class="tracker-stat tracker-idle-stat" id="trackerIdleStat"><span class="ts-icon">💤</span><span class="ts-val" id="trackerIdleVal">${Math.round(_sessionIdleSecs / 60)}m</span><span class="ts-lbl">Idle</span></div>
      </div>
    </div>
    <div class="tracker-insight-row" id="trackerInsightRow">
      <span class="tracker-insight-text" id="trackerInsightText">${_tState.lastInsightText || '...'}</span>
      <button class="tracker-insight-refresh" id="btnRefreshInsight" title="Get AI insight">✨</button>
    </div>`;
 
  document.getElementById('btnRefreshInsight')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnRefreshInsight');
    if (btn) btn.textContent = '⏳';
    const text = await fetchInsight();
    const el = document.getElementById('trackerInsightText');
    if (el) el.textContent = text;
    if (btn) btn.textContent = '✨';
  });
 
  // Auto-fetch insight if stale
  const now = Math.floor(Date.now() / 1000);
  if (now - (_tState.lastInsightTs || 0) > INSIGHT_COOLDOWN) {
    fetchInsight().then(text => {
      const el = document.getElementById('trackerInsightText');
      if (el) el.textContent = text;
    });
  }
}
 
function updateScoreUI(score) {
  const el = document.getElementById('trackerScoreHeader');
  if (el) el.textContent = score;
  renderInsightPanel();
}
 
function updateIdleUI(isIdle) {
  const stat = document.getElementById('trackerIdleStat');
  if (stat) stat.classList.toggle('idle-active', isIdle);
}
 
function showDistractionNudge(seconds) {
  // Inject a transient nudge toast using the app's existing toast container
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const appState = _getAppState?.();
  const vibe = appState?.profile?.coachVibe || 'zen';
  const msgs = {
    zen: `You were away ${seconds}s. Welcome back — one task at a time.`,
    hype: `${seconds}s gone! Snap back — every second counts!`,
    drill: `${seconds}s lost to distraction. Lock in NOW.`
  };
  const toast = document.createElement('div');
  toast.className = 'toast-alert distraction';
  toast.innerHTML = `<div class="toast-alert-title">📵 Distraction logged</div><div class="toast-alert-body">${msgs[vibe]}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
 
// ─── ROLLOVER ────────────────────────────────────────────────────────────────
function rolloverIfNewDay() {
  const today = todayKey();
  if (_tState.today !== today) {
    closeSession();
    _tState.today = today;
    _tState.sessions = [];
    startSession();
    save();
  }
}
 
// ─── HELPERS ─────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}