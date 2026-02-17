/**
 * ⚡ SYSTÈME DE RÉACTIONS EN CHAÎNE - Council of Five
 * Propagation des effets entre personas pour des discussions dynamiques
 */

import { PersonaType } from '../types';

export enum ReactionTrigger {
  USER_EMOTION = 'user_emotion',
  PERSONA_DISAGREEMENT = 'persona_disagreement',
  TOPIC_SENSITIVITY = 'topic_sensitivity',
  CONVERSATION_ESCALATION = 'conversation_escalation',
  INSIGHT_DISCOVERY = 'insight_discovery'
}

export enum ReactionIntensity {
  SUBTLE = 'subtle',
  MODERATE = 'moderate',
  STRONG = 'strong',
  DRAMATIC = 'dramatic'
}

export enum PropagationPattern {
  RIPPLE = 'ripple',       // Proche en proche
  BROADCAST = 'broadcast', // Tous en même temps
  SELECTIVE = 'selective', // Selon affinités
  CASCADE = 'cascade',     // Effet domino
  CONVERGENT = 'convergent' // Tous vers un point
}

export interface ChainReaction {
  id: string;
  trigger: ReactionTrigger;
  sourcePersona: PersonaType;
  initialEvent: string;
  intensity: ReactionIntensity;
  pattern: PropagationPattern;
  affectedPersonas: PersonaType[];
  reactions: Record<PersonaType, string>;
  timestamp: Date;
  isActive: boolean;
}

// Affinités entre personas (positif = accord, négatif = tension créative)
const PERSONA_AFFINITIES: Record<PersonaType, Record<PersonaType, number>> = {
  Adrien: {
    Adrien: 1.0,
    Nova: 0.2,
    Henri: 0.3,
    Aya: 0.1,
    Damien: -0.2
  },
  Nova: {
    Adrien: 0.2,
    Nova: 1.0,
    Henri: -0.4,
    Aya: 0.2,
    Damien: 0.1
  },
  Henri: {
    Adrien: 0.3,
    Nova: -0.4,
    Henri: 1.0,
    Aya: -0.6,
    Damien: 0.3
  },
  Aya: {
    Adrien: 0.1,
    Nova: 0.2,
    Henri: -0.6,
    Aya: 1.0,
    Damien: -0.4
  },
  Damien: {
    Adrien: -0.2,
    Nova: 0.1,
    Henri: 0.3,
    Aya: -0.4,
    Damien: 1.0
  }
};

// Sujets sensibles qui déclenchent des réactions
const SENSITIVE_TOPICS = {
  controversial: ['politique', 'religion', 'argent', 'pouvoir', 'mort', 'guerre'],
  emotional: ['amour', 'peur', 'famille', 'perte', 'échec', 'succès'],
  philosophical: ['sens', 'vie', 'existence', 'vérité', 'liberté', 'justice'],
  practical: ['budget', 'deadline', 'ressource', 'contrainte', 'risque']
};

class ChainReactionSystem {
  private activeReactions: Map<string, ChainReaction> = new Map();
  private reactionHistory: ChainReaction[] = [];
  
  analyzeReactionPotential(
    message: string,
    _currentPersona: PersonaType,
    emotionalIntensity: number
  ): { shouldTrigger: boolean; trigger: ReactionTrigger | null; intensity: ReactionIntensity } {
    const messageLower = message.toLowerCase();
    
    // Vérifier les sujets sensibles
    let topicSensitivity = 0;
    for (const [, keywords] of Object.entries(SENSITIVE_TOPICS)) {
      const matches = keywords.filter(kw => messageLower.includes(kw)).length;
      if (matches > 0) {
        topicSensitivity += matches * 0.2;
      }
    }
    
    // Calculer le score de déclenchement
    const triggerScore = Math.min(1.0, topicSensitivity + emotionalIntensity * 0.4);
    
    if (triggerScore < 0.3) {
      return { shouldTrigger: false, trigger: null, intensity: ReactionIntensity.SUBTLE };
    }
    
    // Déterminer le type de déclencheur
    let trigger: ReactionTrigger;
    if (emotionalIntensity > 0.7) {
      trigger = ReactionTrigger.USER_EMOTION;
    } else if (topicSensitivity > 0.5) {
      trigger = ReactionTrigger.TOPIC_SENSITIVITY;
    } else {
      trigger = ReactionTrigger.INSIGHT_DISCOVERY;
    }
    
    // Déterminer l'intensité
    let intensity: ReactionIntensity;
    if (triggerScore >= 0.8) {
      intensity = ReactionIntensity.DRAMATIC;
    } else if (triggerScore >= 0.6) {
      intensity = ReactionIntensity.STRONG;
    } else if (triggerScore >= 0.4) {
      intensity = ReactionIntensity.MODERATE;
    } else {
      intensity = ReactionIntensity.SUBTLE;
    }
    
    return { shouldTrigger: true, trigger, intensity };
  }
  
  triggerChainReaction(
    sourcePersona: PersonaType,
    event: string,
    trigger: ReactionTrigger,
    intensity: ReactionIntensity
  ): ChainReaction | null {
    const reactionId = `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Déterminer le pattern de propagation
    const pattern = this.determinePattern(trigger, intensity);
    
    // Identifier les personas affectés
    const affectedPersonas = this.determineAffectedPersonas(sourcePersona, pattern, intensity);
    
    if (affectedPersonas.length === 0) {
      return null;
    }
    
    // Générer les réactions pour chaque persona
    const reactions = this.generateReactions(sourcePersona, affectedPersonas, event, intensity);
    
    const chainReaction: ChainReaction = {
      id: reactionId,
      trigger,
      sourcePersona,
      initialEvent: event,
      intensity,
      pattern,
      affectedPersonas,
      reactions,
      timestamp: new Date(),
      isActive: true
    };
    
    this.activeReactions.set(reactionId, chainReaction);
    this.reactionHistory.push(chainReaction);
    
    // Garder max 50 réactions dans l'historique
    if (this.reactionHistory.length > 50) {
      this.reactionHistory = this.reactionHistory.slice(-50);
    }
    
    console.log(`⚡ Réaction en chaîne déclenchée: ${reactionId}`);
    console.log(`   Source: ${sourcePersona}, Affectés: ${affectedPersonas.join(', ')}`);
    
    return chainReaction;
  }
  
  private determinePattern(trigger: ReactionTrigger, intensity: ReactionIntensity): PropagationPattern {
    if (intensity === ReactionIntensity.DRAMATIC) {
      return PropagationPattern.BROADCAST;
    }
    
    switch (trigger) {
      case ReactionTrigger.USER_EMOTION:
        return PropagationPattern.RIPPLE;
      case ReactionTrigger.PERSONA_DISAGREEMENT:
        return PropagationPattern.CASCADE;
      case ReactionTrigger.TOPIC_SENSITIVITY:
        return PropagationPattern.SELECTIVE;
      case ReactionTrigger.CONVERSATION_ESCALATION:
        return PropagationPattern.CASCADE;
      case ReactionTrigger.INSIGHT_DISCOVERY:
        return PropagationPattern.CONVERGENT;
      default:
        return PropagationPattern.RIPPLE;
    }
  }
  
  private determineAffectedPersonas(
    source: PersonaType,
    pattern: PropagationPattern,
    intensity: ReactionIntensity
  ): PersonaType[] {
    const allPersonas: PersonaType[] = ['Adrien', 'Nova', 'Henri', 'Aya', 'Damien'];
    const others = allPersonas.filter(p => p !== source);
    
    switch (pattern) {
      case PropagationPattern.BROADCAST:
        return others;
        
      case PropagationPattern.SELECTIVE:
        // Sélectionner selon affinités (tension créative = affinité négative)
        return others.filter(p => {
          const affinity = PERSONA_AFFINITIES[source][p];
          return Math.abs(affinity) > 0.3;
        });
        
      case PropagationPattern.CASCADE:
        // Ordre basé sur affinité décroissante
        return others.sort((a, b) => 
          PERSONA_AFFINITIES[source][b] - PERSONA_AFFINITIES[source][a]
        ).slice(0, intensity === ReactionIntensity.STRONG ? 3 : 2);
        
      case PropagationPattern.RIPPLE:
        // Les plus proches d'abord
        return others.sort((a, b) => 
          PERSONA_AFFINITIES[source][b] - PERSONA_AFFINITIES[source][a]
        ).slice(0, 2);
        
      case PropagationPattern.CONVERGENT:
        // Un seul persona central (Adrien par défaut)
        return source !== 'Adrien' ? ['Adrien'] : ['Nova'];
        
      default:
        return others.slice(0, 2);
    }
  }
  
  private generateReactions(
    _source: PersonaType,
    affected: PersonaType[],
    _event: string,
    intensity: ReactionIntensity
  ): Record<PersonaType, string> {
    const reactions: Record<string, string> = {};
    
    const reactionTemplates: Record<PersonaType, Record<ReactionIntensity, string[]>> = {
      Adrien: {
        [ReactionIntensity.SUBTLE]: ['clarifie une définition', 'demande une preuve'],
        [ReactionIntensity.MODERATE]: ['pointe une incohérence', 'réclame un mécanisme causal'],
        [ReactionIntensity.STRONG]: ['démonte un sophisme', 'exige un test falsifiable'],
        [ReactionIntensity.DRAMATIC]: ['refuse le flou et impose des critères', 'recadre le débat sur des faits']
      },
      Nova: {
        [ReactionIntensity.SUBTLE]: ['rappelle le coût du statu quo', 'projette l\'impact à 10 ans'],
        [ReactionIntensity.MODERATE]: ['propose d\'accélérer avec des garde-fous', 'élargit la vision système'],
        [ReactionIntensity.STRONG]: ['pousse un pari ambitieux', 'challenge la prudence excessive'],
        [ReactionIntensity.DRAMATIC]: ['appelle à un pivot rapide', 'propose un saut stratégique']
      },
      Henri: {
        [ReactionIntensity.SUBTLE]: ['rappelle une leçon historique', 'insiste sur la stabilité'],
        [ReactionIntensity.MODERATE]: ['met en garde contre une rupture', 'défend les institutions'],
        [ReactionIntensity.STRONG]: ['alerte sur les conséquences sociales', 'réclame des limites nettes'],
        [ReactionIntensity.DRAMATIC]: ['s\'oppose à l\'expérimentation sociale', 'appelle à une prudence absolue']
      },
      Aya: {
        [ReactionIntensity.SUBTLE]: ['questionne qui paie le coût', 'pointe un biais'],
        [ReactionIntensity.MODERATE]: ['dénonce une violence invisible', 'exige inclusion et réparation'],
        [ReactionIntensity.STRONG]: ['met la pression morale', 'refuse un statu quo injuste'],
        [ReactionIntensity.DRAMATIC]: ['s\'indigne et réclame un changement immédiat', 'dénonce une domination systémique']
      },
      Damien: {
        [ReactionIntensity.SUBTLE]: ['soupçonne un narratif', 'pose une question d\'incitation'],
        [ReactionIntensity.MODERATE]: ['propose une hypothèse alternative', 'demande ce qui falsifierait ça'],
        [ReactionIntensity.STRONG]: ['stress-test le discours dominant', 'pointe un conflit d\'intérêts possible'],
        [ReactionIntensity.DRAMATIC]: ['renverse le récit et exige une falsification', 'met en doute les motivations affichées']
      }
    };
    
    for (const persona of affected) {
      const templates = reactionTemplates[persona]?.[intensity] || ['réagit au point soulevé'];
      const template = templates[Math.floor(Math.random() * templates.length)];
      reactions[persona] = `${persona} ${template}`;
    }
    
    return reactions as Record<PersonaType, string>;
  }
  
  getActiveReactions(): ChainReaction[] {
    return Array.from(this.activeReactions.values()).filter(r => r.isActive);
  }
  
  getReactionContext(persona: PersonaType): string {
    const activeReactions = this.getActiveReactions();
    const relevantReactions = activeReactions.filter(r => 
      r.affectedPersonas.includes(persona) || r.sourcePersona === persona
    );
    
    if (relevantReactions.length === 0) return '';
    
    let context = '\n⚡ RÉACTIONS EN CHAÎNE ACTIVES:\n';
    for (const reaction of relevantReactions) {
      if (reaction.reactions[persona]) {
        context += `- ${reaction.reactions[persona]}\n`;
      }
    }
    
    return context;
  }
  
  deactivateReaction(reactionId: string) {
    const reaction = this.activeReactions.get(reactionId);
    if (reaction) {
      reaction.isActive = false;
    }
  }
  
  clearOldReactions(maxAgeMinutes: number = 30) {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
    this.activeReactions.forEach((reaction, id) => {
      if (reaction.timestamp.getTime() < cutoff) {
        this.deactivateReaction(id);
      }
    });
  }
}

export const chainReactionSystem = new ChainReactionSystem();
