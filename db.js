const DB_KEY = 'momentum_builder_state';
const defaultState = {
  profile: null,
  stats: {
    xp: 0,
    level: 1,
    coins: 50,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    shieldsCount: 0,
    totalDaysCompleted: 0
  },
  mission: {
    isGenerated: false,
    currentDay: 1,
    roadmap: [],
    currentSession: 1,
    sessionReviews: [],
    allSessionsComplete: false,
    awaitingReview: false
  },
  achievements: [],
  unlockedShopItems: ['default-theme', 'sound-none'],
  activeTheme: 'default',
  activeAmbientSound: 'none',
  competitors: []
};
 
export const db = {
  load() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      this.save(defaultState);
      return JSON.parse(JSON.stringify(defaultState));
    }
    try {
      const state = JSON.parse(raw);
      return {
        ...defaultState,
        ...state,
        stats: { ...defaultState.stats, ...state.stats },
        mission: { ...defaultState.mission, ...state.mission }
      };
    } catch (e) {
      console.error('Failed to parse local storage', e);
      return JSON.parse(JSON.stringify(defaultState));
    }
  },
  save(state) {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  },
  reset() {
    localStorage.removeItem(DB_KEY);
    return JSON.parse(JSON.stringify(defaultState));
  }
};