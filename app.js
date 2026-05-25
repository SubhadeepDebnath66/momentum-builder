import { db } from './db.js';
import { audio } from './audio.js';
import { generateRoadmap } from './generator.js';
import { getInitialCompetitors, simulateCompetitorProgress } from './leaderboard.js';
import { tracker } from './tracker.js';
 
const DISABLE_FLOW_NOTIFICATIONS = true;
const FLOW_CIRCUMFERENCE = 326.7;
const COACH_FACES = { zen: '🧘', hype: '🔥', drill: '🪖' };
const COACH_NAMES = { zen: 'Zen Master', hype: 'Hype Coach', drill: 'Drill Sergeant' };
 
let state = null;
let timerInterval = null;
let timerSeconds = 300;
let sprintTotalSeconds = 300;
let timerRunning = false;
let flowMultiplier = 1;
let sprintCoinsEarned = 0;
let activeStoryCompetitorIndex = 0;
 
const onboardingPanel = document.getElementById('onboardingPanel');
const onboardingForm = document.getElementById('onboardingForm');
const selectOccupation = document.getElementById('selectOccupation');
const labelInstitution = document.getElementById('labelInstitution');
const inputInstitution = document.getElementById('inputInstitution');
const btnSubmitOnboarding = document.getElementById('btnSubmitOnboarding');
const aiConsole = document.getElementById('aiConsole');
const consoleBody = document.getElementById('consoleBody');
const appHeader = document.getElementById('appHeader');
const dashboardPanel = document.getElementById('dashboardPanel');
const missionCompletePanel = document.getElementById('missionCompletePanel');
const btnResetAll = document.getElementById('btnResetAll');
const lblLevel = document.getElementById('lblLevel');
const barXP = document.getElementById('barXP');
const lblXP = document.getElementById('lblXP');
const lblCoins = document.getElementById('lblCoins');
const lblStreak = document.getElementById('lblStreak');
const lblShields = document.getElementById('lblShields');
const lblMissionTitle = document.getElementById('lblMissionTitle');
const lblMissionIdea = document.getElementById('lblMissionIdea');
const lblCoachFace = document.getElementById('lblCoachFace');
const lblCoachName = document.getElementById('lblCoachName');
const timelineNodes = document.getElementById('timelineNodes');
const storiesBar = document.getElementById('storiesBar');
const modalStory = document.getElementById('modalStory');
const btnExitStory = document.getElementById('btnExitStory');
const storyBarFill = document.getElementById('storyBarFill');
const lblStoryAvatar = document.getElementById('lblStoryAvatar');
const lblStoryAuthor = document.getElementById('lblStoryAuthor');
const lblStoryAuthorSub = document.getElementById('lblStoryAuthorSub');
const imgStoryProofCanvas = document.getElementById('imgStoryProofCanvas');
const lblStoryCaption = document.getElementById('lblStoryCaption');
const lblStoryLikes = document.getElementById('lblStoryLikes');
const btnLikeStory = document.getElementById('btnLikeStory');
const btnReactionStory = document.getElementById('btnReactionStory');
const lblStoryComments = document.getElementById('lblStoryComments');
const lblFocusDay = document.getElementById('lblFocusDay');
const lblFocusPhaseName = document.getElementById('lblFocusPhaseName');
const lblFocusDesc = document.getElementById('lblFocusDesc');
const checklistItems = document.getElementById('checklistItems');
const flowProgressRing = document.getElementById('flowProgressRing');
const lblTimer = document.getElementById('lblTimer');
const lblMultiplier = document.getElementById('lblMultiplier');
const btnToggleTimer = document.getElementById('btnToggleTimer');
const checkFocusSound = document.getElementById('checkFocusSound');
const lblSprintCoins = document.getElementById('lblSprintCoins');
const lblSprintProgress = document.getElementById('lblSprintProgress');
const coinStreamTarget = document.getElementById('coinStreamTarget');
const btnEmergency = document.getElementById('btnEmergency');
const modalEmergency = document.getElementById('modalEmergency');
const btnExitEmergency = document.getElementById('btnExitEmergency');
const emergencyBody = document.getElementById('emergencyBody');
const proofDropzone = document.getElementById('proofDropzone');
const inputProofFile = document.getElementById('inputProofFile');
const lblUploadStatus = document.getElementById('lblUploadStatus');
const imgProofPreview = document.getElementById('imgProofPreview');
const textReflection = document.getElementById('textReflection');
const btnSubmitProof = document.getElementById('btnSubmitProof');
const leaderboardList = document.getElementById('leaderboardList');
const activityFeed = document.getElementById('activityFeed');
const toastContainer = document.getElementById('toastContainer');
const btnBuyShield = document.getElementById('btnBuyShield');
const btnBuyPink = document.getElementById('btnBuyPink');
const btnBuyBinaural = document.getElementById('btnBuyBinaural');
const modalScanner = document.getElementById('modalScanner');
const lblScannerText = document.getElementById('lblScannerText');
const scannerLogs = document.getElementById('scannerLogs');
const btnAdvanceDay = document.getElementById('btnAdvanceDay');
const btnStartNewMission = document.getElementById('btnStartNewMission');
const completeSummaryXP = document.getElementById('completeSummaryXP');
const completeSummaryStreak = document.getElementById('completeSummaryStreak');
const completeSummaryDays = document.getElementById('completeSummaryDays');
const completeSummaryIdea = document.getElementById('completeSummaryIdea');
// Sprint duration buttons
const btnSprint5 = document.getElementById('btnSprint5');
const btnSprint25 = document.getElementById('btnSprint25');
const btnSprint45 = document.getElementById('btnSprint45');
 
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const on = (el, event, fn) => { if (el) el.addEventListener(event, fn); };
 
function init() {
  state = db.load();
  setupEventListeners();
  if ('Notification' in window) Notification.requestPermission();
  document.body.className = state.activeTheme === 'pink' ? 'theme-pink' : 'theme-default';
  if (state.profile) showDashboard();
  else showOnboarding();
  tracker.init(() => state, (s) => db.save(s));
  setInterval(() => {
    if (!state?.profile) return;
    state.competitors = simulateCompetitorProgress(state.competitors);
    db.save(state);
    renderSidebar();
    renderStoriesRow();
  }, 22000);
}
 
function setupEventListeners() {
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('button, .task-item, .shop-item, input[type="checkbox"], .story-circle')) {
      audio.playClick();
    }
  });
 
  on(selectOccupation, 'change', () => {
    const value = selectOccupation.value;
    if (value === 'student') {
      labelInstitution.textContent = 'College / University Name';
      inputInstitution.placeholder = 'e.g. Stanford University';
    } else if (value === 'professional') {
      labelInstitution.textContent = 'Job Title & Company';
      inputInstitution.placeholder = 'e.g. Product Manager at Google';
    } else {
      labelInstitution.textContent = 'Startup / Target Domain';
      inputInstitution.placeholder = 'e.g. FinTech, B2B SaaS';
    }
  });
 
  on(btnResetAll, 'click', () => {
    if (confirm('Reset your mission? All streak stats, XP, and roadmaps will be lost.')) {
      state = db.reset();
      showOnboarding();
    }
  });
 
  on(onboardingForm, 'submit', handleOnboarding);
  on(btnToggleTimer, 'click', toggleTimer);
  on(checkFocusSound, 'change', () => {
    if (checkFocusSound.checked) audio.startFocusHum();
    else audio.stopFocusHum();
  });
  on(btnEmergency, 'click', launchEmergency);
  on(btnExitEmergency, 'click', closeEmergency);
  on(proofDropzone, 'click', () => inputProofFile?.click());
  on(inputProofFile, 'change', handleProofSelect);
  on(btnSubmitProof, 'click', runProofScanVerification);
  on(btnBuyShield, 'click', () => buyShopItem('shield', 100));
  on(btnBuyPink, 'click', () => buyShopItem('theme-pink', 80));
  on(btnBuyBinaural, 'click', () => buyShopItem('sound-binaural', 60));
  on(btnExitStory, 'click', closeStoryViewer);
  on(btnLikeStory, 'click', handleStoryLike);
  on(btnReactionStory, 'click', handleStoryLike);
  on(btnAdvanceDay, 'click', advanceDay);
  on(btnStartNewMission, 'click', () => { state = db.reset(); showOnboarding(); });
  document.addEventListener('visibilitychange', handleTabVisibilityChange);
 
  // Sprint duration presets
  on(btnSprint5, 'click', () => setSprintDuration(5));
  on(btnSprint25, 'click', () => setSprintDuration(25));
  on(btnSprint45, 'click', () => setSprintDuration(45));
}
 
function setSprintDuration(minutes) {
  if (timerRunning) return;
  sprintTotalSeconds = minutes * 60;
  timerSeconds = sprintTotalSeconds;
  // Update active button state
  [btnSprint5, btnSprint25, btnSprint45].forEach(btn => btn?.classList.remove('active'));
  const map = { 5: btnSprint5, 25: btnSprint25, 45: btnSprint45 };
  map[minutes]?.classList.add('active');
  updateTimerUI();
}
 
function showOnboarding() {
  onboardingPanel?.classList.remove('hidden');
  aiConsole?.classList.add('hidden');
  appHeader?.classList.add('hidden');
  dashboardPanel?.classList.add('hidden');
  missionCompletePanel?.classList.add('hidden');
  onboardingForm?.reset();
  btnSubmitOnboarding?.classList.remove('hidden');
}
 
function showDashboard() {
  onboardingPanel?.classList.add('hidden');
  appHeader?.classList.remove('hidden');
  dashboardPanel?.classList.remove('hidden');
  missionCompletePanel?.classList.add('hidden');
  document.body.className = state.activeTheme === 'pink' ? 'theme-pink' : 'theme-default';
  resetTimer();
  renderDashboard();
}
 
function showMissionComplete() {
  onboardingPanel?.classList.add('hidden');
  dashboardPanel?.classList.add('hidden');
  missionCompletePanel?.classList.remove('hidden');
  appHeader?.classList.remove('hidden');
 
  const daysCompleted = state.mission.roadmap.filter(d => d.status === 'completed').length;
  if (completeSummaryXP) completeSummaryXP.textContent = state.stats.xp;
  if (completeSummaryStreak) completeSummaryStreak.textContent = state.stats.currentStreak;
  if (completeSummaryDays) completeSummaryDays.textContent = daysCompleted;
  if (completeSummaryIdea) completeSummaryIdea.textContent = state.profile?.idea || '';
 
  audio.playLevelUp();
  triggerToast('Mission Complete! 🚀', 'You shipped a 5-day build. Legendary.', 'success');
}
 
async function handleOnboarding(e) {
  e.preventDefault();
  const name = document.getElementById('inputName')?.value.trim();
  const city = document.getElementById('inputCity')?.value.trim();
  const institution = inputInstitution?.value.trim();
  const idea = document.getElementById('textIdea')?.value.trim();
  if (!name || !city || !institution || !idea) {
    triggerToast('Missing fields', 'Please fill in all required fields.', 'warning');
    return;
  }
 
  btnSubmitOnboarding?.classList.add('hidden');
  aiConsole?.classList.remove('hidden');
  if (consoleBody) consoleBody.innerHTML = '';
  audio.playScanner(3.5);
 
  const logs = [
    { text: '[AI Engine] Initializing Claude planning agent...', type: 'input' },
    { text: `[AI Engine] Analyzing: ${name} | ${city}`, type: 'system' },
    { text: `[AI Engine] Concept: "${idea}"`, type: 'system' },
    { text: '[AI Engine] Generating personalized 5-day roadmap via AI...', type: 'system' },
  ];
  for (const log of logs) {
    const line = document.createElement('div');
    line.className = `console-line ${log.type || ''}`;
    line.textContent = log.text;
    consoleBody?.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
    await sleep(280);
  }
 
  const profile = {
    name, city, institution, idea,
    occupation: selectOccupation?.value,
    progressLevel: document.getElementById('selectProgress')?.value,
    budget: document.getElementById('selectBudget')?.value,
    time: document.getElementById('selectTime')?.value,
    skillLevel: document.getElementById('selectSkill')?.value,
    coachVibe: document.getElementById('selectCoach')?.value,
    selectCategory: document.getElementById('selectCategory')?.value
  };
 
  // Show a "waiting on AI" line
  const waitLine = document.createElement('div');
  waitLine.className = 'console-line system';
  waitLine.textContent = '[AI Engine] Contacting Claude API...';
  consoleBody?.appendChild(waitLine);
 
  const roadmap = await generateRoadmap(profile);
 
  waitLine.textContent = '[AI Engine] Roadmap personalized. Mission Ready.';
  waitLine.className = 'console-line done';
  await sleep(400);
 
  state.profile = profile;
  state.mission.isGenerated = true;
  state.mission.currentDay = 1;
  state.mission.roadmap = roadmap;
  state.competitors = getInitialCompetitors(profile.selectCategory || 'SaaS');
  state.stats.lastActiveDate = getTodayDateString();
  db.save(state);
  audio.playSuccess();
  showDashboard();
  triggerToast('Mission Activated!', `Welcome ${name}! Your AI roadmap is ready.`, 'success');
}
 
function renderDashboard() {
  if (!state?.profile) return;
  const vibe = state.profile.coachVibe || 'zen';
  if (lblCoachFace) lblCoachFace.textContent = COACH_FACES[vibe] || COACH_FACES.zen;
  if (lblCoachName) lblCoachName.textContent = COACH_NAMES[vibe] || 'Coach';
  if (lblMissionIdea) lblMissionIdea.textContent = state.profile.idea;
 
  if (lblLevel) lblLevel.textContent = state.stats.level;
  if (lblCoins) lblCoins.textContent = state.stats.coins;
  if (lblStreak) lblStreak.textContent = state.stats.currentStreak;
  if (lblShields) lblShields.textContent = state.stats.shieldsCount;
  const nextLevelXP = state.stats.level * 250;
  if (barXP) barXP.style.width = `${Math.min(100, (state.stats.xp / nextLevelXP) * 100)}%`;
  if (lblXP) lblXP.textContent = `${state.stats.xp} / ${nextLevelXP} XP`;
 
  renderTimeline();
  renderChecklist();
  renderStoriesRow();
  renderSidebar();
  updateShopUI();
  updateAdvanceDayButton();
}
 
function updateAdvanceDayButton() {
  if (!btnAdvanceDay) return;
  const day = getActiveDay();
  const allDone = day?.steps.every(s => s.done);
  const isLastDay = state.mission.currentDay >= 5;
  const lastDayComplete = isLastDay && day?.status === 'completed';
 
  if (lastDayComplete) {
    btnAdvanceDay.textContent = 'View Mission Summary';
    btnAdvanceDay.disabled = false;
  } else if (allDone && !isLastDay) {
    btnAdvanceDay.textContent = `Advance to Day ${state.mission.currentDay + 1} →`;
    btnAdvanceDay.disabled = false;
    btnAdvanceDay.classList.add('btn-ready');
  } else {
    btnAdvanceDay.textContent = 'Complete all tasks to advance';
    btnAdvanceDay.disabled = true;
    btnAdvanceDay.classList.remove('btn-ready');
  }
}
 
function getActiveDay() {
  return state.mission.roadmap.find((d) => d.day === state.mission.currentDay);
}
 
function renderTimeline() {
  if (!timelineNodes) return;
  timelineNodes.innerHTML = '';
  state.mission.roadmap.forEach((day) => {
    const node = document.createElement('div');
    node.className = 'node';
    if (day.day < state.mission.currentDay || day.status === 'completed') node.classList.add('completed');
    if (day.day === state.mission.currentDay) node.classList.add('active');
    node.innerHTML = `<div class="node-circle">${day.day}</div><div class="node-label">Day ${day.day}</div>`;
    timelineNodes.appendChild(node);
  });
}
 
function renderChecklist() {
  const day = getActiveDay();
  if (!day || !checklistItems) return;
  if (lblMissionTitle) lblMissionTitle.textContent = day.name;
  if (lblFocusDay) lblFocusDay.textContent = `DAY ${day.day}`;
  if (lblFocusPhaseName) lblFocusPhaseName.textContent = day.name;
  if (lblFocusDesc) lblFocusDesc.innerHTML = day.description;
 
  checklistItems.innerHTML = '';
  day.steps.forEach((step) => {
    const item = document.createElement('div');
    item.className = `task-item${step.done ? ' checked' : ''}`;
    item.dataset.stepId = step.id;
    item.innerHTML = `
      <div class="task-checkbox-wrapper">
        <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-text">${step.text}</div>`;
    item.addEventListener('click', () => toggleStepCheckbox(step.id));
    checklistItems.appendChild(item);
  });
}
 
function toggleStepCheckbox(stepId) {
  const day = getActiveDay();
  if (!day) return;
  const step = day.steps.find((s) => s.id === stepId);
  if (!step) return;
  step.done = !step.done;
  if (step.done) {
    state.stats.xp += 25;
    state.stats.coins += 10;
    audio.playCoins();
    tracker.onTaskComplete();
    triggerCoachFaceReaction('happy');
    checkLevelUpTrigger();
    const allDone = day.steps.every((s) => s.done);
    if (allDone) {
      // Only update streak once per day
      const today = getTodayDateString();
      if (state.stats.lastActiveDate !== today) {
        updateStreakOnDayCompletion();
      }
      triggerToast('Day Complete!', 'Great work! You can now advance to the next day.', 'success');
    }
  } else {
    triggerCoachFaceReaction('sad');
  }
  db.save(state);
  renderDashboard();
}
 
function triggerCoachFaceReaction(mood) {
  if (!lblCoachFace) return;
  lblCoachFace.classList.remove('happy', 'sad');
  if (mood === 'happy' || mood === 'sad') {
    lblCoachFace.classList.add(mood);
    setTimeout(() => lblCoachFace.classList.remove(mood), 800);
  }
}
 
function checkLevelUpTrigger() {
  let nextLevelXP = state.stats.level * 250;
  while (state.stats.xp >= nextLevelXP) {
    state.stats.xp -= nextLevelXP;
    state.stats.level += 1;
    nextLevelXP = state.stats.level * 250;
    audio.playLevelUp();
    triggerToast('Level Up!', `You reached level ${state.stats.level}!`, 'success');
  }
}
 
function renderStoriesRow() {
  if (!storiesBar || !state.competitors?.length) return;
  storiesBar.innerHTML = '';
  state.competitors.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = `story-circle${c.story?.unread ? ' active' : ' read'}`;
    el.innerHTML = `<div class="avatar-ring"><div class="avatar-emoji">${c.story?.emoji || '🚀'}</div></div><span class="story-name">${c.name}</span>`;
    el.addEventListener('click', () => openStoryViewer(i));
    storiesBar.appendChild(el);
  });
}
 
function openStoryViewer(index) {
  activeStoryCompetitorIndex = index;
  const c = state.competitors[index];
  if (!c) return;
  c.story.unread = false;
  if (lblStoryAvatar) lblStoryAvatar.textContent = c.story.emoji;
  if (lblStoryAuthor) lblStoryAuthor.textContent = c.name;
  if (lblStoryAuthorSub) lblStoryAuthorSub.textContent = `${c.institution} · Day ${c.story.day}`;
  if (lblStoryCaption) lblStoryCaption.textContent = c.story.caption;
  if (lblStoryLikes) lblStoryLikes.textContent = c.story.likes;
  renderStoryMockScreen(c.story.screenshotType);
  if (lblStoryComments) {
    lblStoryComments.innerHTML = (c.story.comments || [])
      .map((cm) => `<div class="story-comment-line"><span class="comment-author">${cm.author}</span> ${cm.text}</div>`)
      .join('');
  }
  modalStory?.classList.remove('hidden');
  audio.playStoryPop();
  db.save(state);
  renderStoriesRow();
}
 
function renderStoryMockScreen(type) {
  if (!imgStoryProofCanvas) return;
  if (type === 'figma') {
    imgStoryProofCanvas.innerHTML = '<div class="mock-figma-screen"><div class="figma-element">Frame</div></div>';
  } else if (type === 'landing') {
    imgStoryProofCanvas.innerHTML = '<div class="mock-landing-screen"><div class="mock-landing-title">Ship Fast</div><div class="mock-landing-btn">Get Started</div></div>';
  } else {
    imgStoryProofCanvas.innerHTML = '<div class="mock-code-screen">const ship = () => launch();<br>ship();</div>';
  }
}
 
function closeStoryViewer() {
  modalStory?.classList.add('hidden');
}
 
function handleStoryLike() {
  const c = state.competitors[activeStoryCompetitorIndex];
  if (!c) return;
  c.story.likes += 1;
  if (lblStoryLikes) lblStoryLikes.textContent = c.story.likes;
  db.save(state);
}
 
function renderSidebar() {
  if (!leaderboardList) return;
  const entries = [
    { name: state.profile?.name || 'You', institution: state.profile?.institution || '', xp: state.stats.xp, streak: state.stats.currentStreak, me: true },
    ...state.competitors.map((c) => ({ name: c.name, institution: c.institution, xp: c.xp, streak: c.streak, me: false }))
  ].sort((a, b) => b.xp - a.xp);
 
  leaderboardList.innerHTML = entries
    .map((e, i) => `
    <div class="leaderboard-item${e.me ? ' me' : ''}">
      <div class="rank-avatar"><span class="rank-num">${i + 1}</span>
        <div class="user-tag"><span class="user-name">${e.name}</span><span class="user-sub">${e.institution}</span></div>
      </div>
      <div class="rank-score"><span class="score-xp">${e.xp} XP</span><span class="score-streak">🔥 ${e.streak}</span></div>
    </div>`).join('');
 
  if (activityFeed) {
    activityFeed.innerHTML = state.competitors.slice(0, 6)
      .map((c) => `<div class="activity-log"><span class="peer-name">${c.name}</span> ${c.lastActivity}</div>`)
      .join('');
  }
}
 
function updateShopUI() {
  const owned = state.unlockedShopItems || [];
  document.getElementById('shopPink')?.classList.toggle('owned', owned.includes('theme-pink'));
  document.getElementById('shopBinaural')?.classList.toggle('owned', owned.includes('sound-binaural'));
}
 
function resetTimer() {
  timerSeconds = sprintTotalSeconds;
  timerRunning = false;
  flowMultiplier = 1;
  sprintCoinsEarned = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  updateTimerUI();
  if (btnToggleTimer) btnToggleTimer.textContent = 'Start Sprint';
  // Set 25min as default active
  btnSprint25?.classList.add('active');
  sprintTotalSeconds = 25 * 60;
  timerSeconds = sprintTotalSeconds;
  updateTimerUI();
}
 
function updateTimerUI() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  if (lblTimer) lblTimer.textContent = `${m}:${s}`;
  if (lblMultiplier) lblMultiplier.textContent = `${flowMultiplier.toFixed(1)}x FLOW`;
  const progress = 1 - timerSeconds / sprintTotalSeconds;
  if (flowProgressRing) flowProgressRing.style.strokeDashoffset = String(FLOW_CIRCUMFERENCE * (1 - progress));
  if (lblSprintProgress) lblSprintProgress.textContent = `${Math.round(progress * 100)}%`;
  if (lblSprintCoins) lblSprintCoins.textContent = sprintCoinsEarned;
}
 
function toggleTimer() {
  if (timerRunning) {
    timerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    if (btnToggleTimer) btnToggleTimer.textContent = 'Start Sprint';
    audio.stopFocusHum();
    return;
  }
  timerRunning = true;
  if (btnToggleTimer) btnToggleTimer.textContent = 'Pause Sprint';
  if (checkFocusSound?.checked) audio.startFocusHum();
  tracker.onSprintStart();
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      if (btnToggleTimer) btnToggleTimer.textContent = 'Start Sprint';
      audio.playSprintMilestone();
      tracker.onSprintEnd(sprintTotalSeconds);
      triggerToast('Sprint Complete!', `Earned ${sprintCoinsEarned} focus coins.`, 'success');
      return;
    }
    timerSeconds -= 1;
    if (timerSeconds % 30 === 0 && flowMultiplier < 3) flowMultiplier += 0.25;
    if (timerSeconds % 15 === 0) {
      const coins = Math.floor(flowMultiplier * 2);
      sprintCoinsEarned += coins;
      state.stats.coins += coins;
      createFloatingCoinIndicator(`+${coins}`);
      audio.playCoinFloat();
    }
    updateTimerUI();
  }, 1000);
}
 
function createFloatingCoinIndicator(text) {
  if (!coinStreamTarget) return;
  const el = document.createElement('span');
  el.className = 'floating-coin-particle';
  el.textContent = text;
  el.style.left = `${40 + Math.random() * 20}%`;
  coinStreamTarget.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
 
function triggerToast(title, body, type = 'success') {
  if (DISABLE_FLOW_NOTIFICATIONS && (title.includes('Flow') || title.includes('Maximum'))) return;
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast-alert ${type}`;
  toast.innerHTML = `<div class="toast-alert-title">${title}</div><div class="toast-alert-body">${body}</div>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
 
async function launchEmergency() {
  const vibe = state.profile?.coachVibe || 'zen';
  const day = getActiveDay();
  const pendingTasks = day?.steps.filter(s => !s.done).map(s => s.text) || [];
  const idea = state.profile?.idea || 'your project';
 
  // Show loading state
  if (emergencyBody) {
    emergencyBody.innerHTML = `<div class="emergency-loading"><div class="breath-circle">Thinking...</div><p style="color:var(--text-muted);margin-top:12px">Coach is preparing your plan...</p></div>`;
  }
  modalEmergency?.classList.remove('hidden');
 
  try {
    const prompt = `You are a ${vibe === 'zen' ? 'calm zen' : vibe === 'hype' ? 'high-energy hype' : 'no-nonsense drill sergeant'} startup coach.
 
A founder building "${idea}" is feeling stuck or overwhelmed right now.
 
Their pending tasks for today are:
${pendingTasks.length ? pendingTasks.map((t, i) => `${i + 1}. ${t}`).join('\n') : 'No specific tasks listed'}
 
Give them a VERY SHORT, PUNCHY unstuck strategy (3-5 sentences max). Match the ${vibe} coach personality perfectly:
- zen: calm, reassuring, one small step focus
- hype: energetic, exciting, pump them up  
- drill: blunt, direct, no excuses
 
End with ONE specific micro-action they can do in the next 2 minutes.`;
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
 
    const data = await response.json();
    const advice = data.content?.find(b => b.type === 'text')?.text || '';
 
    if (emergencyBody) {
      emergencyBody.innerHTML = `
        <p class="emergency-coach-comment">${advice.replace(/\n/g, '<br>')}</p>
        <div class="breath-circle">Breathe</div>`;
    }
  } catch (err) {
    // Fallback
    const fallbacks = {
      zen: 'Breathe. You are safe. Pick the single smallest task and do only that.',
      hype: 'You got this! Shake it off and ship one small task right now!',
      drill: 'Stand up. 10 jumping jacks. Back to the checklist. Pick task 1. NOW.'
    };
    if (emergencyBody) {
      emergencyBody.innerHTML = `<p class="emergency-coach-comment">${fallbacks[vibe]}</p><div class="breath-circle">Breathe</div>`;
    }
  }
}
 
function closeEmergency() {
  modalEmergency?.classList.add('hidden');
}
 
function handleProofSelect() {
  const file = inputProofFile?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (imgProofPreview) {
      imgProofPreview.src = ev.target.result;
      imgProofPreview.classList.remove('hidden');
    }
    if (lblUploadStatus) lblUploadStatus.textContent = file.name;
  };
  reader.readAsDataURL(file);
}
 
async function runProofScanVerification() {
  if (!inputProofFile?.files?.length) {
    triggerToast('No proof', 'Upload a screenshot first.', 'warning');
    return;
  }
  modalScanner?.classList.remove('hidden');
  if (scannerLogs) scannerLogs.innerHTML = '';
  if (lblScannerText) lblScannerText.textContent = 'SCANNING...';
  audio.playScanner(2);
 
  const scanLines = ['Checking image hash...', 'Matching UI patterns...', 'Verifying progress markers...', 'Proof validated!'];
  for (const line of scanLines) {
    await sleep(600);
    const el = document.createElement('div');
    el.className = `scan-log-line${line.includes('validated') ? ' success' : ' checking'}`;
    el.textContent = line;
    scannerLogs?.appendChild(el);
  }
 
  const day = getActiveDay();
  if (day) day.proof = { verified: true, reflection: textReflection?.value || '' };
  state.stats.xp += 50;
  state.stats.coins += 25;
  checkLevelUpTrigger();
  db.save(state);
  if (lblScannerText) lblScannerText.textContent = 'VERIFIED';
  audio.playSuccess();
  await sleep(800);
  modalScanner?.classList.add('hidden');
  renderDashboard();
  triggerToast('Proof Verified', '+50 XP and +25 coins!', 'success');
}
 
function updateStreakOnDayCompletion() {
  const today = getTodayDateString();
  const last = state.stats.lastActiveDate;
  if (!last) {
    state.stats.currentStreak = 1;
  } else {
    const diff = getDaysDifference(last, today);
    if (diff === 0) {
      /* same day — no change */
    } else if (diff === 1) {
      state.stats.currentStreak += 1;
    } else if (state.stats.shieldsCount > 0) {
      state.stats.shieldsCount -= 1;
    } else {
      state.stats.currentStreak = 1;
    }
  }
  state.stats.lastActiveDate = today;
  state.stats.longestStreak = Math.max(state.stats.longestStreak, state.stats.currentStreak);
}
 
function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}
 
function getDaysDifference(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
 
function advanceDay() {
  const day = getActiveDay();
  const isLastDay = state.mission.currentDay >= 5;
  const lastDayComplete = isLastDay && day?.status === 'completed';
 
  if (lastDayComplete) {
    showMissionComplete();
    return;
  }
 
  if (!day?.steps.every(s => s.done)) {
    triggerToast('Not yet!', 'Complete all tasks first.', 'warning');
    return;
  }
 
  const current = state.mission.roadmap.find((d) => d.day === state.mission.currentDay);
  if (current) current.status = 'completed';
  state.mission.currentDay += 1;
  const next = state.mission.roadmap.find((d) => d.day === state.mission.currentDay);
  if (next) next.status = 'active';
  db.save(state);
  audio.playSuccess();
  renderDashboard();
  triggerToast(`Day ${state.mission.currentDay} Unlocked`, 'Keep the momentum going!', 'success');
}
 
function buyShopItem(itemId, cost) {
  if (state.stats.coins < cost) {
    triggerToast('Not enough coins', `You need ${cost} focus coins.`, 'warning');
    return;
  }
  if (itemId === 'shield') {
    state.stats.coins -= cost;
    state.stats.shieldsCount += 1;
    triggerToast('Shield purchased', 'Streak protected for one missed day.', 'success');
  } else if (itemId === 'theme-pink') {
    if (state.unlockedShopItems.includes('theme-pink')) return;
    state.stats.coins -= cost;
    state.unlockedShopItems.push('theme-pink');
    state.activeTheme = 'pink';
    document.body.className = 'theme-pink';
    triggerToast('Pink theme unlocked', 'Aesthetic upgraded.', 'success');
  } else if (itemId === 'sound-binaural') {
    if (state.unlockedShopItems.includes('sound-binaural')) return;
    state.stats.coins -= cost;
    state.unlockedShopItems.push('sound-binaural');
    triggerToast('Binaural unlocked', 'Enable focus hum during sprints.', 'success');
  }
  db.save(state);
  renderDashboard();
}
 
function handleTabVisibilityChange() {
  if (!document.hidden || !state?.profile) return;
  const day = getActiveDay();
  if (!day || day.steps.every((s) => s.done)) return;
  const coachMsgs = {
    zen: 'Your mind is wandering. Return gently when ready.',
    hype: "Hey! The grind doesn't stop. Ship it!",
    drill: 'Get back to your checklist immediately!'
  };
  const msg = coachMsgs[state.profile.coachVibe] || 'Get back to building!';
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Momentum Coach Alert', { body: msg });
  }
}
 
window.onload = init;