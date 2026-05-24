export function generateRoadmap(profile) {
  const { name, city, occupation, institution, idea, progressLevel, budget, time, skillLevel, coachVibe } = profile;
  
  // Choose Coach Quotes & System tone
  const coachNotes = getCoachNotes(coachVibe, name);

  // Initialize a 5-day roadmap structure
  const roadmap = [];

  // Day 1: ICEBREAKER / VALIDATION / FOUNDATION
  let day1Name = "Day 1: Validate & Stress-Test the Core Concept";
  let day1Desc = `Hey ${name}, let's start by validating your idea. Since you are located in ${city} and active as a ${occupation} at ${institution}, we will leverage your local network and modern AI validation.`;
  let day1Steps = [];

  if (progressLevel === 'none') {
    day1Steps = [
      { 
        id: 'd1s1', 
        text: `Run this validation prompt in Claude/ChatGPT: "I am a ${occupation} at ${institution} in ${city}. I want to build a startup called '${idea}'. Tell me 3 reasons why this idea will fail, who my direct competitors are, and what the single most critical feature should be to prove value."`, 
        done: false 
      },
      { 
        id: 'd1s2', 
        text: `Talk to at least 2 people at ${institution} (classmates, coworkers, or target users in ${city}) and ask: "What is your biggest frustration with this problem?" Do NOT sell your idea yet; just listen.`, 
        done: false 
      },
      { 
        id: 'd1s3', 
        text: "Write down the #1 absolute must-have feature (your 'Minimum Viable Hook') based on Claude's output and your interviews.", 
        done: false 
      }
    ];
  } else {
    day1Name = "Day 1: Deconstruct & Define Core Scope";
    day1Desc = `Since you've already made some progress (${progressLevel}), we're skipping basic validation. ${name}, let's audit your current progress and establish your target workflow.`;
    day1Steps = [
      { id: 'd1s1', text: `Do a 10-minute audit of your existing materials. List what is working and what is causing you to overthink.`, done: false },
      { id: 'd1s2', text: `Write down the core user workflow: How does a user go from encountering the problem to completing the solution?`, done: false },
      { id: 'd1s3', text: `Identify the single bottleneck you need to clear next to get closer to launch.`, done: false }
    ];
  }

  // Adjust Day 1 steps for time constraints
  if (time === '15m') {
    day1Steps = day1Steps.slice(0, 2); // Keep it ultra light
    day1Steps[0].text = `Copy and run the Claude Validation Prompt (check description) to stress-test '${idea}'.`;
    day1Steps[1].text = `Write down 1 key takeaway from Claude's feedback. That's it!`;
  } else if (time === '4h' || time === 'fulltime') {
    day1Steps.push({ id: 'd1s4', text: "Create a visual landing page sketch on a piece of paper or Figma canvas.", done: false });
  }

  roadmap.push({
    day: 1,
    name: day1Name,
    description: `${day1Desc} <br><br><strong>Coach Message:</strong> "${coachNotes.day1}"`,
    steps: day1Steps,
    status: 'active',
    proof: null
  });

  // Day 2: THE ANCHOR (UX / VISUAL BLUEPRINT)
  let day2Name = "Day 2: Create a Visual Blueprint";
  let day2Desc = `Time to get visual, ${name}. We want to sketch the core interface. No coding yet, just layout planning.`;
  let day2Steps = [];

  if (skillLevel === 'beginner') {
    day2Steps = [
      { id: 'd2s1', text: "Draft a basic screen layout on paper showing where the header, action buttons, and results go.", done: false },
      { id: 'd2s2', text: `Set up a free design workspace (Figma or simple wireframing tools).`, done: false },
      { id: 'd2s3', text: "Create a clickable 2-screen wireframe simulating the user click flow.", done: false }
    ];
  } else {
    day2Steps = [
      { id: 'd2s1', text: "Outline the interface layout in Figma or write down your component structural hierarchy.", done: false },
      { id: 'd2s2', text: "Map the database schema or data models required (e.g. User, Task, Log schema).", done: false },
      { id: 'd2s3', text: `Set up a git repository called '${idea.toLowerCase().replace(/[^a-z0-9]/g, '-')}' and commit a basic README.`, done: false }
    ];
  }

  if (time === '15m') {
    day2Steps = [
      { id: 'd2s1', text: "Draw a raw napkin sketch of the primary screen showing the core action button.", done: false },
      { id: 'd2s2', text: "List the 3 main fields/inputs your users will interact with.", done: false }
    ];
  }

  roadmap.push({
    day: 2,
    name: day2Name,
    description: `${day2Desc} <br><br><strong>Coach Message:</strong> "${coachNotes.day2}"`,
    steps: day2Steps,
    status: 'locked',
    proof: null
  });

  // Day 3: BUILD PHASE (THE CORE MECHANIC)
  let day3Name = "Day 3: Build the Core Engine";
  let day3Desc = `Today is build day. ${name}, we are constructing the single feature that solves the problem. Focus only on this and ignore bells and whistles.`;
  let day3Steps = [];

  if (skillLevel === 'beginner') {
    const noCodeTool = budget === '0' ? 'Glide, Carrd, or Softr (Free tiers)' : 'Bubble or Webflow';
    day3Steps = [
      { id: 'd3s1', text: `Create a new project in ${noCodeTool} and configure the home screen.`, done: false },
      { id: 'd3s2', text: "Connect a simple database (like Airtable or Google Sheets) to save user responses.", done: false },
      { id: 'd3s3', text: "Trigger a test entry from your form and verify it saves in your spreadsheet.", done: false }
    ];
  } else {
    const dbRecommendation = budget === '0' ? 'Supabase (Free Tier) or LocalStorage' : 'Supabase or Firebase Paid';
    day3Steps = [
      { id: 'd3s1', text: `Initialize your tech stack (Vite + React, Next.js, or vanilla JS/HTML).`, done: false },
      { id: 'd3s2', text: `Configure your database / persistence layer using ${dbRecommendation}.`, done: false },
      { id: 'd3s3', text: "Write the logic for the core function (e.g., API route, calculation script, or UI update).", done: false }
    ];
    if (skillLevel === 'advanced') {
      day3Steps.push({ id: 'd3s4', text: "Implement user authentication or a mock landing login form.", done: false });
    }
  }

  if (time === '15m') {
    day3Steps = [
      { id: 'd3s1', text: "Create your workspace project folder and install 1 core package, or create your index.html.", done: false },
      { id: 'd3s2', text: "Write a static HTML button that triggers a simple alert('Action Executed!') to test interactivity.", done: false }
    ];
  }

  roadmap.push({
    day: 3,
    name: day3Name,
    description: `${day3Desc} <br><br><strong>Coach Message:</strong> "${coachNotes.day3}"`,
    steps: day3Steps,
    status: 'locked',
    proof: null
  });

  // Day 4: REFINEMENT & USER FLOW
  let day4Name = "Day 4: Design Refinement & Feedback Prep";
  let day4Desc = `Let's make it look beautiful, ${name}. Apply clean styling, transitions, and write an onboarding text so users know what to do.`;
  let day4Steps = [];

  day4Steps = [
    { id: 'd4s1', text: "Style the interface (clean fonts, CSS glassmorphism, or modern spacing) so it feels high-quality.", done: false },
    { id: 'd4s2', text: "Add validation states: Ensure empty forms display clean warning states rather than crashing.", done: false },
    { id: 'd4s3', text: "Write a 2-sentence value proposition at the top of the app explaining what it does.", done: false }
  ];

  if (budget === '0') {
    day4Steps.push({ id: 'd4s4', text: "Connect free assets (icons from Feather Icons, illustrations from unDraw).", done: false });
  } else {
    day4Steps.push({ id: 'd4s4', text: "Prepare domain configurations or register a custom domain on Namecheap/GoDaddy.", done: false });
  }

  if (time === '15m') {
    day4Steps = [
      { id: 'd4s1', text: "Write the CSS styling for the core button and center the text.", done: false },
      { id: 'd4s2', text: "Verify that user entries don't crash the UI when they are blank.", done: false }
    ];
  }

  roadmap.push({
    day: 4,
    name: day4Name,
    description: `${day4Desc} <br><br><strong>Coach Message:</strong> "${coachNotes.day4}"`,
    steps: day4Steps,
    status: 'locked',
    proof: null
  });

  // Day 5: THE SHIPPED MVP
  let day5Name = "Day 5: Deploy & Share with the World";
  let day5Desc = `Today is launch day! We are taking your MVP and putting it live. No more tweaking, just shipping.`;
  let day5Steps = [];

  const deployTool = skillLevel === 'beginner' ? 'Vercel, Carrd, or Share-Link' : 'Vercel, Netlify, or Github Pages';
  
  day5Steps = [
    { id: 'd5s1', text: `Deploy your project live to the internet using ${deployTool} (takes 2 minutes).`, done: false },
    { id: 'd5s2', text: `Draft a short pitch message customized for target users at ${institution} or in ${city}.`, done: false },
    { id: 'd5s3', text: "Share your live link with 3 friends or on social media (Twitter, LinkedIn, Slack/Discord).", done: false },
    { id: 'd5s4', text: "Log your first user's initial reaction, feedback, or review.", done: false }
  ];

  if (time === '15m') {
    day5Steps = [
      { id: 'd5s1', text: `Deploy your code to Vercel/GitHub Pages (simply drop files or push git).`, done: false },
      { id: 'd5s2', text: `Send the link to 1 classmate or coworker at ${institution} and ask for their raw feedback.`, done: false }
    ];
  }

  roadmap.push({
    day: 5,
    name: day5Name,
    description: `${day5Desc} <br><br><strong>Coach Message:</strong> "${coachNotes.day5}"`,
    steps: day5Steps,
    status: 'locked',
    proof: null
  });

  return roadmap;
}

function getCoachNotes(coachVibe, name) {
  const vibes = {
    zen: {
      day1: "Breathe in. A mountain is moved stone by stone. Just complete this validation step, and let go of the need for perfection. You are doing great, traveler.",
      day2: "Focus only on the shape today. Feel the interface flow. Do not hurry. One line, one wireframe. Enjoy the simple act of planning.",
      day3: "The engine is coming alive. If you feel overwhelmed, step away, take three deep breaths, and write just one line of code or place one input. It is enough.",
      day4: "Harmony in design. Make space, clean up clutter. A calm UI invites a calm mind. Keep it simple and fluid.",
      day5: "Release it to the universe. Shipping is not a final test; it is just opening your window to let the air in. Be proud of taking this step today."
    },
    hype: {
      day1: "LFG! Time to validate this unicorn concept. Let's run the Claude stress-test, get that feedback, and build massive leverage. Let's make it real!",
      day2: "Time to design the product UX. Keep it clean, keep it viral. A great wireframe is how you align your builders and sell the vision. Let's crush this layout!",
      day3: "Build Day! Time to ship code, deploy microservices, and build the engine. No distractions today, just pure flow state. Let's write the core logic!",
      day4: "Polish it up! Beautiful pixels, sweet glassmorphism, and clear copy. The product must feel premium from first scroll. Hook the users!",
      day5: "LAUNCH DAY! We are shipping it live on ProductHunt/Twitter/Reddit. Share the link with everyone at your company/college. Hustle time!"
    },
    drill: {
      day1: "Stop talking and start doing. Procrastination ends today. Do the validation checklist right now. No excuses. I am watching the timer.",
      day2: "Layout day. Draw the layout. Sketch the wireframes. If you start overthinking, I'll add 10 pushups to your day. Get it done.",
      day3: "Build day. Code it or construct it. Do not look at YouTube, do not check social media. Focus on the core feature and build it now.",
      day4: "Clean it up. If it's sloppy, it's garbage. Align the text, style the buttons, make sure it does not crash. Complete the list.",
      day5: "Ship it! A prototype on your local machine is useless. Deploy it live. Send the link. Get verified. Move! Move! Move!"
    }
  };

  return vibes[coachVibe] || vibes.zen;
}
