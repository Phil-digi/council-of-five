export type PersonaType = 'Adrien' | 'Nova' | 'Henri' | 'Aya' | 'Damien';

export type Mode = 'auto' | 'quick' | 'duel' | 'council';

export interface ConversationTurn {
  persona: PersonaType;
  message: string;
}

export interface Synthesis {
  summary: string;
  recommendations: string[];
  risks: string[];
  next_steps: string[];
}

export interface CouncilResponse {
  mode_used: Mode;
  selected_personas: PersonaType[];
  conversation: ConversationTurn[];
  synthesis: Synthesis;
}

export interface Message {
  id: string;
  type: 'user' | 'council';
  content: string;
  response?: CouncilResponse;
  timestamp: Date;
}

export interface PersonaConfig {
  name: PersonaType;
  emoji: string;
  color: string;
  description: string;
}

export const PERSONAS: Record<PersonaType, PersonaConfig> = {
  Adrien: {
    name: 'Adrien',
    emoji: '🧠',
    color: '#3b82f6',
    description: 'Adrien — Le Rationaliste : logique, preuves, définitions, cohérence'
  },
  Nova: {
    name: 'Nova',
    emoji: '🚀',
    color: '#ec4899',
    description: 'Nova — La Visionnaire : futur, progrès, accélération, coût du statu quo'
  },
  Henri: {
    name: 'Henri',
    emoji: '🛡️',
    color: '#f59e0b',
    description: 'Henri — Tradition, ordre, stabilité : prudence, continuité, leçons de l’histoire'
  },
  Aya: {
    name: 'Aya',
    emoji: '✊',
    color: '#ef4444',
    description: 'Aya — Justice sociale : inclusion, domination systémique, urgence morale'
  },
  Damien: {
    name: 'Damien',
    emoji: '🕵️',
    color: '#14b8a6',
    description: 'Damien — Contrarien conspi-light : incitations cachées, narratifs, stress-test'
  }
};
