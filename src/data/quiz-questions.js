// ── Quiz Question Bank ──
// 6 questions with per-category nudge vectors (new keys).
// Q1–Q2 are fixed (always first/second). Q3–Q6 are adaptive (selected by uncertainty reduction).

export const QUIZ_QUESTIONS = [
  {
    id: 'Q1',
    text: 'Think about your favorite film. What\'s the first thing that comes to mind?',
    fixed: true,
    answers: [
      {
        key: 'A',
        text: 'A scene. A shot. Something I can picture perfectly.',
        nudge: { story: -0.3, craft: +1.2, performance: -0.2, world: +1.0, experience: 0, hold: +0.2, ending: -0.3, singularity: +0.5 }
      },
      {
        key: 'B',
        text: 'The story. Where it went, how it got there, how it ended.',
        nudge: { story: +1.4, craft: 0, performance: +0.3, world: -0.3, experience: 0, hold: -0.2, ending: +1.0, singularity: +0.2 }
      },
      {
        key: 'C',
        text: 'A feeling. Not a specific scene — just what it left me with.',
        nudge: { story: -0.3, craft: -0.2, performance: 0, world: +0.3, experience: +1.2, hold: +0.8, ending: -0.2, singularity: -0.2 }
      },
      {
        key: 'D',
        text: 'A character. Someone I can\'t stop thinking about.',
        nudge: { story: +0.2, craft: -0.2, performance: +1.4, world: -0.2, experience: +0.4, hold: +0.4, ending: -0.2, singularity: +0.2 }
      }
    ]
  },
  {
    id: 'Q2',
    text: 'You have time to watch something tonight. What are you most likely to do?',
    fixed: true,
    answers: [
      {
        key: 'A',
        text: 'Rewatch something I love.',
        nudge: { story: -0.2, craft: +0.3, performance: +0.3, world: +0.3, experience: +0.4, hold: +1.4, ending: -0.2, singularity: -0.3 }
      },
      {
        key: 'B',
        text: 'Find something I\'ve never seen.',
        nudge: { story: +0.3, craft: 0, performance: 0, world: 0, experience: -0.2, hold: -1.0, ending: 0, singularity: +1.4 }
      },
      {
        key: 'C',
        text: 'Whatever fits my mood.',
        nudge: { story: -0.3, craft: -0.2, performance: -0.2, world: +0.8, experience: +1.0, hold: +0.3, ending: -0.3, singularity: -0.3 }
      },
      {
        key: 'D',
        text: 'Research what to watch — reviews, the director\'s other work.',
        nudge: { story: +0.2, craft: +1.0, performance: +0.2, world: +0.3, experience: -0.4, hold: -0.4, ending: 0, singularity: +0.6 }
      }
    ]
  },
  {
    id: 'Q3',
    text: 'You finish a film that you admired more than you enjoyed. How do you rate it?',
    fixed: false,
    answers: [
      {
        key: 'A',
        text: 'Rate it highly. The craft speaks for itself.',
        nudge: { story: +0.3, craft: +1.0, performance: +0.3, world: +0.7, experience: -0.8, hold: -0.5, ending: 0, singularity: +0.4 }
      },
      {
        key: 'B',
        text: 'Somewhere in the middle. Both things are true.',
        nudge: { story: +0.1, craft: +0.1, performance: +0.1, world: +0.1, experience: +0.1, hold: +0.1, ending: +0.1, singularity: +0.1 }
      },
      {
        key: 'C',
        text: 'Rate it lower. If it didn\'t connect, something didn\'t work.',
        nudge: { story: -0.2, craft: -0.5, performance: 0, world: -0.3, experience: +1.2, hold: +0.5, ending: 0, singularity: -0.2 }
      },
      {
        key: 'D',
        text: 'Watch it again before deciding.',
        nudge: { story: 0, craft: +0.3, performance: 0, world: +0.3, experience: -0.2, hold: +1.4, ending: 0, singularity: +0.4 }
      }
    ]
  },
  {
    id: 'Q4',
    text: 'A great performance in a messy film. Where do you land?',
    fixed: false,
    answers: [
      {
        key: 'A',
        text: 'Still a great film. That performance is the film.',
        nudge: { story: +0.2, craft: -0.2, performance: +1.3, world: -0.3, experience: +0.4, hold: 0, ending: 0, singularity: -0.2 }
      },
      {
        key: 'B',
        text: 'The world of the film matters more than any one person in it.',
        nudge: { story: -0.2, craft: +0.3, performance: -0.4, world: +1.3, experience: +0.3, hold: +0.3, ending: -0.2, singularity: -0.2 }
      },
      {
        key: 'C',
        text: 'I need both — great people in a great world.',
        nudge: { story: 0, craft: +0.2, performance: +0.6, world: +0.6, experience: +0.1, hold: +0.1, ending: 0, singularity: 0 }
      },
      {
        key: 'D',
        text: 'Neither — I care about the story and ideas more.',
        nudge: { story: +0.8, craft: +0.2, performance: -0.3, world: -0.3, experience: -0.2, hold: 0, ending: +0.5, singularity: +0.6 }
      }
    ]
  },
  {
    id: 'Q5',
    text: 'A film you\'ve been absorbed in for two hours ends badly. How much does that change things?',
    fixed: false,
    answers: [
      {
        key: 'A',
        text: 'A lot. The ending reframes everything.',
        nudge: { story: +0.4, craft: +0.2, performance: -0.2, world: -0.2, experience: -0.5, hold: -0.3, ending: +1.4, singularity: 0 }
      },
      {
        key: 'B',
        text: 'Somewhat. But two great hours are still two great hours.',
        nudge: { story: +0.4, craft: +0.2, performance: +0.2, world: 0, experience: +0.4, hold: 0, ending: +0.3, singularity: 0 }
      },
      {
        key: 'C',
        text: 'Not much. I was there for the ride.',
        nudge: { story: -0.3, craft: 0, performance: +0.2, world: +0.3, experience: +1.0, hold: +0.5, ending: -1.0, singularity: 0 }
      },
      {
        key: 'D',
        text: 'Depends. Some endings are meant to be unresolved.',
        nudge: { story: +0.2, craft: +0.4, performance: 0, world: 0, experience: -0.2, hold: +0.2, ending: +0.3, singularity: +0.6 }
      }
    ]
  },
  {
    id: 'Q6',
    text: 'I\'d rather watch something...',
    fixed: false,
    answers: [
      {
        key: 'A',
        text: 'Flawed and genuinely new — than polished and familiar.',
        nudge: { story: -0.3, craft: -0.4, performance: 0, world: -0.2, experience: +0.2, hold: 0, ending: 0, singularity: +1.4 }
      },
      {
        key: 'B',
        text: 'Familiar done perfectly — craft and skill impress me most.',
        nudge: { story: +0.2, craft: +1.0, performance: +0.2, world: +0.5, experience: 0, hold: 0, ending: 0, singularity: -0.8 }
      },
      {
        key: 'C',
        text: 'Whatever moves me. I don\'t think about originality.',
        nudge: { story: -0.2, craft: -0.2, performance: +0.3, world: 0, experience: +1.0, hold: +0.5, ending: 0, singularity: -0.5 }
      },
      {
        key: 'D',
        text: 'Original in how it\'s made, not just what it\'s about.',
        nudge: { story: 0, craft: +0.8, performance: 0, world: +0.3, experience: 0, hold: 0, ending: 0, singularity: +0.5 }
      }
    ]
  }
];
