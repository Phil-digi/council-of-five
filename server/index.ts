import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { buildFullPrompt } from '../src/prompts/orchestrator';
import { parseAndValidateJSON, generateMockResponse } from '../src/utils/jsonValidator';
import type { Mode, CouncilResponse, PersonaType } from '../src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// ============================================
// 🧠 SYSTÈMES AVANCÉS (intégrés côté serveur)
// ============================================

// Emotion Detection simplifié
function analyzeEmotion(message: string) {
  const messageLower = message.toLowerCase();

  const emotionPatterns: Record<string, string[]> = {
    joie: ['heureux', 'content', 'super', 'génial', 'merci', 'parfait', 'excellent'],
    tristesse: ['triste', 'déprimé', 'déçu', 'malheureux', 'dommage'],
    colère: ['énervé', 'furieux', 'agacé', 'marre', 'insupportable'],
    peur: ['peur', 'inquiet', 'stressé', 'anxieux', 'angoissé'],
    curiosité: ['pourquoi', 'comment', 'quand', 'où', 'qui', 'quel', 'expliquer'],
    confusion: ['comprends pas', 'confus', 'perdu', 'bizarre']
  };

  let primaryEmotion = 'neutre';
  let maxScore = 0;

  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    const score = patterns.filter(p => messageLower.includes(p)).length;
    if (score > maxScore) {
      maxScore = score;
      primaryEmotion = emotion;
    }
  }

  const intensity = maxScore >= 2 ? 'high' : maxScore === 1 ? 'moderate' : 'low';

  return { primaryEmotion, intensity, score: maxScore * 0.3 };
}

// Suggestion de persona basée sur l'émotion et le contenu
function suggestPersona(message: string, emotion: { primaryEmotion: string }): PersonaType {
  const messageLower = message.toLowerCase();

  // Mots-clés par persona
  const personaKeywords: Record<PersonaType, string[]> = {
    Adrien: ['logique', 'preuve', 'définition', 'cohérence', 'hypothèse', 'falsifiable', 'corrélation', 'causalité', 'mécanisme', 'données'],
    Nova: ['futur', 'progrès', 'innovation', 'accélérer', 'accélération', 'statu quo', 'réseau', 'décennie', 'technologie', 'ia'],
    Henri: ['ordre', 'tradition', 'stabilité', 'institutions', 'cohésion', 'normes', 'autorité', 'devoir', 'responsabilité', 'sécurité'],
    Aya: ['justice', 'justice sociale', 'inclusion', 'domination', 'systémique', 'marginalisé', 'biais', 'égalité', 'oppression', 'discrimination'],
    Damien: ['incitation', 'intérêt', 'narratif', 'storytelling', 'pouvoir', 'agenda', 'censure', 'médias', 'manipulation', 'conflit d\'intérêts']
  };

  // Scorer chaque persona
  let bestPersona: PersonaType = 'Adrien';
  let bestScore = 0;

  for (const [persona, keywords] of Object.entries(personaKeywords)) {
    const score = keywords.filter(kw => messageLower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestPersona = persona as PersonaType;
    }
  }

  // Si pas de match par mots-clés, utiliser l'émotion
  if (bestScore === 0) {
    const emotionPersonaMap: Record<string, PersonaType> = {
      joie: 'Nova',
      tristesse: 'Aya',
      colère: 'Adrien',
      peur: 'Henri',
      curiosité: 'Adrien',
      confusion: 'Adrien',
      neutre: 'Adrien'
    };
    bestPersona = emotionPersonaMap[emotion.primaryEmotion] || 'Adrien';
  }

  return bestPersona;
}

// Mémoire simple en mémoire (pour cette session)
const sessionMemory: Map<string, {
  conversations: Array<{ role: string; content: string; persona?: string }>;
  topics: string[];
  emotionalHistory: string[];
}> = new Map();

function getOrCreateSession(sessionId: string) {
  if (!sessionMemory.has(sessionId)) {
    sessionMemory.set(sessionId, {
      conversations: [],
      topics: [],
      emotionalHistory: []
    });
  }
  return sessionMemory.get(sessionId)!;
}

// Détection de sujets de débat
const DEBATE_TOPICS = {
  action_vs_analysis: ['agir', 'réfléchir', 'attendre', 'décider', 'analyser'],
  risk_vs_safety: ['risque', 'sécurité', 'prudence', 'audace', 'danger'],
  innovation_vs_tradition: ['nouveau', 'ancien', 'tradition', 'innovation', 'changement'],
  individual_vs_collective: ['individu', 'groupe', 'équipe', 'seul', 'ensemble']
};

function detectDebateTopic(message: string): string | null {
  const messageLower = message.toLowerCase();

  for (const [topic, keywords] of Object.entries(DEBATE_TOPICS)) {
    const matches = keywords.filter(kw => messageLower.includes(kw)).length;
    if (matches >= 2) return topic;
  }
  return null;
}

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', model: MODEL, features: ['emotion', 'memory', 'debate', 'chain_reaction'] });
});

// Main council endpoint
app.post('/api/council', async (req, res) => {
  try {
    const { question, mode = 'auto', sessionId = 'default' } = req.body as {
      question: string;
      mode: Mode;
      sessionId?: string;
    };

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 🧠 ANALYSE ÉMOTIONNELLE
    const emotionAnalysis = analyzeEmotion(question);
    console.log(`🎭 Émotion détectée: ${emotionAnalysis.primaryEmotion} (${emotionAnalysis.intensity})`);

    // 🎯 SUGGESTION DE PERSONA
    const suggestedPersona = suggestPersona(question, emotionAnalysis);
    console.log(`🎯 Persona suggéré: ${suggestedPersona}`);

    // 📚 MÉMOIRE DE SESSION
    const session = getOrCreateSession(sessionId);
    session.conversations.push({ role: 'user', content: question });
    session.emotionalHistory.push(emotionAnalysis.primaryEmotion);

    // Garder max 20 conversations
    if (session.conversations.length > 20) {
      session.conversations = session.conversations.slice(-20);
    }

    // 🎭 DÉTECTION DE DÉBAT
    const debateTopic = detectDebateTopic(question);
    if (debateTopic) {
      console.log(`⚔️ Sujet de débat détecté: ${debateTopic}`);
    }

    // If no API key, return mock response
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
      console.log('⚠️ No API key configured, returning mock response');
      const mockResponse = generateMockResponse(question, mode);
      return res.json(mockResponse);
    }

    console.log(`📝 Processing question (mode: ${mode}): ${question.slice(0, 100)}...`);

    // 🧠 ENRICHISSEMENT DU CONTEXTE
    let contextAddition = '';

    // Ajouter le contexte émotionnel
    if (emotionAnalysis.primaryEmotion !== 'neutre') {
      contextAddition += `\n\n🎭 CONTEXTE ÉMOTIONNEL:\nL'utilisateur exprime: ${emotionAnalysis.primaryEmotion} (intensité: ${emotionAnalysis.intensity})\nAdapte ton ton en conséquence.`;
    }

    // Ajouter l'historique conversationnel
    if (session.conversations.length > 1) {
      const recentContext = session.conversations.slice(-3).map(c =>
        `${c.role === 'user' ? 'Utilisateur' : c.persona || 'Conseil'}: ${c.content.slice(0, 100)}...`
      ).join('\n');
      contextAddition += `\n\n📚 HISTORIQUE RÉCENT:\n${recentContext}`;
    }

    // Ajouter la suggestion de persona pour mode quick/auto
    if (mode === 'quick' || mode === 'auto') {
      contextAddition += `\n\n🎯 PERSONA RECOMMANDÉ: ${suggestedPersona}\nCe persona est le plus approprié pour cette question.`;
    }

    const fullPrompt = buildFullPrompt(question, mode) + contextAddition;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an AI orchestrator that must respond with valid JSON only. No markdown, no explanations.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      max_completion_tokens: 1500,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    console.log('📨 Raw response received, length:', rawResponse.length);

    // Parse and validate the JSON response
    let councilResponse: CouncilResponse;
    try {
      councilResponse = parseAndValidateJSON(rawResponse);
      console.log('✅ Response parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Return a fallback response
      councilResponse = generateMockResponse(question, mode);
      councilResponse.synthesis.summary = 'There was an error processing the AI response. Here is a simplified answer based on your question.';
    }

    res.json(councilResponse);

  } catch (error) {
    console.error('❌ Error processing request:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🎙️ Realtime API proxy — avoids CORS by proxying the SDP exchange
app.post('/api/realtime/session', express.text({ type: '*/*' }), async (req, res) => {
  try {
    const model = (req.query.model as string) || 'gpt-4o-realtime-preview-2024-12-17';
    const sdpOffer = req.body;

    if (!sdpOffer || typeof sdpOffer !== 'string') {
      return res.status(400).json({ error: 'SDP offer is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
      return res.status(503).json({ error: 'Realtime not available without API key' });
    }

    console.log(`🎙️ Realtime proxy: forwarding SDP offer to OpenAI (model: ${model})`);

    const openaiResponse = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/sdp'
        },
        body: sdpOffer
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI Realtime error:', openaiResponse.status, errorText);
      return res.status(openaiResponse.status).json({
        error: 'OpenAI Realtime API error',
        details: errorText
      });
    }

    const answerSdp = await openaiResponse.text();
    console.log('✅ Realtime proxy: got SDP answer from OpenAI');

    res.set('Content-Type', 'application/sdp');
    res.send(answerSdp);

  } catch (error) {
    console.error('❌ Realtime proxy error:', error);
    res.status(500).json({
      error: 'Realtime proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// TTS endpoint for persona voices
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy', persona } = req.body as {
      text: string;
      voice: string;
      persona?: string;
    };

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text for TTS
    const cleanText = text
      .replace(/[🎯📊💡🔧⚖️🧠🚀🛡️✊🕵️]/g, '') // Remove persona emojis
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'No speakable text' });
    }

    console.log(`🔊 TTS request for ${persona || 'unknown'} (voice: ${voice}): ${cleanText.slice(0, 50)}...`);

    // If no API key, return error
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
      return res.status(503).json({ error: 'TTS not available without API key' });
    }

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: cleanText,
      response_format: 'mp3'
    });

    // Get the audio as a buffer
    const buffer = Buffer.from(await response.arrayBuffer());

    // Send audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);

  } catch (error) {
    console.error('❌ TTS error:', error);
    res.status(500).json({
      error: 'TTS failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// En production, servir le frontend buildé par Vite
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

app.use(express.static(distPath));

// Fallback SPA: toutes les routes non-API renvoient index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Council of Five running on port ${PORT}`);
  console.log(`📊 Model: ${MODEL}`);
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🎯 Mode: ${process.env.NODE_ENV || 'development'}`);
});
