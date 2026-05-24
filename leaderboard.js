export function getInitialCompetitors(category) {
  const cohortIdeas = {
    SaaS: ["CRM for newsletter writers", "AI Study Buddy", "No-code SaaS for local cafes", "Portfolio tracker", "Form analyzer"],
    MobileApp: ["Fitness tracker with virtual pets", "Calm sound generator", "Local food finder", "Dating app for readers", "Split bill utility"],
    ContentCreation: ["AI newsletter on tech", "Audio podcast on physics", "Design channel on YouTube", "Personal finance blog", "Language learning reels"],
    Research: ["AI citation analyzer", "Study deck on microbiology", "Math equation solver", "Machine learning overview", "Neuroscience paper summary"],
    Event: ["Local Hackathon hub", "Concert ticketing draft", "Boardgame meetup platform", "Startup networking group", "Morning running club"]
  };
  
  const ideas = cohortIdeas[category] || cohortIdeas.SaaS;
  const colleges = ["Georgia Tech", "IIT Bombay", "UT Austin", "MIT", "Stanford", "Toronto Uni", "UCL", "Paris Tech"];
  const names = ["Aria_Builds", "Dev_Raj", "SaaS_Sam", "NovaCode", "BetaShipper"];
  
  const emojis = ["🧘‍♂️", "🚀", "💻", "🎨", "📈", "⚙️", "📱", "🎯"];
  const screenshotTypes = ["code", "figma", "landing"];

  return names.map((name, index) => {
    const xp = 150 + index * 95 + Math.floor(Math.random() * 40);
    const level = Math.floor(xp / 250) + 1;
    const idea = ideas[index % ideas.length];
    
    // Seed Story Data
    const story = {
      unread: true,
      day: Math.floor(Math.random() * 2) + 1,
      emoji: emojis[index % emojis.length],
      caption: getMockCaption(screenshotTypes[index % screenshotTypes.length], idea),
      likes: Math.floor(Math.random() * 15) + 3,
      screenshotType: screenshotTypes[index % screenshotTypes.length],
      comments: [
        { author: "BetaShipper", text: "Wow, this looks solid!" },
        { author: "NovaCode", text: "Nice work. Are you deploying on Vercel?" }
      ]
    };

    return {
      name,
      institution: colleges[index % colleges.length],
      idea,
      streak: Math.floor(Math.random() * 3) + 1,
      xp,
      level,
      lastActivity: `Brainstorming core features for '${idea}'`,
      story
    };
  });
}

export function simulateCompetitorProgress(competitors) {
  const screenshotTypes = ["code", "figma", "landing"];
  
  return competitors.map(c => {
    // 30% chance of progress
    const shouldUpdate = Math.random() < 0.3;
    if (shouldUpdate) {
      const addedXP = Math.floor(Math.random() * 35) + 15;
      const newXP = c.xp + addedXP;
      const newLevel = Math.floor(newXP / 250) + 1;
      
      const activities = [
        `Completed a daily checklist milestone (+${addedXP} XP)`,
        `Polished visual landing elements`,
        `Conducted validation interviews with target users`,
        `Resolved a critical environment bug`,
        `Set up their repository and committed a boilerplate`,
        `Successfully submitted day proof screenshot!`,
        `Purchased a Streak Shield from the Focus Shop`
      ];
      
      const lastActivity = activities[Math.floor(Math.random() * activities.length)];
      
      let newStreak = c.streak;
      if (Math.random() < 0.15) {
        newStreak += 1;
      }
      
      // Update story to unread since they made progress
      const updatedStory = {
        ...c.story,
        unread: true,
        day: Math.min(5, c.story.day + (Math.random() < 0.2 ? 1 : 0)),
        caption: getMockCaption(screenshotTypes[Math.floor(Math.random() * 3)], c.idea),
        likes: c.story.likes + Math.floor(Math.random() * 3),
        screenshotType: screenshotTypes[Math.floor(Math.random() * 3)]
      };
      
      return {
        ...c,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastActivity,
        story: updatedStory
      };
    }
    return c;
  });
}

function getMockCaption(type, idea) {
  const captions = {
    code: [
      `Writing logic for the primary endpoint of '${idea}'. Simple database save working!`,
      `Refactored local storage and model functions. Codebase is clean.`,
      `Setting up environment configurations and routing modules.`
    ],
    figma: [
      `Figma wireframe mapping user flow for '${idea}'. Feedback welcome.`,
      `Sketching screen layout nodes. Keeping visual complexity low!`,
      `Drafted component layouts. Ready to extract colors and assets.`
    ],
    landing: [
      `Polished landing layout for '${idea}'. Clean call-to-action button!`,
      `Added hero copy and value proposition fields. How does this look?`,
      `Connected mobile-responsive CSS breakpoints. Page renders perfectly.`
    ]
  };
  
  const list = captions[type] || captions.code;
  return list[Math.floor(Math.random() * list.length)];
}
