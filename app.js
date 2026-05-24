import { db } from './db.js';
import { audio } from './audio.js';
import { generateRoadmap } from './generator.js';
import { getInitialCompetitors, simulateCompetitorProgress } from './leaderboard.js';

// Application State Cache
let state = null;
let timerInterval = null;
let timerSeconds = 300; // 5 minute focus sprint (Duolingo-style)
let sprintTotalSeconds = 300;
let timerRunning = false;

// Flow Game parameters
let flowMultiplier = 1; // 1x, 2x, 3x
let idleSeconds = 0;
let activeInteractionSeconds = 0;
let sprintCoinsEarned = 0;
let sprintXPEarned = 0;
let userActivityListener = null;

// Stories parameters
let storyInterval = null;
let activeStoryCompetitorIndex = 0;
let storyProgress = 0;
let storyPaused = false;

// DOM Elements
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
const btnResetAll = document.getElementById('btnResetAll');

// Stats Elements
const lblLevel = document.getElementById('lblLevel');
const barXP = document.getElementById('barXP');
const lblXP = document.getElementById('lblXP');
const lblCoins = document.getElementById('lblCoins');
const lblStreak = document.getElementById('lblStreak');
const lblShields = document.getElementById('lblShields');

// Banner & Map Elements
const lblMissionTitle = document.getElementById('lblMissionTitle');
const lblMissionIdea = document.getElementById('lblMissionIdea');
const lblCoachFace = document.getElementById('lblCoachFace');
const lblCoachName = document.getElementById('lblCoachName');
const timelineNodes = document.getElementById('timelineNodes');

// Stories Elements
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

// Focus Desk Elements
const lblFocusDay = document.getElementById('lblFocusDay');
const lblFocusPhaseName = document.getElementById('lblFocusPhaseName');
const lblFocusDesc = document.getElementById('lblFocusDesc');
const btnSimulateDay = document.getElementById('btnSimulateDay');
const checklistItems = document.getElementById('checklistItems');

// Timer Elements
const timerBox = document.querySelector('.timer-box');
const flowProgressRing = document.getElementById('flowProgressRing');
const lblTimer = document.getElementById('lblTimer');
const lblMultiplier = document.getElementById('lblMultiplier');
const btnToggleTimer = document.getElementById('btnToggleTimer');
const checkFocusSound = document.getElementById('checkFocusSound');
const lblSprintCoins = document.getElementById('lblSprintCoins');
const lblSprintProgress = document.getElementById('lblSprintProgress');
const coinStreamTarget = document.getElementById('coinStreamTarget');

// Emergency Elements
const btnEmergency = document.getElementById('btnEmergency');
const modalEmergency = document.getElementById('modalEmergency');
const btnExitEmergency = document.getElementById('btnExitEmergency');
const emergencyBody = document.getElementById('emergencyBody');

// Proof Elements
const proofBox = document.getElementById('proofBox');
const proofDropzone = document.getElementById('proofDropzone');
const inputProofFile = document.getElementById('inputProofFile');
const lblUploadStatus = document.getElementById('lblUploadStatus');
const imgProofPreview = document.getElementById('imgProofPreview');
const textReflection = document.getElementById('textReflection');
const btnSubmitProof = document.getElementById('btnSubmitProof');

// Sidebar Elements
const leaderboardList = document.getElementById('leaderboardList');
const activityFeed = document.getElementById('activityFeed');
const toastContainer = document.getElementById('toastContainer');

// Shop Elements
const btnBuyShield = document.getElementById('btnBuyShield');
const btnBuyPink = document.getElementById('btnBuyPink');
const btnBuyBinaural = document.getElementById('btnBuyBinaural');

// Modal Scanner Elements
const modalScanner = document.getElementById('modalScanner');
const lblScannerText = document.getElementById('lblScannerText');
const scannerLogs = document.getElementById('scannerLogs');

// Helper to delay executions (typewriter feel)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
function init() {
  state = db.load();
  setupEventListeners();
  requestBrowserNotificationPermission();
  
  // Set theme from state
  document.body.className = state.activeTheme === 'pink' ? 'theme-pink' : 'theme-default';

  if (state.profile) {
    showDashboard();
  } else {
    showOnboarding();
  }

  // Periodic Leaderboard Simulator
  setInterval(() => {
    if (state.profile) {
      state.competitors = simulateCompetitorProgress(state.competitors);
      db.save(state);
      renderSidebar();
      renderStoriesRow();
    }
  }, 22000);
}

function setupEventListeners() {
  // Click sound helper
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('.task-item') || e.target.closest('.shop-item') || e.target.closest('input[type="checkbox"]') || e.target.closest('.story-circle')) {
      audio.playClick();
    }
  });

  // Onboarding occupation label toggle
  selectOccupation.addEventListener('change', () => {
    const value = selectOccupation.value;
    if (value === 'student') {
      labelInstitution.innerText = 'College / University Name';
      inputInstitution.placeholder = 'e.g. Stanford University';
    } else if (value === 'professional') {
      labelInstitution.innerText = 'Job Title & Company';
      inputInstitution.placeholder = 'e.g. Product Manager at Google';
    } else {
      labelInstitution.innerText = 'Startup / Target Domain';
      inputInstitution.placeholder = 'e.g. FinTech, B2B SaaS';
    }
  });

  // Reset Mission Button
  btnResetAll.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your mission? You will lose all streak stats, XP, and roadmaps.")) {
      state = db.reset();
      showOnboarding();
    }
  });

  // Onboarding Submit
  onboardingForm.addEventListener('submit', handleOnboarding);

  // Timer Start/Stop
  btnToggleTimer.addEventListener('click', toggleTimer);

  // Focus sound toggle
  checkFocusSound.addEventListener('change', () => {
    if (checkFocusSound.checked) {
      audio.startFocusHum();
    } else {
      audio.stopFocusHum();
    }
  });

  // Procrastination Emergency
  btnEmergency.addEventListener('click', launchEmergency);
  btnExitEmergency.addEventListener('click', closeEmergency);

  // Simulation day switch
  btnSimulateDay.addEventListener('click', advanceDaySimulated);

  // Proof Image Upload Trigger
  proofDropzone.addEventListener('click', () => {
    inputProofFile.click();
  });
  inputProofFile.addEventListener('change', handleProofSelect);

  // Drag-and-drop proof upload
  proofDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    proofDropzone.style.borderColor = 'var(--primary)';
  });
  proofDropzone.addEventListener('dragleave', () => {
    proofDropzone.style.borderColor = 'var(--glass-border)';
  });
  proofDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    proofDropzone.style.borderColor = 'var(--glass-border)';
    if (e.dataTransfer.files.length) {
      inputProofFile.files = e.dataTransfer.files;
      handleProofSelect();
    }
  });

  // Proof Submit
  btnSubmitProof.addEventListener('click', runProofScanVerification);

  // Shop Purchases
  btnBuyShield.addEventListener('click', () => buyShopItem('shield', 100));
  btnBuyPink.addEventListener('click', () => buyShopItem('theme-pink', 80));
  btnBuyBinaural.addEventListener('click', () => buyShopItem('sound-binaural', 60));

  // Stories slide event locks
  btnExitStory.addEventListener('click', closeStoryViewer);
  btnLikeStory.addEventListener('click', handleStoryLike);
  btnReactionStory.addEventListener('click', handleStoryLike);

  // Tab change detection for notification prompts
  document.addEventListener('visibilitychange', handleTabVisibilityChange);
}

/* ==========================================================================
   VIEW SWITCHERS
   ========================================================================== */
function showOnboarding() {
  onboardingPanel.classList.remove('hidden');
  aiConsole.classList.add('hidden');
  appHeader.classList.add('hidden');
  dashboardPanel.classList.add('hidden');
  onboardingForm.reset();
}

function showDashboard() {
  onboardingPanel.classList.add('hidden');
  appHeader.classList.remove('hidden');
  dashboardPanel.classList.remove('hidden');
  
  // Apply visual theme
  document.body.className = state.activeTheme === 'pink' ? 'theme-pink' : 'theme-default';
  
  // Set Timer Default
  resetTimer();

  renderDashboard();
}

/* ==========================================================================
   NOTIFICATION PERMISSION & TRIGGERS
   ========================================================================== */
function requestBrowserNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: "file:///C:/Users/subhadeep/.gemini/antigravity/scratch/momentum-builder/favicon.ico"
    });
  }
}

function handleTabVisibilityChange() {
  if (document.hidden && state.profile) {
    // Check if active day has incomplete steps
    const activeDayNum = state.mission.currentDay;
    const activeDayData = state.mission.roadmap.find(d => d.day === activeDayNum);
    const incomplete = activeDayData.steps.some(s => !s.done);
    
    if (incomplete) {
      const coachMsgs = {
        zen: "Your mind is wandering. Return to your tasks gently when ready.",
        hype: "Hey! Bro, where are you going? The grind doesn't stop. Ship it!",
        drill: "ATTENTION! Get back to your checklist immediately. No slacking off!"
      };
      const msg = coachMsgs[state.profile.coachVibe] || "Get back to building your startup!";
      sendBrowserNotification(`Momentum Coach Alert`, `${msg}`);
    }
  }
}

/* ==========================================================================
   ONBOARDING LOG FLOW (SIMULATED AI)
   ========================================================================== */
async function handleOnboarding(e) {
  e.preventDefault();
  
  const name = document.getElementById('inputName').value.trim();
  const city = document.getElementById('inputCity').value.trim();
  const occupation = selectOccupation.value;
  const institution = inputInstitution.value.trim();
  const idea = document.getElementById('textIdea').value.trim();
  const progressLevel = document.getElementById('selectProgress').value;
  const budget = document.getElementById('selectBudget').value;
  const time = document.getElementById('selectTime').value;
  const skillLevel = document.getElementById('selectSkill').value;
  const coachVibe = document.getElementById('selectCoach').value;

  if (!name || !city || !institution || !idea) return;

  // Reveal Console and hide button
  btnSubmitOnboarding.classList.add('hidden');
  aiConsole.classList.remove('hidden');
  consoleBody.innerHTML = '';

  // Play scanner/sound
  audio.playScanner(3.5);

  const logs = [
    { text: `[AI Engine] Initializing planning agents...`, type: 'input' },
    { text: `[AI Engine] Analyzing startup constraints: Name: ${name} | Location: ${city}`, type: 'system' },
    { text: `[AI Engine] Core concept resolved: "${idea}"`, type: 'system' },
    { text: `[AI Engine] Checking progress indicators: "${progressLevel}" matched.`, type: 'system' },
    { text: `[AI Engine] Factoring budget boundaries: CAP $${budget}. Auto-selecting free-tier endpoints...`, type: 'system' },
    { text: `[AI Engine] Aligning daily free-time quota: ${time === '15m' ? '15m Micro-Sprint Mode' : time}.`, type: 'system' },
    { text: `[AI Engine] Checking technical proficiency: "${skillLevel}" stack configuration selected.`, type: 'system' },
    { text: `[AI Engine] Assigning personality coach template: "${coachVibe.toUpperCase()}"`, type: 'system' },
    { text: `[AI Engine] Constructing frictionless 5-day roadmap nodes...`, type: 'system' },
    { text: `[AI Engine] Writing Day 1 custom stress-test prompts for Claude validation...`, type: 'system' },
    { text: `[AI Engine] Seeding cohort peers workspace sync logs...`, type: 'system' },
    { text: `[AI Engine] Generating database configurations... COMPLETE.`, type: 'done' }
  ];

  for (const log of logs) {
    const line = document.createElement('div');
    line.className = `console-line ${log.type || ''}`;
    line.innerText = log.text;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
    await sleep(280);
  }

  await sleep(600);

  // Setup Profile State
  const profile = { name, city, occupation, institution, idea, progressLevel, budget, time, skillLevel, coachVibe };
  const roadmap = generateRoadmap(profile);
  const competitors = getInitialCompetitors(profile.selectCategory || 'SaaS');

  state.profile = profile;
  state.mission.isGenerated = true;
  state.mission.currentDay = 1;
  state.mission.roadmap = roadmap;
  state.competitors = competitors;
  state.stats.lastActiveDate = getTodayDateString();

  if (!state.stats.xp) state.stats.xp = 0;
  if (!state.stats.level) state.stats.level = 1;
  if (!state.stats.coins) state.stats.coins = 50;

  db.save(state);
  
  // Transition to Dashboard
  audio.playSuccess();
  showDashboard();

  triggerToast("Mission Activated!", `Welcome ${name}! Day 1 is now active. Complete tasks to level up!`, "success");
}

/* ==========================================================================
   DASHBOARD RENDERING
   ========================================================================== */
function renderDashboard() {
  if (!state.profile) return;

  // Stats Card
  lblLevel.innerText = state.stats.level;
  lblCoins.innerText = state.stats.coins;
  lblStreak.innerText = state.stats.currentStreak;
  lblShields.innerText = state.stats.shieldsCount;

  // XP Progress Calculation
  const nextLevelXP = state.stats.level * 250;
  const xpPercent = Math.min(100, (state.stats.xp / nextLevelXP) * 100);
  barXP.style.width = `${xpPercent}%`;
  lblXP.innerText = `${state.stats.xp} / ${nextLevelXP} XP`;

  // Mission Info
  const catNames = { SaaS: "SaaS Application", MobileApp: "Mobile App", ContentCreation: "Content Creator Startup", Research: "Academic Research Plan", Event: "Community Event Platform" };
  lblMissionTitle.innerText = `Project: ${catNames[state.profile.selectCategory] || "SaaS App Build"}`;
  lblMissionIdea.innerText = `"${state.profile.idea}"`;

  // Coach Display
  const coachAvatars = { zen: "🧘‍♂️", hype: "🚀", drill: "🪖" };
  const coachNames = { zen: "Zen Mindful Master", hype: "Hype Beast VC Bro", drill: "Drill Sergeant Sgt. Grip" };
  lblCoachFace.innerText = coachAvatars[state.profile.coachVibe] || "🧘‍♂️";
  lblCoachName.innerText = coachNames[state.profile.coachVibe] || "Zen Master";

  // Timeline Nodes
  timelineNodes.innerHTML = '';
  state.mission.roadmap.forEach((dayData) => {
    const node = document.createElement('div');
    node.className = `node ${dayData.status}`;
    
    let circleContent = dayData.day;
    if (dayData.status === 'completed') {
      circleContent = '✓';
    } else if (dayData.status === 'locked') {
      circleContent = '🔒';
    }

    node.innerHTML = `
      <div class="node-circle">${circleContent}</div>
      <div class="node-label">Day ${dayData.day}</div>
    `;
    timelineNodes.appendChild(node);
  });

  // Focus Desk Active Day
  const activeDayNum = state.mission.currentDay;
  const activeDayData = state.mission.roadmap.find(d => d.day === activeDayNum) || state.mission.roadmap[0];

  lblFocusDay.innerText = `DAY ${activeDayData.day}`;
  lblFocusPhaseName.innerText = activeDayData.name;
  lblFocusDesc.innerHTML = activeDayData.description;

  // Render Daily Checklist steps
  checklistItems.innerHTML = '';
  let allDone = true;

  activeDayData.steps.forEach((step) => {
    if (!step.done) allDone = false;

    const taskCard = document.createElement('div');
    taskCard.className = `task-item ${step.done ? 'checked' : ''}`;
    taskCard.innerHTML = `
      <div class="task-checkbox-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <span class="task-text">${step.text}</span>
    `;

    taskCard.addEventListener('click', () => toggleStepCheckbox(step.id));
    checklistItems.appendChild(taskCard);
  });

  // Show Proof Area if all completed
  if (allDone && activeDayData.status !== 'completed') {
    proofBox.classList.remove('hidden');
    setTimeout(() => {
      proofBox.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  } else {
    proofBox.classList.add('hidden');
  }

  renderStoriesRow();
  renderSidebar();
}

/* ==========================================================================
   STORIES COMPONENT VIEW
   ========================================================================== */
function renderStoriesRow() {
  // Clear other stories except My Story
  const peerStories = storiesBar.querySelectorAll('.story-circle:not(.my-story)');
  peerStories.forEach(s => s.remove());

  // Setup My Story
  const myStoryEl = document.getElementById('storyUser');
  const activeDayNum = state.mission.currentDay;
  const activeDayData = state.mission.roadmap.find(d => d.day === activeDayNum);
  
  if (activeDayData && activeDayData.status === 'completed' && activeDayData.proof) {
    myStoryEl.className = "story-circle my-story read";
    myStoryEl.querySelector('.avatar-emoji').innerText = "✅";
    myStoryEl.onclick = () => {
      openStoryViewer(-1); // Open my proof story
    };
  } else {
    myStoryEl.className = "story-circle my-story";
    myStoryEl.querySelector('.avatar-emoji').innerText = "👤";
    myStoryEl.onclick = () => {
      alert("Submit today's screenshot proof to upload your story!");
    };
  }

  // Inject Competitors Stories
  state.competitors.forEach((c, index) => {
    const bubble = document.createElement('div');
    bubble.className = `story-circle ${c.story.unread ? 'active' : 'read'}`;
    bubble.innerHTML = `
      <div class="avatar-ring">
        <span class="avatar-emoji">${c.story.emoji}</span>
      </div>
      <span class="story-name">${c.name}</span>
    `;
    bubble.onclick = () => {
      c.story.unread = false;
      db.save(state);
      renderStoriesRow();
      openStoryViewer(index);
    };
    storiesBar.appendChild(bubble);
  });
}

function openStoryViewer(index) {
  audio.playClick();
  modalStory.classList.remove('hidden');
  activeStoryCompetitorIndex = index;
  storyProgress = 0;
  storyPaused = false;
  storyBarFill.style.width = '0%';
  
  renderStoryContent();
  startStoryTimer();
}

function renderStoryContent() {
  const index = activeStoryCompetitorIndex;
  
  if (index === -1) {
    // Render My Proof Story
    const activeDayNum = state.mission.currentDay;
    const activeDayData = state.mission.roadmap.find(d => d.day === activeDayNum);

    lblStoryAvatar.innerText = "👤";
    lblStoryAuthor.innerText = `${state.profile.name} (You)`;
    lblStoryAuthorSub.innerText = `${state.profile.institution} | Day ${activeDayNum} Proof`;
    lblStoryLikes.innerText = "0";

    // Draw My Image proof
    imgProofPreview.classList.add('hidden');
    imgStoryProofCanvas.innerHTML = `<img src="${activeDayData.proof.image}" style="width: 100%; height: 100%; object-fit: contain;">`;
    lblStoryCaption.innerText = activeDayData.proof.reflection;
    lblStoryComments.innerHTML = '<div class="story-comment-line">No comments yet. Your cohort will see this story!</div>';
    return;
  }

  const comp = state.competitors[index];
  const story = comp.story;

  lblStoryAvatar.innerText = story.emoji;
  lblStoryAuthor.innerText = comp.name;
  lblStoryAuthorSub.innerText = `${comp.institution} | Day ${story.day} Sprint`;
  lblStoryCaption.innerText = story.caption;
  lblStoryLikes.innerText = story.likes;

  // Draw procedural mock screenshots instead of static images
  imgStoryProofCanvas.innerHTML = '';
  const canvas = document.createElement('div');
  
  if (story.screenshotType === 'code') {
    canvas.className = 'mock-code-screen';
    canvas.innerHTML = `
      <span style="color:#60a5fa">// Seeding DB for ${comp.idea.substring(0,18)}</span><br>
      const db = require('db');<br>
      const router = express.Router();<br><br>
      router.post('/validate', async (req, res) => {<br>
      &nbsp;&nbsp;console.log("AI Analyzer online...");<br>
      &nbsp;&nbsp;return res.json({ painLevel: 'CRITICAL' });<br>
      });
    `;
  } else if (story.screenshotType === 'figma') {
    canvas.className = 'mock-figma-screen';
    canvas.innerHTML = `
      <div class="figma-element">Desk</div>
      <div class="figma-element">Timer</div>
      <div class="figma-element">Store</div>
    `;
  } else {
    canvas.className = 'mock-landing-screen';
    canvas.innerHTML = `
      <div class="mock-landing-title">${comp.idea}</div>
      <div style="font-size:0.5rem;color:var(--text-muted);">Stop procrastinating. Launch today.</div>
      <div class="mock-landing-btn">Get Started Free</div>
    `;
  }
  imgStoryProofCanvas.appendChild(canvas);

  // Render Comments
  lblStoryComments.innerHTML = '';
  story.comments.forEach(c => {
    const line = document.createElement('div');
    line.className = 'story-comment-line';
    line.innerHTML = `<span class="comment-author">${c.author}:</span> ${c.text}`;
    lblStoryComments.appendChild(line);
  });
}

function startStoryTimer() {
  clearInterval(storyInterval);
  storyProgress = 0;

  storyInterval = setInterval(() => {
    if (storyPaused) return;

    storyProgress += 2; // Increments by 2%
    storyBarFill.style.width = `${storyProgress}%`;

    if (storyProgress >= 100) {
      // Advance to next story
      clearInterval(storyInterval);
      if (activeStoryCompetitorIndex === -1 && state.competitors.length > 0) {
        openStoryViewer(0);
      } else if (activeStoryCompetitorIndex < state.competitors.length - 1) {
        openStoryViewer(activeStoryCompetitorIndex + 1);
      } else {
        closeStoryViewer();
      }
    }
  }, 100);
}

function handleStoryLike() {
  audio.playStoryPop();
  
  if (activeStoryCompetitorIndex === -1) {
    alert("You liked your own story! Self-love is good.");
    return;
  }
  
  const comp = state.competitors[activeStoryCompetitorIndex];
  comp.story.likes += 1;
  lblStoryLikes.innerText = comp.story.likes;
  
  // Random comment addition simulation
  const reactions = ["LFG! 🔥", "This interface is clean!", "Are you open sourcing?", "Massive progress!", "Let's launch together!"];
  comp.story.comments.push({
    author: `${state.profile.name} (You)`,
    text: reactions[Math.floor(Math.random() * reactions.length)]
  });
  
  db.save(state);
  renderStoryContent();
  triggerToast("Story Liked!", `Sent support reaction to ${comp.name}!`, "success");
}

function closeStoryViewer() {
  clearInterval(storyInterval);
  modalStory.classList.add('hidden');
}

/* ==========================================================================
   SIDEBAR & LEADERBOARD RENDERING
   ========================================================================== */
function renderSidebar() {
  const userXP = state.stats.xp;
  const myCompetitor = {
    name: `${state.profile.name} (You)`,
    institution: state.profile.institution,
    xp: userXP,
    streak: state.stats.currentStreak,
    level: state.stats.level,
    lastActivity: "Working on today's validation checkpoint",
    isMe: true
  };

  const list = [myCompetitor, ...state.competitors].sort((a, b) => b.xp - a.xp);

  leaderboardList.innerHTML = '';
  list.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `leaderboard-item ${item.isMe ? 'me' : ''}`;
    
    card.innerHTML = `
      <div class="rank-avatar">
        <span class="rank-num">#${index + 1}</span>
        <div class="user-tag">
          <span class="user-name">${item.name}</span>
          <span class="user-sub">${item.institution}</span>
        </div>
      </div>
      <div class="rank-score">
        <span class="score-xp">${item.xp} XP</span>
        <span class="score-streak">🔥 ${item.streak}d streak</span>
      </div>
    `;
    leaderboardList.appendChild(card);
  });

  activityFeed.innerHTML = '';
  const recentPeers = [...state.competitors].slice(0, 4);
  recentPeers.forEach(p => {
    const log = document.createElement('div');
    log.className = 'activity-log';
    log.innerHTML = `<span class="peer-name">${p.name}</span> (${p.institution}): ${p.lastActivity}`;
    activityFeed.appendChild(log);
  });

  const shopItemPink = document.getElementById('shopItemPink');
  const shopItemBinaural = document.getElementById('shopItemBinaural');

  if (state.unlockedShopItems.includes('theme-pink')) {
    shopItemPink.classList.add('owned');
    shopItemPink.querySelector('.btn-shop').innerText = 'OWNED';
  }
  if (state.unlockedShopItems.includes('sound-binaural')) {
    shopItemBinaural.classList.add('owned');
    shopItemBinaural.querySelector('.btn-shop').innerText = 'OWNED';
  }
}

/* ==========================================================================
   CHECKLIST CONTROLLER
   ========================================================================== */
function toggleStepCheckbox(stepId) {
  const activeDayNum = state.mission.currentDay;
  const activeDayData = state.mission.roadmap.find(d => d.day === activeDayNum);
  const step = activeDayData.steps.find(s => s.id === stepId);

  step.done = !step.done;

  if (step.done) {
    audio.playSuccess();
    state.stats.xp += 10;
    state.stats.coins += 5;
    triggerToast("Task Complete!", `Earned +10 XP and +5 Focus Coins!`, "success");
    
    // Animate coach facial reaction
    triggerCoachFaceReaction('happy');
    checkLevelUpTrigger();
  } else {
    state.stats.xp = Math.max(0, state.stats.xp - 10);
    state.stats.coins = Math.max(0, state.stats.coins - 5);
    triggerCoachFaceReaction('sad');
  }

  db.save(state);
  renderDashboard();
}

function triggerCoachFaceReaction(vibe) {
  lblCoachFace.className = `coach-face ${vibe}`;
  setTimeout(() => {
    lblCoachFace.className = 'coach-face';
  }, 1800);
}

function checkLevelUpTrigger() {
  const currentLevel = state.stats.level;
  const reqXP = currentLevel * 250;
  if (state.stats.xp >= reqXP) {
    state.stats.level += 1;
    state.stats.xp -= reqXP;
    audio.playLevelUp();
    
    alert(`🎉 LEVEL UP! You reached LEVEL ${state.stats.level}! +50 Focus Coins Bonus!`);
    state.stats.coins += 50;
    triggerToast("LEVEL UP!", `Reached Level ${state.stats.level}! +50 Coins!`, "success");
  }
}

/* ==========================================================================
   DUOLINGO-STYLE FLOW SPRINT TIMER GAME
   ========================================================================== */
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 300; // 5 mins SPRINT
  sprintTotalSeconds = 300;
  flowMultiplier = 1;
  idleSeconds = 0;
  activeInteractionSeconds = 0;
  sprintCoinsEarned = 0;
  sprintXPEarned = 0;

  lblTimer.innerText = "05:00";
  lblMultiplier.innerText = "1x FLOW";
  lblMultiplier.className = "multiplier-badge";
  timerBox.className = "timer-box gamified";
  
  // Reset circular SVG progress stroke
  flowProgressRing.style.strokeDashoffset = '283';
  lblSprintCoins.innerText = "+0 🪙";
  lblSprintProgress.innerText = "0%";
  
  btnToggleTimer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
    START FLOW SPRINT
  `;
  
  audio.stopFocusHum();
  checkFocusSound.checked = false;
  
  // Remove cursor movement listener
  if (userActivityListener) {
    document.removeEventListener('mousemove', userActivityListener);
    document.removeEventListener('keydown', userActivityListener);
    userActivityListener = null;
  }
}

function toggleTimer() {
  if (timerRunning) {
    // PAUSE
    clearInterval(timerInterval);
    timerRunning = false;
    btnToggleTimer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      RESUME FLOW
    `;
    audio.stopFocusHum();
    checkFocusSound.checked = false;
  } else {
    // START
    timerRunning = true;
    btnToggleTimer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      PAUSE FLOW
    `;
    
    if (checkFocusSound.checked) {
      audio.startFocusHum();
    }

    // Attach mouse activity trackers
    userActivityListener = () => {
      idleSeconds = 0;
      activeInteractionSeconds++;
      
      // Bump multiplier up to 3x based on activity
      if (activeInteractionSeconds >= 15 && flowMultiplier < 3) {
        flowMultiplier++;
        activeInteractionSeconds = 0;
        lblMultiplier.innerText = `${flowMultiplier}x FLOW`;
        if (flowMultiplier === 3) {
          timerBox.className = "timer-box gamified high-flow";
          triggerToast("Max Flow State!", "Your progressive reward multiplier is now 3x!", "success");
        } else {
          lblMultiplier.className = "multiplier-badge";
        }
      }
    };
    
    document.addEventListener('mousemove', userActivityListener);
    document.addEventListener('keydown', userActivityListener);

    timerInterval = setInterval(() => {
      timerSeconds--;
      idleSeconds++;

      // Trigger Idle Warn Nudge
      if (idleSeconds >= 12) {
        audio.playNudge();
        timerBox.classList.add('nudge-shake');
        setTimeout(() => timerBox.classList.remove('nudge-shake'), 400);

        flowMultiplier = 1;
        lblMultiplier.innerText = "1x FLOW";
        timerBox.className = "timer-box gamified";
        activeInteractionSeconds = 0;
        idleSeconds = 0;
        
        triggerToast("Flow Warning!", "Focus dropping! Shake your mouse to recover flow rate.", "warning");
      }

      // Coin Earning loop every 30 seconds
      const elapsed = sprintTotalSeconds - timerSeconds;
      if (elapsed % 30 === 0 && elapsed > 0) {
        const rewardCoins = 1 * flowMultiplier;
        sprintCoinsEarned += rewardCoins;
        sprintXPEarned += 2 * flowMultiplier;
        
        audio.playCoinFloat();
        lblSprintCoins.innerText = `+${sprintCoinsEarned} 🪙`;
        
        // Push floating coin to DOM
        createFloatingCoinIndicator(`+${rewardCoins} 🪙`);
      }

      // Check milestones (25%, 50%, 75%)
      const progressPct = Math.round((elapsed / sprintTotalSeconds) * 100);
      lblSprintProgress.innerText = `${progressPct}%`;
      
      // SVG Circle mapping
      const ringOffset = 283 - (283 * progressPct) / 100;
      flowProgressRing.style.strokeDashoffset = ringOffset;

      if ([25, 50, 75].includes(progressPct)) {
        audio.playSprintMilestone();
        triggerToast("Flow milestone!", `Milestone reached: ${progressPct}% focused!`, "success");
      }

      if (timerSeconds <= 0) {
        // Complete Sprint
        clearInterval(timerInterval);
        timerRunning = false;
        audio.playLevelUp();
        
        alert(`🏆 SPRINT COMPLETE!\nTotal Coins Earned: +${sprintCoinsEarned} 🪙\nTotal XP Earned: +${sprintXPEarned} XP`);
        
        state.stats.xp += sprintXPEarned;
        state.stats.coins += sprintCoinsEarned;
        
        checkLevelUpTrigger();
        db.save(state);
        resetTimer();
        renderDashboard();
      } else {
        const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
        const secs = (timerSeconds % 60).toString().padStart(2, '0');
        lblTimer.innerText = `${mins}:${secs}`;
      }
    }, 1000);
  }
}

function createFloatingCoinIndicator(text) {
  const particle = document.createElement('div');
  particle.className = 'floating-coin-particle';
  particle.innerText = text;
  
  // Calculate relative coordinate near flow badge
  const boxRect = timerBox.getBoundingClientRect();
  particle.style.left = `50%`;
  particle.style.top = `40%`;
  
  coinStreamTarget.appendChild(particle);
  setTimeout(() => particle.remove(), 1100);
}

/* ==========================================================================
   TOASTER NOTIFICATION ENGINE
   ========================================================================== */
function triggerToast(title, body, type = 'success') {
  const card = document.createElement('div');
  card.className = `toast-alert ${type}`;
  card.innerHTML = `
    <div class="toast-alert-title">${title}</div>
    <div class="toast-alert-body">${body}</div>
  `;
  toastContainer.appendChild(card);
  
  // Self destruct
  setTimeout(() => {
    card.style.animation = 'toast-slide-in 0.4s reverse forwards';
    setTimeout(() => card.remove(), 400);
  }, 4000);
}

/* ==========================================================================
   PROCRASTINATION EMERGENCY SYSTEM
   ========================================================================== */
function launchEmergency() {
  modalEmergency.classList.remove('hidden');
  const vibe = state.profile.coachVibe;
  
  if (vibe === 'zen') {
    // ZEN BREATHING
    emergencyBody.innerHTML = `
      <p class="emergency-coach-comment">"Procrastination is just anxiety seeking escape. Take a moment to align. Close your eyes, follow the expanding circle, and take 3 deep breaths."</p>
      <div class="breath-circle" id="breathLabel">Breathe In</div>
      <button class="btn btn-secondary" id="btnFinishZen" style="margin-top: 10px;">I FEEL CALMER NOW</button>
    `;
    
    let expand = true;
    const interval = setInterval(() => {
      const el = document.getElementById('breathLabel');
      if (el) {
        el.innerText = expand ? "Breathe Out" : "Breathe In";
        expand = !expand;
      } else {
        clearInterval(interval);
      }
    }, 4000);

    document.getElementById('btnFinishZen').onclick = () => {
      clearInterval(interval);
      closeEmergency();
    };

  } else if (vibe === 'hype') {
    // HYPE SPRINT (TYPING SPEED TEST)
    const prompts = [
      "The only way to build leverage is to write clean code or build rich media. Zero excuses.",
      "VCs invest in momentum. If you are not launching today, you are falling behind your competitors.",
      "Ship fast, break things, iterate instantly. Micro-progress beats macro-planning."
    ];
    const textPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    emergencyBody.innerHTML = `
      <p class="emergency-coach-comment">"Time to build momentum. Type this quote exactly to unlock your focus coins and break the freeze!"</p>
      <div class="typing-test-box">
        <div class="typing-prompt" id="lblTypePrompt">${textPrompt}</div>
        <textarea class="typing-input" id="inputTyping" rows="3" placeholder="Start typing the quote here..."></textarea>
        <div id="lblTypingFeedback" style="font-size: 0.8rem; color: var(--danger);">0% matched</div>
      </div>
    `;

    const inputArea = document.getElementById('inputTyping');
    inputArea.focus();
    inputArea.oninput = () => {
      const val = inputArea.value;
      const target = textPrompt;
      let matchedCount = 0;
      for (let i = 0; i < val.length; i++) {
        if (val[i] === target[i]) matchedCount++;
      }
      const matchPct = Math.round((matchedCount / target.length) * 100);
      document.getElementById('lblTypingFeedback').innerText = `${matchPct}% matched`;
      
      if (val === target) {
        inputArea.className = 'typing-input valid';
        document.getElementById('lblTypingFeedback').innerText = '100% matched! Success!';
        document.getElementById('lblTypingFeedback').style.color = 'var(--success)';
        
        setTimeout(() => {
          state.stats.coins += 10;
          state.stats.xp += 10;
          audio.playCoins();
          checkLevelUpTrigger();
          db.save(state);
          closeEmergency();
          renderDashboard();
        }, 800);
      }
    };

  } else {
    // DRILL COUNTDOWN
    emergencyBody.innerHTML = `
      <p class="emergency-coach-comment">"GET UP OUT OF YOUR CHAIR! I want 5 jumping jacks immediately to clear your brain fog! Starting count..."</p>
      <div class="drill-timer" id="lblDrillCount">15</div>
      <button class="btn btn-primary" id="btnFinishDrill" style="display: none; margin-top: 10px;">DONE! READY TO BUILD</button>
    `;

    let count = 15;
    const interval = setInterval(() => {
      count--;
      const label = document.getElementById('lblDrillCount');
      if (label) {
        label.innerText = count;
        if (count <= 0) {
          clearInterval(interval);
          label.innerText = "MOVE IT! NOW!";
          document.getElementById('btnFinishDrill').style.display = 'inline-flex';
        }
      } else {
        clearInterval(interval);
      }
    }, 1000);

    document.getElementById('btnFinishDrill').onclick = () => {
      clearInterval(interval);
      closeEmergency();
    };
  }
}

function closeEmergency() {
  modalEmergency.classList.add('hidden');
}

/* ==========================================================================
   PROOF UPLOAD & AI VERIFICATION SCAN
   ========================================================================== */
let uploadedProofBase64 = null;

function handleProofSelect() {
  const file = inputProofFile.files[0];
  if (!file) return;

  lblUploadStatus.innerText = `Loading: ${file.name}`;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedProofBase64 = e.target.result;
    imgProofPreview.src = uploadedProofBase64;
    imgProofPreview.classList.remove('hidden');
    lblUploadStatus.innerText = `Loaded: ${file.name}`;
  };
  reader.readAsDataURL(file);
}

async function runProofScanVerification() {
  const reflectionText = textReflection.value.trim();
  
  if (!uploadedProofBase64) {
    alert("Please upload a screenshot proof first.");
    return;
  }
  if (!reflectionText) {
    alert("Please add a brief reflection so our AI verify checker can inspect it.");
    return;
  }

  modalScanner.classList.remove('hidden');
  scannerLogs.innerHTML = '';
  
  audio.playScanner(2.8);

  const logs = [
    { text: `[SYSTEM] Opening socket for proof audit...`, type: 'checking' },
    { text: `[SYSTEM] Reading screenshot file resolution & visual density...`, type: 'checking' },
    { text: `[SYSTEM] Analyzing reflection parameters (Length: ${reflectionText.length} chars).`, type: 'checking' },
    { text: `[SYSTEM] Searching for validation indicators matching: "${state.profile.idea.substring(0,25)}..."`, type: 'checking' },
    { text: `[SYSTEM] Matching code/structural density markers... OK.`, type: 'checking' },
    { text: `[SYSTEM] Verifying daily milestone completeness... OK.`, type: 'checking' },
    { text: `[SYSTEM] AI Audit complete. Proof verified successfully!`, type: 'success' }
  ];

  for (const log of logs) {
    const line = document.createElement('div');
    line.className = `scan-log-line ${log.type || ''}`;
    line.innerText = log.text;
    scannerLogs.appendChild(line);
    scannerLogs.scrollTop = scannerLogs.scrollHeight;
    await sleep(400);
  }

  await sleep(600);

  modalScanner.classList.add('hidden');
  audio.playLevelUp();
  
  state.stats.xp += 150;
  state.stats.coins += 50;
  
  updateStreakOnDayCompletion();

  const activeDayNum = state.mission.currentDay;
  const roadmap = state.mission.roadmap;
  const currentDayNode = roadmap.find(d => d.day === activeDayNum);
  
  currentDayNode.status = 'completed';
  currentDayNode.proof = {
    image: uploadedProofBase64,
    reflection: reflectionText,
    timestamp: Date.now()
  };

  // Unlock next day
  if (activeDayNum < 5) {
    const nextDayNode = roadmap.find(d => d.day === activeDayNum + 1);
    nextDayNode.status = 'active';
    state.mission.currentDay += 1;
    alert(`🏆 Day ${activeDayNum} COMPLETE! Next Day Unlocked! +150 XP, +50 Coins earned!`);
  } else {
    alert("👑 CONGRATULATIONS FOUNDER! You completed the 5-day roadmap sprint! You successfully broke the loop and shipped your prototype! Streak preserved!");
  }

  // Clear inputs
  uploadedProofBase64 = null;
  imgProofPreview.classList.add('hidden');
  imgProofPreview.src = '';
  lblUploadStatus.innerText = "Drag & drop or Click to Upload Screenshot";
  textReflection.value = '';
  inputProofFile.value = '';

  checkLevelUpTrigger();
  db.save(state);
  renderDashboard();
}

/* ==========================================================================
   STREAK MANAGER & BACKEND SCHEDULER REMINDERS
   ========================================================================== */
function updateStreakOnDayCompletion() {
  const today = getTodayDateString();
  const lastActive = state.stats.lastActiveDate;

  if (!lastActive) {
    state.stats.currentStreak = 1;
  } else {
    const diffDays = getDaysDifference(lastActive, today);
    if (diffDays === 0) {
      // Already active today
    } else if (diffDays === 1) {
      state.stats.currentStreak += 1;
    } else {
      if (state.stats.shieldsCount > 0) {
        state.stats.shieldsCount -= 1;
        state.stats.currentStreak += 1;
        alert("🛡️ Streak Shield Activated! Your daily streak was preserved from resetting!");
      } else {
        state.stats.currentStreak = 1;
      }
    }
  }

  if (state.stats.currentStreak > state.stats.longestStreak) {
    state.stats.longestStreak = state.stats.currentStreak;
  }

  state.stats.lastActiveDate = today;
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getDaysDifference(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/* ==========================================================================
   SHOP CONTROLLERS
   ========================================================================== */
function buyShopItem(itemId, cost) {
  if (state.stats.coins < cost) {
    alert("❌ Insufficient Focus Coins! Complete more tasks to earn coins.");
    return;
  }

  if (itemId === 'shield') {
    state.stats.coins -= cost;
    state.stats.shieldsCount += 1;
    audio.playCoins();
    alert("🛡️ Streak Shield purchased successfully!");
    triggerToast("Store Purchase!", "Streak Shield (+1) added to inventory.", "success");
  } else if (itemId === 'theme-pink') {
    if (state.unlockedShopItems.includes('theme-pink')) {
      state.activeTheme = 'pink';
      document.body.className = 'theme-pink';
      triggerToast("Theme Swapped!", "Magenta Cyber Theme applied.", "success");
    } else {
      state.stats.coins -= cost;
      state.unlockedShopItems.push('theme-pink');
      state.activeTheme = 'pink';
      document.body.className = 'theme-pink';
      audio.playLevelUp();
      triggerToast("Theme Unlocked!", "Magenta Cyber Theme applied.", "success");
    }
  } else if (itemId === 'sound-binaural') {
    if (state.unlockedShopItems.includes('sound-binaural')) {
      alert("You already own Alpha Binaural Focus soundpack! Toggle it under focus timer.");
    } else {
      state.stats.coins -= cost;
      state.unlockedShopItems.push('sound-binaural');
      audio.playLevelUp();
      triggerToast("Audio Unlocked!", "Alpha Binaural Focus Ambient activated.", "success");
    }
  }

  db.save(state);
  renderDashboard();
}

/* ==========================================================================
   DEBUG / SIMULATE DEV SHORTCUT
   ========================================================================== */
function advanceDaySimulated() {
  const activeDayNum = state.mission.currentDay;
  const roadmap = state.mission.roadmap;
  const currentDayNode = roadmap.find(d => d.day === activeDayNum);
  
  currentDayNode.status = 'completed';
  currentDayNode.steps.forEach(s => s.done = true);

  if (activeDayNum < 5) {
    const nextDayNode = roadmap.find(d => d.day === activeDayNum + 1);
    nextDayNode.status = 'active';
    state.mission.currentDay += 1;
    
    state.stats.currentStreak += 1;
    state.stats.xp += 100;
    state.stats.coins += 25;
    
    checkLevelUpTrigger();
    alert(`[SIMULATION] Advanced to Day ${state.mission.currentDay}!`);
  } else {
    alert("[SIMULATION] Completed final day node!");
  }

  db.save(state);
  renderDashboard();
}

// Start Application
window.onload = init;
