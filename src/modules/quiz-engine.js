// ── Quiz Engine ──
// Pure logic module: cold-start weight estimator with adaptive question selection.
// No DOM, no state mutation, no side effects. Imported by onboarding.js.

export const CATEGORY_KEYS = ['story','craft','performance','world','experience','hold','ending','singularity'];

// Old key → new key aliases (for migration)
export const OLD_TO_NEW = {
  plot: 'story', execution: 'craft', acting: 'performance', production: 'world',
  enjoyability: 'experience', rewatchability: 'hold', ending: 'ending', uniqueness: 'singularity'
};
export const NEW_TO_OLD = Object.fromEntries(Object.entries(OLD_TO_NEW).map(([o, n]) => [n, o]));

export function migrateKeys(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[OLD_TO_NEW[k] || k] = v;
  }
  return out;
}

// ── Weight state ──

const WEIGHT_FLOOR = 1.0;
const WEIGHT_CEILING = 5.0;
const NEUTRAL = 2.5;

export function createQuizState() {
  const weights = {};
  for (const k of CATEGORY_KEYS) weights[k] = NEUTRAL;
  return { weights, asked: [], answers: [], log: [] };
}

// ── Nudge application ──

export function applyAnswer(state, questionId, answerKey, questions) {
  const question = questions.find(q => q.id === questionId);
  if (!question) return state;
  const answer = question.answers.find(a => a.key === answerKey);
  if (!answer) return state;

  const weightsBefore = { ...state.weights };
  for (const cat of CATEGORY_KEYS) {
    const nudge = answer.nudge[cat] || 0;
    state.weights[cat] = Math.max(WEIGHT_FLOOR, Math.min(WEIGHT_CEILING, state.weights[cat] + nudge));
  }

  state.asked.push(questionId);
  state.answers.push({ question: questionId, answer: answerKey });
  state.log.push({
    question_id: questionId,
    question_text: question.text,
    answer_key: answerKey,
    answer_text: answer.text,
    nudge_applied: { ...answer.nudge },
    weights_before: weightsBefore,
    weights_after: { ...state.weights },
    uncertainty_before: getUncertainty(weightsBefore),
    uncertainty_after: getUncertainty(state.weights),
    timestamp: Date.now()
  });

  return state;
}

// ── Uncertainty ──

export function getUncertainty(weights) {
  const vals = CATEGORY_KEYS.map(k => weights[k]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

// ── Adaptive question selection ──
// Picks the unused question whose answers reduce uncertainty the most.

export function selectNextQuestion(state, questions) {
  const unused = questions.filter(q => !q.fixed && !state.asked.includes(q.id));
  if (!unused.length) return null;

  let bestQ = null;
  let lowestExpected = Infinity;

  for (const q of unused) {
    let total = 0;
    for (const a of q.answers) {
      const sim = {};
      for (const cat of CATEGORY_KEYS) {
        sim[cat] = Math.max(WEIGHT_FLOOR, Math.min(WEIGHT_CEILING, state.weights[cat] + (a.nudge[cat] || 0)));
      }
      total += getUncertainty(sim);
    }
    const avg = total / q.answers.length;
    if (avg < lowestExpected) {
      lowestExpected = avg;
      bestQ = q;
    }
  }

  return bestQ;
}

// ── Stopping rules ──

export function shouldStop(state) {
  const n = state.asked.length;

  // Hard cap
  if (n >= 5) return true;

  // Need at least 3 before early exit
  if (n < 3) return false;

  const vals = CATEGORY_KEYS.map(k => state.weights[k]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const max = Math.max(...vals);

  // Clear differentiation: std dev above threshold
  if (getUncertainty(state.weights) > 0.5) return true;

  // Dominant dimension: gap between peak and mean
  if (max - mean > 1.0) return true;

  return false;
}

// ── Archetype classification ──

const ARCHETYPE_META = {
  narrative:    { name: 'Narrativist',  color: '#8B6914' },
  craft:        { name: 'Formalist',    color: '#3D5A80' },
  human:        { name: 'Humanist',     color: '#9B4D5A' },
  experiential: { name: 'Sensualist',   color: '#6B7B3A' },
  singular:     { name: 'Archivist',    color: '#7A5195' },
};

export function computeArchetypeDimensions(weights) {
  return {
    narrative:    0.6 * (weights.story    ?? NEUTRAL) + 0.4 * (weights.ending      ?? NEUTRAL),
    craft:        0.5 * (weights.craft    ?? NEUTRAL) + 0.5 * (weights.world       ?? NEUTRAL),
    human:        1.0 * (weights.performance ?? NEUTRAL),
    experiential: 0.6 * (weights.experience ?? NEUTRAL) + 0.4 * (weights.hold      ?? NEUTRAL),
    singular:     1.0 * (weights.singularity ?? NEUTRAL),
  };
}

export function classifyArchetype(weights) {
  const dims = computeArchetypeDimensions(weights);
  const entries = Object.entries(dims).sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = entries[0];
  const [, secondVal] = entries[1];

  // Adjective from craft/experience boundary (applies to all types including Holist)
  const craftSide  = (weights.story ?? NEUTRAL) + (weights.craft ?? NEUTRAL)
                   + (weights.performance ?? NEUTRAL) + (weights.world ?? NEUTRAL);
  const expSide    = (weights.experience ?? NEUTRAL) + (weights.hold ?? NEUTRAL)
                   + (weights.ending ?? NEUTRAL) + (weights.singularity ?? NEUTRAL);

  let adjective;
  if (craftSide > expSide + 1.5) adjective = 'Studied';
  else if (expSide > craftSide + 1.5) adjective = 'Instinctive';
  else adjective = 'Devoted';

  // No clear leader → Holist
  if (topVal - secondVal < 0.3) {
    return {
      archetype: 'Holist',
      archetypeKey: 'balanced',
      adjective,
      fullName: `${adjective} Holist`,
      color: '#7A7A6D',
      dimensions: dims,
      secondary: entries[1][0]
    };
  }

  const meta = ARCHETYPE_META[topKey];
  return {
    archetype: meta.name,
    archetypeKey: topKey,
    adjective,
    fullName: `${adjective} ${meta.name}`,
    color: meta.color,
    dimensions: dims,
    secondary: entries[1][0]
  };
}

// ── Archetype descriptions (draft copy — to be refined) ──

export const ARCHETYPE_DESCRIPTIONS = {
  narrative: {
    name: 'Narrativist',
    tagline: 'You follow the thread.',
    description: 'Story is your compass. You track where a film goes, how it gets there, and whether it earns its ending. A great premise hooks you; a great resolution seals it. You can forgive rough edges if the narrative pulls you forward — and you can\'t forgive polish if the story goes nowhere.',
    quote: '"Tell me something I haven\'t heard before — and finish what you started."',
  },
  craft: {
    name: 'Formalist',
    tagline: 'You see how it\'s built.',
    description: 'You watch films the way an architect walks through buildings. The cut, the frame, the sound design, the world they constructed — you notice when someone knows what they\'re doing behind the camera, and it matters to you more than most people realize. A well-made film earns your respect even when the story doesn\'t land.',
    quote: '"Show me something I can\'t unsee."',
  },
  human: {
    name: 'Humanist',
    tagline: 'You watch for the people.',
    description: 'Characters are your entry point. A film lives or dies on whether the people in it feel real — whether someone on screen makes you lean forward, hold your breath, or think about them for days after. You\'ll sit through anything if someone in it moves you.',
    quote: '"I don\'t remember the plot. I remember her face in that scene."',
  },
  experiential: {
    name: 'Sensualist',
    tagline: 'You\'re here for what it feels like.',
    description: 'The experience of watching is the point. Not whether a film is "good" by some external measure — whether it was good to sit through. Did it hold you? Would you go back? Does it still have a grip on you? You trust your own response more than anyone else\'s analysis.',
    quote: '"I don\'t need it to be important. I need it to be mine."',
  },
  singular: {
    name: 'Archivist',
    tagline: 'You want the thing that\'s never been done.',
    description: 'Originality is the axis you rotate around. You\'d rather watch something flawed and genuinely new than something polished and familiar. You\'re drawn to films that couldn\'t have been made by anyone else, at any other time. The one-of-ones.',
    quote: '"If I\'ve seen it before, why would I watch it again?"',
  },
  balanced: {
    name: 'Holist',
    tagline: 'The film is one thing.',
    description: 'You experience film as a whole. Story, craft, performance, world, feeling, memory, ending, originality — you don\'t rank them because for you they\'re inseparable. A great film gets everything right at once. A flawed film has a crack that runs through the entire thing. Your scores tend to cluster because when something works for you, it works on every level.',
    quote: '"I don\'t break a film into parts. I just know if it worked."',
  },
};

// ── Adjective descriptions ──

export const ADJECTIVE_DESCRIPTIONS = {
  Studied: 'Your taste leans analytical. You respond to how films are constructed — the decisions behind the camera, the architecture of the story, the precision of craft.',
  Instinctive: 'Your taste leans visceral. You respond to how films make you feel — the experience of watching, the hold afterward, the gut-level response that precedes analysis.',
  Devoted: 'Your taste is integrated. Craft and feeling carry equal weight — you want films that are well-made AND deeply felt. Neither alone is enough.',
};
