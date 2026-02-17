/**
 * 🎭 SYSTÈME DE DÉBATS ÉVOLUTIFS - Council of Five
 * Débats adaptatifs entre personas avec mémoire et évolution des positions
 */

import { PersonaType } from '../types';
import { deepMemory, MemoryType, MemoryImportance } from './deepMemory';

export interface DebateTopic {
  id: string;
  name: string;
  keywords: string[];
  opposingViews: Record<PersonaType, string>;
}

export interface DebateConfig {
  topic: DebateTopic;
  participants: PersonaType[];
  intensity: 'mild' | 'moderate' | 'heated';
  allowEvolution: boolean;
}

export interface DebatePosition {
  persona: PersonaType;
  stance: string;
  confidence: number;
  arguments: string[];
  isEvolved: boolean;
  previousStance?: string;
}

// Sujets de débat controversés pour le Council
export const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'action_vs_analysis',
    name: 'Action vs Analyse',
    keywords: ['agir', 'réfléchir', 'attendre', 'décider', 'analyser', 'rapidement', 'prudemment'],
    opposingViews: {
      Adrien: 'Définissons les termes et testons l\'hypothèse avant d\'agir.',
      Nova: 'Le statu quo a un coût : il faut agir vite et itérer.',
      Henri: 'La société n\'est pas un laboratoire : la prudence protège la cohésion.',
      Aya: 'L\'inaction n\'est pas neutre : elle maintient des violences invisibles.',
      Damien: 'D\'accord pour agir, mais d\'abord : qui a intérêt à ce récit, et qu\'est-ce qui le falsifierait ?'
    }
  },
  {
    id: 'risk_vs_safety',
    name: 'Risque vs Sécurité',
    keywords: ['risque', 'sécurité', 'prudence', 'audace', 'danger', 'opportunité', 'oser'],
    opposingViews: {
      Adrien: 'Le risque doit être quantifié : quel scénario, quelle probabilité, quel test ?',
      Nova: 'Si on ralentit, d\'autres accélèrent : prenons un risque calculé avec garde-fous.',
      Henri: 'Les ruptures trop rapides brisent des équilibres fragiles : la sécurité d\'abord.',
      Aya: 'Le risque se paie souvent sur les plus vulnérables : la sécurité doit être juste.',
      Damien: 'Quels risques sont invisibles parce que certains ont intérêt à les minimiser ?'
    }
  },
  {
    id: 'innovation_vs_tradition',
    name: 'Innovation vs Tradition',
    keywords: ['nouveau', 'ancien', 'tradition', 'innovation', 'changement', 'stabilité', 'moderne'],
    opposingViews: {
      Adrien: 'On garde ce qui marche, on change ce qui échoue : preuves d\'abord.',
      Nova: 'L\'innovation est le moteur : le statu quo a un coût sur 10 ans.',
      Henri: 'Le progrès sans ancrage détruit : la tradition stabilise et transmet.',
      Aya: 'La tradition peut cacher des dominations : l\'innovation doit réparer et inclure.',
      Damien: '"Innovation" et "tradition" sont parfois des narratifs : qui gagne dans chaque récit ?'
    }
  },
  {
    id: 'individual_vs_collective',
    name: 'Individuel vs Collectif',
    keywords: ['individu', 'groupe', 'équipe', 'seul', 'ensemble', 'collaboration', 'autonomie'],
    opposingViews: {
      Adrien: 'Ni l\'individu ni le groupe n\'ont raison par défaut : définissons l\'objectif et mesurons.',
      Nova: 'Le collectif doit aligner et accélérer, sinon on perd en vitesse et en impact.',
      Henri: 'Sans cohésion, tout se délite : le collectif et les devoirs passent d\'abord.',
      Aya: 'Le collectif ne vaut que s\'il inclut réellement les personnes marginalisées.',
      Damien: 'Le collectif fabrique aussi du conformisme : qui est réduit au silence ?'
    }
  },
  {
    id: 'efficiency_vs_quality',
    name: 'Efficacité vs Qualité',
    keywords: ['rapide', 'qualité', 'efficace', 'parfait', 'vite', 'bien', 'compromis'],
    opposingViews: {
      Adrien: 'Sans métriques, ce débat est vague : définissons qualité et efficacité.',
      Nova: 'Vitesse d\'exécution : on apprend en avançant, sinon on se fait dépasser.',
      Henri: 'La qualité est une discipline : sans rigueur, on détruit la confiance.',
      Aya: 'L\'efficacité ne doit pas se faire au détriment des personnes et de l\'équité.',
      Damien: '"Efficacité" est souvent un narratif managérial : qui fixe les métriques et pourquoi ?'
    }
  }
];

class EvolutionaryDebateSystem {
  
  detectDebateTopic(message: string): DebateTopic | null {
    const messageLower = message.toLowerCase();
    
    let bestMatch: { topic: DebateTopic; score: number } | null = null;
    
    for (const topic of DEBATE_TOPICS) {
      const matchCount = topic.keywords.filter(kw => messageLower.includes(kw)).length;
      if (matchCount >= 2) {
        if (!bestMatch || matchCount > bestMatch.score) {
          bestMatch = { topic, score: matchCount };
        }
      }
    }
    
    return bestMatch?.topic || null;
  }
  
  shouldTriggerDebate(
    message: string,
    currentPersona: PersonaType
  ): { shouldDebate: boolean; topic: DebateTopic | null; suggestedOpponent: PersonaType | null } {
    const topic = this.detectDebateTopic(message);
    
    if (!topic) {
      return { shouldDebate: false, topic: null, suggestedOpponent: null };
    }
    
    // Mots déclencheurs de débat
    const debateTriggers = [
      'que penses-tu', 'ton avis', 'opinion', 'crois-tu', 'es-tu d\'accord',
      'pour ou contre', 'mieux', 'pire', 'préférable', 'devrait-on',
      'faut-il', 'pourquoi', 'comment'
    ];
    
    const messageLower = message.toLowerCase();
    const hasDebateTrigger = debateTriggers.some(t => messageLower.includes(t));
    
    if (!hasDebateTrigger && message.split(' ').length < 10) {
      return { shouldDebate: false, topic: null, suggestedOpponent: null };
    }
    
    // Trouver l'opposant naturel
    const suggestedOpponent = this.findNaturalOpponent(topic, currentPersona);
    
    return { shouldDebate: true, topic, suggestedOpponent };
  }
  
  private findNaturalOpponent(_topic: DebateTopic, currentPersona: PersonaType): PersonaType {
    // Oppositions naturelles entre personas
    const oppositions: Record<PersonaType, PersonaType[]> = {
      Adrien: ['Damien', 'Nova'],
      Nova: ['Henri', 'Adrien'],
      Henri: ['Aya', 'Nova'],
      Aya: ['Henri', 'Adrien'],
      Damien: ['Adrien', 'Aya']
    };
    
    const potentialOpponents = oppositions[currentPersona];
    
    // Choisir celui qui a la position la plus différente sur ce sujet
    // Pour simplifier, on prend le premier
    return potentialOpponents[0];
  }
  
  generateDebatePositions(
    topic: DebateTopic,
    participants: PersonaType[]
  ): DebatePosition[] {
    const positions: DebatePosition[] = [];
    
    for (const persona of participants) {
      // Récupérer l'historique des débats sur ce sujet
      const debateHistory = deepMemory.getDebateHistory(persona, topic.name);
      
      // Position de base
      let stance = topic.opposingViews[persona];
      let confidence = 0.7;
      let isEvolved = false;
      let previousStance: string | undefined;
      
      // Évolution basée sur l'historique
      if (debateHistory.length > 0) {
        const lastDebate = debateHistory[debateHistory.length - 1];
        
        if (lastDebate.outcome === 'convinced') {
          // A été convaincu précédemment - nuancer la position
          previousStance = stance;
          stance = `${stance}, bien que je reconnaisse aussi d'autres perspectives`;
          confidence = 0.5;
          isEvolved = true;
        } else if (lastDebate.outcome === 'won') {
          // A gagné précédemment - renforcer la confiance
          confidence = 0.9;
        } else if (lastDebate.outcome === 'lost') {
          // A perdu précédemment - reconsidérer
          confidence = 0.6;
          stance = `${stance}, mais je suis ouvert à la discussion`;
          isEvolved = true;
        }
      }
      
      // Générer les arguments
      const arguments_ = this.generateArguments(persona, topic, confidence);
      
      positions.push({
        persona,
        stance,
        confidence,
        arguments: arguments_,
        isEvolved,
        previousStance
      });
    }
    
    return positions;
  }
  
  private generateArguments(
    persona: PersonaType,
    _topic: DebateTopic,
    confidence: number
  ): string[] {
    const baseArguments: Record<PersonaType, string[]> = {
      Adrien: [
        'Définissons les termes.',
        'Quelle preuve falsifiable ?',
        'Corrélation n’est pas causalité.'
      ],
      Nova: [
        'Le statu quo a un coût.',
        'Si on ralentit, d’autres accélèrent.',
        'Accélérer, oui — avec des garde-fous.'
      ],
      Henri: [
        'La société n’est pas un laboratoire.',
        'Toutes les normes ne sont pas arbitraires.',
        'Le progrès sans ancrage détruit.'
      ],
      Aya: [
        'Ce n’est pas neutre.',
        'Le statu quo est déjà violent.',
        'Qui est invisibilisé ici ?'
      ],
      Damien: [
        'Qui a intérêt à ce que tu le croies ?',
        'Ça ressemble à un narratif.',
        'Qu’est-ce qui falsifierait cette hypothèse ?'
      ]
    };
    
    // Sélectionner 2-3 arguments selon la confiance
    const args = baseArguments[persona] || [];
    const numArgs = confidence > 0.7 ? 3 : 2;
    
    return args.slice(0, numArgs);
  }
  
  generateDebatePromptAddition(
    topic: DebateTopic,
    position: DebatePosition,
    opponent: DebatePosition
  ): string {
    let prompt = `
🎭 CONTEXTE DE DÉBAT:
Sujet: ${topic.name}

Ta position: ${position.stance}
Confiance: ${(position.confidence * 100).toFixed(0)}%
${position.isEvolved ? `(Position évoluée depuis: "${position.previousStance}")` : ''}

Position opposée (${opponent.persona}): ${opponent.stance}

INSTRUCTIONS POUR LE DÉBAT:
- Défends ta position avec tes arguments caractéristiques
- Reconnais les points valides de l'adversaire si approprié
- ${position.confidence < 0.6 ? 'Montre de l\'ouverture au changement' : 'Reste ferme mais respectueux'}
- Propose une synthèse constructive si possible
`;
    
    return prompt;
  }
  
  recordDebateOutcome(
    topic: DebateTopic,
    positions: DebatePosition[],
    outcomes: Record<PersonaType, 'won' | 'lost' | 'draw' | 'convinced'>
  ) {
    const positionsByPersona: Record<PersonaType, string> = {
      Adrien: '',
      Nova: '',
      Henri: '',
      Aya: '',
      Damien: ''
    };

    for (const p of positions) {
      positionsByPersona[p.persona] = p.stance;
    }

    deepMemory.recordDebate(
      positions.map(p => p.persona),
      topic.name,
      positionsByPersona,
      outcomes
    );
    
    // Enregistrer aussi dans la mémoire de chaque persona
    for (const position of positions) {
      const outcome = outcomes[position.persona];
      deepMemory.addMemory(
        position.persona,
        MemoryType.DEBATE,
        `Débat sur "${topic.name}": ${position.stance}. Résultat: ${outcome}`,
        `Débat avec ${positions.filter(p => p.persona !== position.persona).map(p => p.persona).join(', ')}`,
        outcome === 'convinced' ? MemoryImportance.HIGH : MemoryImportance.MEDIUM,
        outcome === 'won' ? 0.3 : outcome === 'convinced' ? 0.5 : 0
      );
    }
  }
  
  getDebateHistorySummary(persona: PersonaType): string {
    const history = deepMemory.getDebateHistory(persona);
    
    if (history.length === 0) {
      return '';
    }
    
    const wins = history.filter(d => d.outcome === 'won').length;
    const convinced = history.filter(d => d.outcome === 'convinced').length;
    const draws = history.filter(d => d.outcome === 'draw').length;
    
    return `
📊 HISTORIQUE DES DÉBATS DE ${persona.toUpperCase()}:
- Débats totaux: ${history.length}
- Victoires: ${wins}
- Convaincu: ${convinced}
- Match nuls: ${draws}
- Sujets fréquents: ${this.getMostDebatedTopics(history)}
`;
  }
  
  private getMostDebatedTopics(history: Array<{topic: string}>): string {
    const topicCounts: Record<string, number> = {};
    for (const debate of history) {
      topicCounts[debate.topic] = (topicCounts[debate.topic] || 0) + 1;
    }
    
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic)
      .join(', ') || 'Aucun';
  }
}

export const evolutionaryDebateSystem = new EvolutionaryDebateSystem();
