/**
 * 🧠 SYSTÈME DE MÉMOIRE PROFONDE - Council of Five
 * Mémoire contextuelle avancée avec persistance et évolution
 */

import { PersonaType } from '../types';

export enum MemoryType {
  CONVERSATION = 'conversation',
  EMOTION = 'emotion',
  PREFERENCE = 'preference',
  DEBATE = 'debate',
  OPINION = 'opinion',
  INSIGHT = 'insight'
}

export enum MemoryImportance {
  TRIVIAL = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  CRITICAL = 5
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  context: string;
  timestamp: string;
  importance: MemoryImportance;
  emotionalImpact: number; // -1.0 à 1.0
  keywords: string[];
  relatedMemories: string[];
  persona: PersonaType;
  accessCount: number;
  lastAccessed: string | null;
}

export interface PersonaMemoryState {
  memories: Memory[];
  personalityTraits: Record<string, number>;
  recentTopics: string[];
  debateHistory: DebateMemory[];
  relationshipLevel: number; // -1.0 à 1.0
  lastInteraction: string;
}

export interface DebateMemory {
  topic: string;
  position: string;
  outcome: 'won' | 'lost' | 'draw' | 'convinced';
  timestamp: string;
  participants: PersonaType[];
}

const STORAGE_KEY = 'council_of_five_memory';

class DeepMemorySystem {
  private memories: Map<PersonaType, PersonaMemoryState> = new Map();
  
  constructor() {
    this.loadFromStorage();
    this.initializePersonas();
  }
  
  private initializePersonas() {
    const personas: PersonaType[] = ['Adrien', 'Nova', 'Henri', 'Aya', 'Damien'];
    
    const baseTraits: Record<PersonaType, Record<string, number>> = {
      Adrien: { rigor: 0.9, rationality: 0.9, skepticism: 0.7, clarity: 0.8 },
      Nova: { ambition: 0.9, speed: 0.8, optimism: 0.8, systemsThinking: 0.8 },
      Henri: { prudence: 0.9, tradition: 0.9, stability: 0.8, responsibility: 0.8 },
      Aya: { justice: 0.9, vigilance: 0.8, empathy: 0.7, critique: 0.8 },
      Damien: { skepticism: 0.9, irony: 0.7, contrarian: 0.8, patternSense: 0.7 }
    };
    
    for (const persona of personas) {
      if (!this.memories.has(persona)) {
        this.memories.set(persona, {
          memories: [],
          personalityTraits: baseTraits[persona],
          recentTopics: [],
          debateHistory: [],
          relationshipLevel: 0,
          lastInteraction: new Date().toISOString()
        });
      }
    }
  }
  
  addMemory(
    persona: PersonaType,
    type: MemoryType,
    content: string,
    context: string,
    importance: MemoryImportance = MemoryImportance.MEDIUM,
    emotionalImpact: number = 0
  ): string {
    const state = this.memories.get(persona);
    if (!state) return '';
    
    const memoryId = `${persona}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const keywords = this.extractKeywords(content);
    
    const memory: Memory = {
      id: memoryId,
      type,
      content,
      context,
      timestamp: new Date().toISOString(),
      importance,
      emotionalImpact,
      keywords,
      relatedMemories: this.findRelatedMemories(persona, keywords),
      persona,
      accessCount: 0,
      lastAccessed: null
    };
    
    state.memories.push(memory);
    state.lastInteraction = new Date().toISOString();
    
    // Mettre à jour les topics récents
    keywords.forEach(kw => {
      if (!state.recentTopics.includes(kw)) {
        state.recentTopics.unshift(kw);
        if (state.recentTopics.length > 20) {
          state.recentTopics.pop();
        }
      }
    });
    
    // Limiter à 100 souvenirs par persona
    if (state.memories.length > 100) {
      // Supprimer les moins importants et moins accédés
      state.memories.sort((a, b) => 
        (b.importance * 10 + b.accessCount) - (a.importance * 10 + a.accessCount)
      );
      state.memories = state.memories.slice(0, 100);
    }
    
    this.saveToStorage();
    return memoryId;
  }
  
  recordDebate(
    participants: PersonaType[],
    topic: string,
    positions: Record<PersonaType, string>,
    outcome: Record<PersonaType, 'won' | 'lost' | 'draw' | 'convinced'>
  ) {
    for (const persona of participants) {
      const state = this.memories.get(persona);
      if (!state) continue;
      
      const debateMemory: DebateMemory = {
        topic,
        position: positions[persona] || '',
        outcome: outcome[persona] || 'draw',
        timestamp: new Date().toISOString(),
        participants
      };
      
      state.debateHistory.push(debateMemory);
      
      // Garder max 50 débats
      if (state.debateHistory.length > 50) {
        state.debateHistory = state.debateHistory.slice(-50);
      }
      
      // Ajuster la relation selon le résultat
      if (outcome[persona] === 'convinced') {
        state.relationshipLevel = Math.min(1, state.relationshipLevel + 0.1);
      } else if (outcome[persona] === 'won') {
        state.relationshipLevel = Math.min(1, state.relationshipLevel + 0.05);
      }
    }
    
    this.saveToStorage();
  }
  
  getRelevantMemories(persona: PersonaType, query: string, limit: number = 5): Memory[] {
    const state = this.memories.get(persona);
    if (!state) return [];
    
    const queryKeywords = this.extractKeywords(query);
    
    // Scorer les souvenirs par pertinence
    const scoredMemories = state.memories.map(memory => {
      const keywordMatch = memory.keywords.filter(kw => 
        queryKeywords.some(qkw => kw.includes(qkw) || qkw.includes(kw))
      ).length;
      
      const recency = (Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - recency / 30); // Décroît sur 30 jours
      
      const score = keywordMatch * 3 + memory.importance + memory.accessCount * 0.5 + recencyScore * 2;
      
      return { memory, score };
    });
    
    // Trier et retourner les plus pertinents
    scoredMemories.sort((a, b) => b.score - a.score);
    
    const topMemories = scoredMemories.slice(0, limit).map(sm => sm.memory);
    
    // Marquer comme accédés
    topMemories.forEach(m => {
      m.accessCount++;
      m.lastAccessed = new Date().toISOString();
    });
    
    this.saveToStorage();
    return topMemories;
  }
  
  getDebateHistory(persona: PersonaType, topic?: string): DebateMemory[] {
    const state = this.memories.get(persona);
    if (!state) return [];
    
    if (topic) {
      return state.debateHistory.filter(d => 
        d.topic.toLowerCase().includes(topic.toLowerCase())
      );
    }
    
    return state.debateHistory;
  }
  
  generateContextForPersona(persona: PersonaType, currentQuery: string): string {
    const state = this.memories.get(persona);
    if (!state) return '';
    
    const relevantMemories = this.getRelevantMemories(persona, currentQuery, 3);
    const recentDebates = state.debateHistory.slice(-3);
    
    let context = '';
    
    if (relevantMemories.length > 0) {
      context += '\n📚 SOUVENIRS PERTINENTS:\n';
      relevantMemories.forEach(m => {
        context += `- ${m.content} (${m.type}, importance: ${m.importance})\n`;
      });
    }
    
    if (recentDebates.length > 0) {
      context += '\n🎭 DÉBATS RÉCENTS:\n';
      recentDebates.forEach(d => {
        context += `- ${d.topic}: Position "${d.position}" - Résultat: ${d.outcome}\n`;
      });
    }
    
    if (state.relationshipLevel !== 0) {
      const relationDesc = state.relationshipLevel > 0 ? 
        `relation positive (${(state.relationshipLevel * 100).toFixed(0)}%)` :
        `relation tendue (${(state.relationshipLevel * 100).toFixed(0)}%)`;
      context += `\n👥 Relation avec l'utilisateur: ${relationDesc}\n`;
    }
    
    return context;
  }
  
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿœæç]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    const stopWords = new Set(['avec', 'dans', 'pour', 'cette', 'sont', 'mais', 'tout', 'comme', 'très', 'bien', 'plus', 'moins', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'pouvoir', 'falloir', 'vouloir', 'aussi', 'donc', 'encore', 'toujours', 'jamais', 'rien', 'autre', 'même', 'après', 'avant', 'depuis', 'alors', 'ainsi', 'entre', 'vers', 'sous', 'sans', 'chez']);
    
    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);
  }
  
  private findRelatedMemories(persona: PersonaType, keywords: string[]): string[] {
    const state = this.memories.get(persona);
    if (!state) return [];
    
    const related: string[] = [];
    
    for (const memory of state.memories) {
      const commonKeywords = memory.keywords.filter(kw => keywords.includes(kw));
      if (commonKeywords.length >= 2) {
        related.push(memory.id);
      }
    }
    
    return related.slice(0, 5);
  }
  
  private saveToStorage() {
    try {
      const data: Record<string, PersonaMemoryState> = {};
      this.memories.forEach((state, persona) => {
        data[persona] = state;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save memory to localStorage:', e);
    }
  }
  
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, PersonaMemoryState>;
        Object.entries(data).forEach(([persona, state]) => {
          this.memories.set(persona as PersonaType, state);
        });
      }
    } catch (e) {
      console.warn('Could not load memory from localStorage:', e);
    }
  }
  
  clearMemory(persona?: PersonaType) {
    if (persona) {
      this.memories.delete(persona);
      this.initializePersonas();
    } else {
      this.memories.clear();
      this.initializePersonas();
    }
    this.saveToStorage();
  }
}

export const deepMemory = new DeepMemorySystem();
