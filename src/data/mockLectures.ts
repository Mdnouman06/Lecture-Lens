import type { Lecture, CourseFilter } from '../types/lecture';

export const MOCK_COURSES: CourseFilter[] = [
  { id: 'all', code: 'ALL', name: 'All Courses', count: 42 },
  { id: 'cs-106b', code: 'CS 106B', name: 'Computer Science', count: 16 },
  { id: 'neuro-301', code: 'NEURO 301', name: 'Neuroscience', count: 14 },
  { id: 'phys-402', code: 'PHYS 402', name: 'Quantum Physics', count: 8 },
  { id: 'econ-201', code: 'ECON 201', name: 'Macroeconomics', count: 4 },
];

export const MOCK_LECTURES: Lecture[] = [
  {
    id: 'lec-neuro-301-14',
    title: 'Synaptic Plasticity & Long-Term Potentiation (LTP)',
    courseCode: 'NEURO 301',
    courseName: 'Cellular & Systems Neuroscience',
    date: 'Oct 24, 2026',
    duration: '52:30',
    durationSeconds: 3150,
    progressSeconds: 2892, // 48:12 elapsed
    status: 'synced',
    hasAudio: true,
    sourceType: 'audio',
    summary:
      'Detailed investigation into the molecular mechanisms of Long-Term Potentiation in hippocampal CA1 pyramidal neurons. The session centers on the dual-requirement activation of NMDA receptors (glutamate binding + postsynaptic depolarization to relieve magnesium block), subsequent calcium influx activating CaMKII autophosphorylation, and the rapid insertion of AMPA receptor subunits (GluA1) into the postsynaptic density for sustained synaptic strengthening.',
    concepts: [
      {
        id: 'c-1',
        term: 'NMDA Receptor Coincidence Detection',
        definition:
          'Requires both presynaptic glutamate release and postsynaptic depolarization (-30mV) to expel the extracellular Mg2+ ion blocking the pore.',
        importance: 'critical',
        timestamp: '14:20',
      },
      {
        id: 'c-2',
        term: 'CaMKII Autophosphorylation',
        definition:
          'Calcium/calmodulin-dependent kinase II locks into an autonomous catalytic state via Thr286 autophosphorylation, continuing enzymatic action beyond transient Ca2+ elevation.',
        importance: 'critical',
        timestamp: '28:45',
      },
      {
        id: 'c-3',
        term: 'Dendritic Spine Remodeling',
        definition:
          'Actin polymerization driven by Rho-family GTPases leads to spine head enlargement and physical stabilization of synaptic scaffolds.',
        importance: 'high',
        timestamp: '41:10',
      },
    ],
    transcript: [
      {
        id: 't-1',
        startSeconds: 0,
        endSeconds: 45,
        speaker: 'Prof. Henderson',
        text: 'Welcome everyone. Today we are unpacking synaptic plasticity at the molecular level, focusing on hippocampal CA1 synapses and long-term potentiation.',
      },
      {
        id: 't-2',
        startSeconds: 46,
        endSeconds: 120,
        speaker: 'Prof. Henderson',
        text: 'The fundamental principle here is Donald Hebb’s 1949 postulate: neurons that fire together, wire together. In modern biophysics, that coincidence detector is the NMDA receptor.',
      },
      {
        id: 't-3',
        startSeconds: 121,
        endSeconds: 240,
        speaker: 'Prof. Henderson',
        text: 'Notice that resting membrane potential keeps an extracellular magnesium ion firmly lodged inside the NMDA channel pore. Glutamate alone is insufficient to open it.',
      },
    ],
    flashcards: [
      {
        id: 'fc-1',
        front: 'What are the two simultaneous conditions required to open the NMDA receptor channel pore?',
        back: '1. Presynaptic glutamate binding to the receptor.\n2. Strong postsynaptic depolarization (approx. -30 mV) to expel the magnesium (Mg2+) block.',
        mastered: true,
        stability: 0.94,
        difficulty: 3,
      },
      {
        id: 'fc-2',
        front: 'What specific residue autophosphorylation maintains CaMKII activity after intracellular Ca2+ levels drop?',
        back: 'Threonine 286 (Thr286) autophosphorylation locks the holoenzyme subunit in a constitutively active conformation.',
        mastered: true,
        stability: 0.88,
        difficulty: 4,
      },
      {
        id: 'fc-3',
        front: 'Which AMPA receptor subunit is primarily recruited and exocytosed into the postsynaptic density during early-phase LTP?',
        back: 'GluA1 subunit-containing AMPA receptors.',
        mastered: false,
        nextReviewDate: 'Today',
        stability: 0.62,
        difficulty: 4,
      },
      {
        id: 'fc-4',
        front: 'How does late-phase LTP (L-LTP) differ mechanistically from early-phase LTP (E-LTP)?',
        back: 'L-LTP requires new gene transcription and protein synthesis via PKA/MAPK signaling and CREB phosphorylation, accompanied by structural synaptic enlargement.',
        mastered: true,
        stability: 0.91,
        difficulty: 5,
      },
    ],
  },
  {
    id: 'lec-phys-402-09',
    title: 'Quantum Superposition & Wavefunction Collapse',
    courseCode: 'PHYS 402',
    courseName: 'Quantum Mechanics II',
    date: 'Oct 22, 2026',
    duration: '1:14:15',
    durationSeconds: 4455,
    progressSeconds: 1980, // 33:00 elapsed
    status: 'synced',
    hasAudio: true,
    sourceType: 'audio',
    summary:
      'Rigorous analysis of pure state vectors in Hilbert space, linear Hermitian operators, and measurement theory. The lecture covers the Copenhagen interpretation, the transition from coherent quantum superpositions to classical statistical mixtures via environmental decoherence, and the density matrix representation.',
    concepts: [
      {
        id: 'c-4',
        term: 'State Vector in Hilbert Space',
        definition:
          'A normalized vector |Ψ⟩ in complex inner-product vector space representing the complete physical state of a quantum system.',
        importance: 'critical',
        timestamp: '08:15',
      },
      {
        id: 'c-5',
        term: 'Born Probability Rule',
        definition:
          'The probability P(a) of measuring eigenvalue a is given by |⟨a|Ψ⟩|², projecting the state onto the corresponding eigenvector.',
        importance: 'critical',
        timestamp: '22:40',
      },
      {
        id: 'c-6',
        term: 'Quantum Decoherence',
        definition:
          'The loss of quantum coherence where phase interference terms between eigenstates vanish through irreversible entanglement with environmental degrees of freedom.',
        importance: 'high',
        timestamp: '54:10',
      },
    ],
    transcript: [
      {
        id: 't-4',
        startSeconds: 0,
        endSeconds: 60,
        speaker: 'Dr. Thorne',
        text: 'Today we address the central measurement problem of quantum mechanics. When does a superposition of states become a definite measurement outcome?',
      },
      {
        id: 't-5',
        startSeconds: 61,
        endSeconds: 150,
        speaker: 'Dr. Thorne',
        text: 'The density matrix allows us to distinguish between a coherent superposition and an incoherent classical probabilistic ensemble.',
      },
    ],
    flashcards: [
      {
        id: 'fc-5',
        front: 'What mathematical property distinguishes a pure quantum state from a mixed state using the density matrix ρ?',
        back: 'For a pure state: Tr(ρ²) = 1.\nFor a mixed state: Tr(ρ²) < 1.',
        mastered: true,
        stability: 0.96,
        difficulty: 3,
      },
      {
        id: 'fc-6',
        front: 'Why is environmental decoherence not considered a complete solution to the measurement problem?',
        back: 'Decoherence explains why off-diagonal interference terms vanish (explaining the emergence of classical probabilities), but does not explain which specific eigenvalue is selected in a single experiment.',
        mastered: false,
        nextReviewDate: 'Tomorrow',
        stability: 0.74,
        difficulty: 5,
      },
    ],
  },
  {
    id: 'lec-econ-201-11',
    title: 'Macroeconomic Policy & Inflation Targeting',
    courseCode: 'ECON 201',
    courseName: 'Intermediate Macroeconomics',
    date: 'Oct 19, 2026',
    duration: '48:10',
    durationSeconds: 2890,
    progressSeconds: 2890, // Completed
    status: 'ready',
    hasAudio: true,
    sourceType: 'pdf',
    summary:
      'Evaluation of modern central banking frameworks, the Taylor Rule for nominal policy interest rate determination, and forward guidance mechanisms. Evaluates the New Keynesian Phillips Curve trade-off between inflation stabilization and output gap volatility in response to aggregate demand versus supply shocks.',
    concepts: [
      {
        id: 'c-7',
        term: 'The Taylor Rule',
        definition:
          'Formula: i_t = r* + π_t + 0.5(π_t - π*) + 0.5(y_t - y*). Dictates how central banks adjust policy rates to inflation deviations and output gaps.',
        importance: 'critical',
        timestamp: '15:30',
      },
      {
        id: 'c-8',
        term: 'Taylor Principle',
        definition:
          'The nominal interest rate must adjust more than one-for-one with inflation (coefficient > 1) to ensure the real interest rate increases and cools aggregate demand.',
        importance: 'critical',
        timestamp: '29:10',
      },
      {
        id: 'c-9',
        term: 'New Keynesian Phillips Curve',
        definition:
          'Relates current inflation to expected future inflation and current marginal costs/output gap: π_t = β E_t[π_{t+1}] + κ y_t.',
        importance: 'high',
        timestamp: '39:50',
      },
    ],
    transcript: [
      {
        id: 't-6',
        startSeconds: 0,
        endSeconds: 50,
        speaker: 'Prof. Stiglitz',
        text: 'In this session, we analyze how the Federal Reserve and ECB formulate monetary policy, specifically examining the mechanics and limits of inflation targeting.',
      },
    ],
    flashcards: [
      {
        id: 'fc-7',
        front: 'What happens if a central bank violates the Taylor Principle during an inflation shock?',
        back: 'The real interest rate falls as inflation rises, stimulating borrowing and aggregate demand, resulting in an explosive wage-price inflationary spiral.',
        mastered: true,
        stability: 0.92,
        difficulty: 3,
      },
    ],
  },
];

export function getLectures(): Lecture[] {
  return MOCK_LECTURES;
}

export function getLectureById(id: string): Lecture | undefined {
  return MOCK_LECTURES.find((lec) => lec.id === id);
}

export function getLecturesByCourse(courseCode: string): Lecture[] {
  if (courseCode === 'ALL') return MOCK_LECTURES;
  return MOCK_LECTURES.filter((lec) => lec.courseCode === courseCode);
}

export function getStudyStats() {
  const totalLectures = 38;
  const hoursLogged = 24.5;
  const retentionScore = 94.2;
  const flashcardsMastered = 42;
  const flashcardsDue = 28;
  const streakDays = 14;

  return {
    totalLectures,
    hoursLogged,
    retentionScore,
    flashcardsMastered,
    flashcardsDue,
    streakDays,
  };
}
