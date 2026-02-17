/**
 * 🧠 SYSTÈME DE DÉTECTION ÉMOTIONNELLE - Council of Five
 * Analyse émotionnelle en temps réel des messages utilisateur
 */

export interface EmotionAnalysis {
  primaryEmotion: string;
  secondaryEmotions: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: 'low' | 'moderate' | 'high';
  confidenceScore: number;
  emotionalKeywords: string[];
  contextTriggers: string[];
}

// Patterns regex pour détection d'émotions
const EMOTION_PATTERNS: Record<string, RegExp[]> = {
  joie: [
    /\b(heureux|heureuse|joyeux|joyeuse|content|contente|ravi|ravie)\b/i,
    /\b(super|génial|fantastique|merveilleux|excellent|parfait)\b/i,
    /\b(adore|aime|plaisir|bonheur|félicitations|bravo)\b/i,
    /(😊|😄|😁|🎉|❤️|👍)/
  ],
  tristesse: [
    /\b(triste|déprimé|déprimée|mélancolique|malheureux)\b/i,
    /\b(pleure|pleurer|larmes|chagrin|peine|douleur)\b/i,
    /\b(déçu|déçue|désespéré|désespérée|abattu)\b/i,
    /(😢|😭|💔|😞|😔)/
  ],
  colère: [
    /\b(en colère|furieux|furieuse|énervé|énervée|irrité)\b/i,
    /\b(rage|déteste|hais|insupportable|inacceptable)\b/i,
    /(😠|😡|🤬|💢)/
  ],
  peur: [
    /\b(peur|effrayé|effrayée|terrifié|terrifiée|angoissé)\b/i,
    /\b(inquiet|inquiète|stressé|stressée|anxieux)\b/i,
    /(😨|😰|😱)/
  ],
  surprise: [
    /\b(surpris|surprise|étonné|étonnée|stupéfait)\b/i,
    /\b(incroyable|wow|waow|oh|quoi)\b/i,
    /(😮|😯|😲|🤯)/
  ],
  curiosité: [
    /\b(pourquoi|comment|quand|où|qui|quel|quelle)\b/i,
    /\b(curieux|curieuse|intéressé|intéressée|savoir)\b/i,
    /\b(expliquer|comprendre|découvrir|apprendre)\b/i
  ],
  confusion: [
    /\b(confus|confuse|perdu|perdue|comprends pas)\b/i,
    /\b(hein|quoi|pardon|comment ça)\b/i,
    /(🤔|😕|❓)/
  ]
};

// Mots-clés d'intensité
const INTENSITY_KEYWORDS = {
  high: ['extrêmement', 'énormément', 'terriblement', 'vraiment très', 'super', 'hyper', 'tellement'],
  moderate: ['assez', 'plutôt', 'relativement', 'pas mal', 'bien'],
  low: ['un peu', 'légèrement', 'faiblement', 'à peine', 'quelque peu']
};

// Contextes thématiques pour le Council
const CONTEXT_TRIGGERS = {
  stratégique: ['stratégie', 'plan', 'objectif', 'vision', 'futur', 'long terme'],
  analytique: ['analyse', 'données', 'risque', 'probabilité', 'logique', 'preuve'],
  créatif: ['idée', 'innovation', 'créatif', 'imagination', 'alternative', 'nouveau'],
  pratique: ['concret', 'action', 'étape', 'ressource', 'faisable', 'réaliste'],
  éthique: ['moral', 'éthique', 'valeur', 'juste', 'impact', 'humain', 'société']
};

export function analyzeEmotion(message: string): EmotionAnalysis {
  const messageLower = message.toLowerCase();
  
  // Détecter les émotions par patterns
  const detectedEmotions: Record<string, number> = {};
  
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = messageLower.match(pattern);
      if (matches) {
        score += matches.length * 0.3;
      }
    }
    if (score > 0) {
      detectedEmotions[emotion] = Math.min(score, 1.0);
    }
  }
  
  // Déterminer l'émotion primaire
  const sortedEmotions = Object.entries(detectedEmotions)
    .sort((a, b) => b[1] - a[1]);
  
  const primaryEmotion = sortedEmotions[0]?.[0] || 'neutre';
  const secondaryEmotions = sortedEmotions.slice(1, 3).map(e => e[0]);
  
  // Analyser l'intensité
  let intensity: 'low' | 'moderate' | 'high' = 'moderate';
  for (const [level, keywords] of Object.entries(INTENSITY_KEYWORDS)) {
    if (keywords.some(kw => messageLower.includes(kw))) {
      intensity = level as 'low' | 'moderate' | 'high';
      break;
    }
  }
  
  // Déterminer le sentiment
  const positiveEmotions = ['joie', 'surprise'];
  const negativeEmotions = ['tristesse', 'colère', 'peur'];
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  
  if (positiveEmotions.includes(primaryEmotion)) {
    sentiment = 'positive';
  } else if (negativeEmotions.includes(primaryEmotion)) {
    sentiment = 'negative';
  }
  
  // Extraire les mots-clés émotionnels
  const emotionalKeywords: string[] = [];
  for (const patterns of Object.values(EMOTION_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        emotionalKeywords.push(...matches);
      }
    }
  }
  
  // Détecter les contextes thématiques
  const contextTriggers: string[] = [];
  for (const [context, keywords] of Object.entries(CONTEXT_TRIGGERS)) {
    if (keywords.some(kw => messageLower.includes(kw))) {
      contextTriggers.push(context);
    }
  }
  
  // Calculer le score de confiance
  const confidenceScore = Math.min(
    0.3 + (sortedEmotions[0]?.[1] || 0) * 0.5 + (emotionalKeywords.length * 0.1),
    1.0
  );
  
  return {
    primaryEmotion,
    secondaryEmotions,
    sentiment,
    intensity,
    confidenceScore,
    emotionalKeywords: [...new Set(emotionalKeywords)].slice(0, 5),
    contextTriggers
  };
}

/**
 * Détermine quel persona est le plus approprié basé sur l'analyse émotionnelle
 */
export function suggestPersonaFromEmotion(analysis: EmotionAnalysis): string {
  // Mapping émotion -> persona suggéré
  const emotionPersonaMap: Record<string, string> = {
    joie: 'Nova',
    tristesse: 'Aya',
    colère: 'Adrien',
    peur: 'Henri',
    surprise: 'Nova',
    curiosité: 'Adrien',
    confusion: 'Adrien',
    neutre: 'Adrien'
  };
  
  // Priorité aux contextes thématiques
  if (analysis.contextTriggers.includes('éthique')) return 'Aya';
  if (analysis.contextTriggers.includes('stratégique')) return 'Nova';
  if (analysis.contextTriggers.includes('analytique')) return 'Adrien';
  if (analysis.contextTriggers.includes('créatif')) return 'Nova';
  if (analysis.contextTriggers.includes('pratique')) return 'Adrien';
  
  return emotionPersonaMap[analysis.primaryEmotion] || 'Adrien';
}
