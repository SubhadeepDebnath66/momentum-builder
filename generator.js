export async function generateRoadmap(profile) {
  const { name, city, occupation, institution, idea, progressLevel, budget, time, skillLevel, coachVibe, selectCategory } = profile;

  const prompt = `You are an elite startup execution coach. Generate a hyper-personalized 5-day startup roadmap for this founder.

FOUNDER PROFILE:
- Name: ${name}
- City: ${city}
- Role: ${occupation} at ${institution}
- Idea: "${idea}"
- Category: ${selectCategory}
- Current Progress: ${progressLevel === 'none' ? 'Just an idea' : progressLevel === 'wireframe' ? 'Wireframes done' : 'MVP started'}
- Daily Time Budget: ${time}
- Budget: $${budget}
- Skill Level: ${skillLevel}
- Coach Vibe: ${coachVibe}

Return ONLY valid JSON (no markdown, no backticks, no preamble) in exactly this structure:
{
  "roadmap": [
    {
      "day": 1,
      "name": "Day 1: <short punchy title>",
      "description": "<2-3 sentences personalized to ${name} and their specific idea. Reference ${city}, ${institution} where relevant. End with a coach note in the ${coachVibe} style — zen=calm, hype=energetic, drill=blunt>",
      "steps": [
        { "id": "d1s1", "text": "<specific actionable task referencing their idea>", "done": false },
        { "id": "d1s2", "text": "<specific task>", "done": false },
        { "id": "d1s3", "text": "<specific task>", "done": false }
      ]
    },
    { "day": 2, ... },
    { "day": 3, ... },
    { "day": 4, ... },
    { "day": 5, ... }
  ]
}

Rules:
- Each day must have 2-4 steps (fewer if time="${time}" is 15m)
- Steps must be SPECIFIC to "${idea}" — not generic startup advice
- Day names must be action-oriented and exciting
- Scale complexity to skill level (${skillLevel}) and budget ($${budget})
- Day 5 must end with a deployment/launch step
- If progressLevel is not "none", skip basic validation and go deeper
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Attach status flags
    return parsed.roadmap.map((day, i) => ({
      ...day,
      status: i === 0 ? 'active' : 'locked',
      proof: null
    }));

  } catch (err) {
    console.error('AI roadmap generation failed, using fallback:', err);
    return generateFallbackRoadmap(profile);
  }
}

// Fallback if API fails
function generateFallbackRoadmap(profile) {
  const { name, city, occupation, institution, idea, progressLevel, budget, time, skillLevel, coachVibe } = profile;
  const coachNotes = getCoachNotes(coachVibe);
  const roadmap = [];

  let day1Steps = progressLevel === 'none'
    ? [
        { id: 'd1s1', text: `Run a validation prompt in Claude/ChatGPT for '${idea}' and list 3 failure risks.`, done: false },
        { id: 'd1s2', text: `Talk to 2 people at ${institution} about their biggest frustration with this problem.`, done: false },
        { id: 'd1s3', text: "Write your single must-have feature ('Minimum Viable Hook').", done: false }
      ]
    : [
        { id: 'd1s1', text: 'Audit existing materials: what works vs what causes overthinking.', done: false },
        { id: 'd1s2', text: 'Write the core user workflow from problem to solution.', done: false },
        { id: 'd1s3', text: 'Identify the single bottleneck to clear next.', done: false }
      ];

  if (time === '15m') day1Steps = day1Steps.slice(0, 2);
  else if (time === '4h' || time === 'fulltime') day1Steps.push({ id: 'd1s4', text: 'Sketch a landing page on paper or Figma.', done: false });

  roadmap.push({ day: 1, name: 'Day 1: Validate & Stress-Test the Core Concept', description: `Hey ${name}, let's validate your idea in ${city}.<br><br><strong>Coach:</strong> "${coachNotes.day1}"`, steps: day1Steps, status: 'active', proof: null });

  let day2Steps = skillLevel === 'beginner'
    ? [
        { id: 'd2s1', text: 'Draft a paper wireframe of your main screen.', done: false },
        { id: 'd2s2', text: 'Set up a free Figma workspace.', done: false },
        { id: 'd2s3', text: 'Create a 2-screen clickable wireframe.', done: false }
      ]
    : [
        { id: 'd2s1', text: 'Outline UI layout or component hierarchy.', done: false },
        { id: 'd2s2', text: 'Map required data models.', done: false },
        { id: 'd2s3', text: `Create a git repo for '${idea}' with a README.`, done: false }
      ];

  if (time === '15m') day2Steps = [{ id: 'd2s1', text: 'Napkin sketch of the primary screen.', done: false }, { id: 'd2s2', text: 'List 3 main user inputs.', done: false }];
  roadmap.push({ day: 2, name: 'Day 2: Visual Blueprint', description: `Get visual, ${name}.<br><br><strong>Coach:</strong> "${coachNotes.day2}"`, steps: day2Steps, status: 'locked', proof: null });

  const noCodeTool = budget === '0' ? 'Glide or Carrd' : 'Bubble or Webflow';
  const dbRec = budget === '0' ? 'Supabase free tier or localStorage' : 'Supabase or Firebase';
  let day3Steps = skillLevel === 'beginner'
    ? [
        { id: 'd3s1', text: `Create a project in ${noCodeTool}.`, done: false },
        { id: 'd3s2', text: 'Connect a simple database or spreadsheet.', done: false },
        { id: 'd3s3', text: 'Submit a test entry and verify it saves.', done: false }
      ]
    : [
        { id: 'd3s1', text: 'Initialize your stack (Vite/React or vanilla HTML).', done: false },
        { id: 'd3s2', text: `Configure persistence with ${dbRec}.`, done: false },
        { id: 'd3s3', text: 'Implement the core feature logic.', done: false }
      ];
  roadmap.push({ day: 3, name: 'Day 3: Build the Core Engine', description: `Build day, ${name}.<br><br><strong>Coach:</strong> "${coachNotes.day3}"`, steps: day3Steps, status: 'locked', proof: null });

  roadmap.push({ day: 4, name: 'Day 4: Polish & Feedback Prep', description: `Make it beautiful, ${name}.<br><br><strong>Coach:</strong> "${coachNotes.day4}"`, steps: [
    { id: 'd4s1', text: 'Style the interface with clean typography and spacing.', done: false },
    { id: 'd4s2', text: 'Add validation for empty form inputs.', done: false },
    { id: 'd4s3', text: 'Write a 2-sentence value proposition.', done: false },
    budget === '0' ? { id: 'd4s4', text: 'Add free icons from Feather or unDraw.', done: false } : { id: 'd4s4', text: 'Register or configure a custom domain.', done: false }
  ], status: 'locked', proof: null });

  const deployTool = skillLevel === 'beginner' ? 'Vercel or Carrd' : 'Vercel or Netlify';
  roadmap.push({ day: 5, name: 'Day 5: Deploy & Share', description: `Launch day!<br><br><strong>Coach:</strong> "${coachNotes.day5}"`, steps: [
    { id: 'd5s1', text: `Deploy live using ${deployTool}.`, done: false },
    { id: 'd5s2', text: `Draft a pitch for users at ${institution} or ${city}.`, done: false },
    { id: 'd5s3', text: 'Share your link with 3 people on social or chat.', done: false },
    { id: 'd5s4', text: "Log your first user's reaction.", done: false }
  ].slice(0, time === '15m' ? 2 : 4), status: 'locked', proof: null });

  return roadmap;
}

function getCoachNotes(coachVibe) {
  const vibes = {
    zen: { day1: 'One step at a time. Complete validation gently.', day2: 'Sketch the flow without rushing.', day3: 'One line of code is enough if you feel overwhelmed.', day4: 'Keep the UI calm and simple.', day5: 'Shipping opens the window. Be proud.' },
    hype: { day1: 'LFG! Stress-test this concept now!', day2: 'Design a viral-ready UX!', day3: 'Build day — pure flow state!', day4: 'Premium pixels only!', day5: 'LAUNCH DAY — share everywhere!' },
    drill: { day1: 'No excuses. Do the validation checklist now.', day2: 'Draw the wireframes. Move.', day3: 'Build the core feature. No distractions.', day4: 'Clean it up or it is garbage.', day5: 'Deploy live. Send the link. Now.' }
  };
  return vibes[coachVibe] || vibes.zen;
}
