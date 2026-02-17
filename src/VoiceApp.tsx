/**
 * 🎙️ INTERFACE VOCALE - Council of Five
 * Interface entièrement vocale avec les 5 personas visibles
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PersonaType, PERSONAS } from './types';
import { useRealtimeVoice } from './hooks/useRealtimeVoice';

// Déclaration TypeScript pour l'API Web Speech
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Clé API (gérée côté backend via le proxy /api/realtime/session)
const API_KEY = 'proxy-managed';

type AppState = 'welcome' | 'intro_speaking' | 'listening_name' | 'greeting_speaking' | 'listening_question' | 'connecting' | 'responding';

type TurnKind = 'main' | 'intervention' | 'closing';

type PendingTurn = {
  persona: PersonaType;
  message: string;
  kind: TurnKind;
  calloutTarget?: PersonaType;
};

type LastExchange = {
  question: string;
  persona: PersonaType;
  answer: string;
};

type TurnRecord = {
  persona: PersonaType;
  kind: TurnKind;
  text: string;
};

type CompletedDebate = {
  question: string;
  records: TurnRecord[];
  date: Date;
};

const ALL_PERSONAS: PersonaType[] = ['Adrien', 'Nova', 'Henri', 'Aya', 'Damien'];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}


function pickDistinctPersona(candidates: PersonaType[], exclude: Set<PersonaType>): PersonaType | null {
  const pool = candidates.filter(p => !exclude.has(p));
  if (pool.length === 0) return null;
  return pickRandom(pool);
}

function selectPersonaFromQuestion(question: string, lastPersona: PersonaType | null): PersonaType {
  const q = question.toLowerCase();

  const candidates: PersonaType[] = [];
  if (/logiq|preuve|défin|falsifi|corrél|causal|hypothès|sophism|cohér|raison|mécanism|statist|donné|data/.test(q)) candidates.push('Adrien');
  if (/futur|innovation|accél|progrès|décenn|statu quo|réseau|scal|compétit|technolog|ia\b|ai\b/.test(q)) candidates.push('Nova');
  if (/ordre|tradition|stabilit|institut|cohésion|norme|autorité|devoir|responsabilit|patrimoine|identit|sécurit/.test(q)) candidates.push('Henri');
  if (/justice sociale|inclusion|dominati|systém|marginalis|biais|racis|sexism|trans|lgbt|oppress|privilège|invisibilis/.test(q)) candidates.push('Aya');
  if (/incitation|intérêt|narratif|storytell|manipul|propagand|complot|conspi|lobby|pouvoir|agenda|censure|médias/.test(q)) candidates.push('Damien');

  if (candidates.length === 1) {
    const primary = candidates[0];
    const shouldDiversify = Math.random() < 0.30;
    if (!shouldDiversify) {
      if (lastPersona && primary === lastPersona && Math.random() < 0.55) {
        return pickRandom(ALL_PERSONAS.filter(p => p !== primary));
      }
      return primary;
    }

    let altPool = ALL_PERSONAS.filter(p => p !== primary);
    if (lastPersona && altPool.includes(lastPersona) && altPool.length > 1 && Math.random() < 0.80) {
      altPool = altPool.filter(p => p !== lastPersona);
    }
    return pickRandom(altPool);
  }

  let pool: PersonaType[] = candidates.length > 0 ? candidates : [...ALL_PERSONAS];
  if (lastPersona && pool.includes(lastPersona) && pool.length > 1 && Math.random() < 0.85) {
    pool = pool.filter(p => p !== lastPersona);
  }

  return pickRandom(pool);
}

type InterventionStance = 'support' | 'challenge' | 'wildcard';

type InterventionPlanItem = {
  persona: PersonaType;
  stance: InterventionStance;
};

const SUPPORTERS: Record<PersonaType, PersonaType[]> = {
  Adrien: ['Nova', 'Henri', 'Aya'],
  Nova: ['Aya', 'Damien', 'Adrien'],
  Henri: ['Adrien', 'Damien', 'Nova'],
  Aya: ['Nova', 'Adrien', 'Damien'],
  Damien: ['Henri', 'Adrien', 'Nova']
};

const CHALLENGERS: Record<PersonaType, PersonaType[]> = {
  Adrien: ['Damien', 'Aya', 'Nova'],
  Nova: ['Henri', 'Adrien', 'Aya'],
  Henri: ['Aya', 'Nova', 'Adrien'],
  Aya: ['Henri', 'Adrien', 'Damien'],
  Damien: ['Adrien', 'Aya', 'Nova']
};

function getInterventionPlan(main: PersonaType, exclude: PersonaType[] = []): InterventionPlanItem[] {
  const used = new Set<PersonaType>([main, ...exclude]);
  const plan: InterventionPlanItem[] = [];

  const supporter = pickDistinctPersona(SUPPORTERS[main] || ALL_PERSONAS, used) ?? pickDistinctPersona(ALL_PERSONAS, used);
  if (supporter) {
    used.add(supporter);
    plan.push({ persona: supporter, stance: 'support' });
  }

  const challenger = pickDistinctPersona(CHALLENGERS[main] || ALL_PERSONAS, used) ?? pickDistinctPersona(ALL_PERSONAS, used);
  if (challenger) {
    used.add(challenger);
    plan.push({ persona: challenger, stance: 'challenge' });
  }

  if (plan.length >= 2 && Math.random() < 0.50) {
    const tmp = plan[0];
    plan[0] = plan[1];
    plan[1] = tmp;
  }

  let remaining = ALL_PERSONAS.filter(p => !used.has(p));
  if (remaining.length > 0 && Math.random() < 0.75) {
    const wildcard = pickRandom(remaining);
    used.add(wildcard);
    plan.push({ persona: wildcard, stance: 'wildcard' });
  }

  remaining = ALL_PERSONAS.filter(p => !used.has(p));
  if (remaining.length > 0 && Math.random() < 0.40) {
    const wildcard2 = pickRandom(remaining);
    used.add(wildcard2);
    plan.push({ persona: wildcard2, stance: 'wildcard' });
  }

  return plan;
}

function getClosingPersona(_main: PersonaType): PersonaType {
  // Nova est toujours l'animatrice — elle ouvre et ferme le débat
  return 'Nova';
}

function truncateForPrompt(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function personaDisplayName(persona: PersonaType): string {
  return PERSONAS[persona].name;
}

export function VoiceApp() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [userName, setUserName] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [questionSent, setQuestionSent] = useState(false);
  const [hasStartedSpeaking, setHasStartedSpeaking] = useState(false);
  const [pendingTurns, setPendingTurns] = useState<PendingTurn[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [lastExchange, setLastExchange] = useState<LastExchange | null>(null);
  const [turnRecords, setTurnRecords] = useState<TurnRecord[]>([]);
  const [completedDebate, setCompletedDebate] = useState<CompletedDebate | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const {
    isConnected,
    isSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    sendMessage
  } = useRealtimeVoice(API_KEY);

  const currentTurn = pendingTurns[turnIndex];
  const currentTurnLabel = currentTurn?.kind === 'main'
    ? 'Réponse principale'
    : currentTurn?.kind === 'intervention'
      ? 'Intervention'
      : currentTurn?.kind === 'closing'
        ? 'Décision'
        : '';
  const currentSpeaker = selectedPersona ? PERSONAS[selectedPersona] : null;

  // Reconnaissance vocale
  const startListening = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError('Reconnaissance vocale non supportée');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setInterimTranscript('');
      setVoiceError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim || final);

      if (final) {
        onResult(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        setVoiceError(`Erreur micro: ${event.error}`);
      }
    };

    recognition.onend = () => setInterimTranscript('');

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Démarrer - connecter un hôte pour l'intro
  const handleStart = async () => {
    setAppState('intro_speaking');
    setSelectedPersona('Nova');
    const success = await connect('Nova');
    if (success) {
      setTimeout(() => {
        sendMessage("Tu es Nova, tu accueilles le public. Dis simplement: Bienvenue au débat des Cinq! Moi c'est Nova. Ce soir, pas de langue de bois — on se coupe, on tranche. Comment vous appelez-vous? Sois brève et chaleureuse, 2 phrases max.");
      }, 1000);
    }
  };

  // Tracker quand l'IA commence à parler
  useEffect(() => {
    if (isSpeaking) {
      setHasStartedSpeaking(true);
    }
  }, [isSpeaking]);

  // Quand l'hôte a fini de parler l'intro, écouter le nom
  useEffect(() => {
    if (appState === 'intro_speaking' && isConnected && hasStartedSpeaking && !isSpeaking) {
      // L'intro est terminée, écouter le nom
      setHasStartedSpeaking(false);
      disconnect();
      setAppState('listening_name');
    }
  }, [appState, isConnected, isSpeaking, hasStartedSpeaking, disconnect]);

  // Démarrer l'écoute quand on passe en mode listening_name
  useEffect(() => {
    if (appState === 'listening_name' && !isConnected) {
      const timer = setTimeout(() => {
        startListening((name) => {
          setUserName(name);
          stopListening();
          setAppState('greeting_speaking');
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appState, isConnected, startListening, stopListening]);

  // Connecter pour le greeting quand userName est défini et état = greeting_speaking
  useEffect(() => {
    if (appState === 'greeting_speaking' && userName && !isConnected) {
      const connectAndGreet = async () => {
        setSelectedPersona('Nova');
        const success = await connect('Nova');
        if (success) {
          setTimeout(() => {
            sendMessage(`Tu es Nova. Dis simplement: ${userName}, bienvenue! Alors, quel sujet vous amène ce soir? Ici on débat cash, on se coupe, on tranche — sur les idées. Sois brève, 2 phrases max.`);
          }, 1000);
        }
      };
      connectAndGreet();
    }
  }, [appState, userName, isConnected, connect, sendMessage]);

  // Quand le greeting est fini, écouter la question
  useEffect(() => {
    if (appState === 'greeting_speaking' && isConnected && hasStartedSpeaking && !isSpeaking) {
      setHasStartedSpeaking(false);
      disconnect();
      setAppState('listening_question');
    }
  }, [appState, isConnected, isSpeaking, hasStartedSpeaking, disconnect]);

  // Démarrer l'écoute de la question
  useEffect(() => {
    if (appState === 'listening_question' && !isConnected) {
      const timer = setTimeout(() => {
        startListening((question) => {
          setUserQuestion(question);
          stopListening();
          handleQuestionReceived(question);
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appState, isConnected, startListening, stopListening]);

  // Traiter la question - sélectionner le bon persona et répondre
  const handleQuestionReceived = async (question: string) => {
    const mainPersona = selectPersonaFromQuestion(question, lastExchange?.persona ?? null);
    const challengerPool = (CHALLENGERS[mainPersona] || []).filter(p => p !== mainPersona);
    const fallbackPool = ALL_PERSONAS.filter(p => p !== mainPersona);
    const calloutPersona = challengerPool.length > 0 && Math.random() < 0.80
      ? pickRandom(challengerPool)
      : pickRandom(fallbackPool);
    const calloutName = personaDisplayName(calloutPersona);
    const previousContext = lastExchange
      ? `Pour contexte, juste avant ${lastExchange.persona} a dit: "${truncateForPrompt(lastExchange.answer, 200)}". `
      : '';
    const mainTurn: PendingTurn = {
      persona: mainPersona,
      kind: 'main',
      calloutTarget: calloutPersona,
      message: `${previousContext}${userName} te demande: "${question}". Réponds comme dans un vrai débat TV français — cash, vivant, naturel. Donne ta position en 4-6 phrases max. À la fin, interpelle ${calloutName} directement: pose-lui une question qui le met en difficulté ou provoque-le sur ses idées. Français oral, pas écrit.`
    };

    setPendingTurns([mainTurn]);
    setTurnIndex(0);
    setTurnRecords([]);
    setSelectedPersona(mainPersona);
    setHasStartedSpeaking(false);
    setAppState('connecting');
    setQuestionSent(false);

    await connect(mainPersona);
  };

  // Envoyer la question au persona une fois connecté
  useEffect(() => {
    const currentTurn = pendingTurns[turnIndex];

    if (appState === 'connecting' && isConnected && !questionSent && currentTurn) {
      setQuestionSent(true);
      setAppState('responding');
      sendMessage(currentTurn.message);
    }
  }, [appState, isConnected, questionSent, pendingTurns, turnIndex, sendMessage]);

  useEffect(() => {
    if (appState === 'responding' && isConnected && hasStartedSpeaking && !isSpeaking) {
      const currentTurn = pendingTurns[turnIndex];
      if (!currentTurn) return;

      const answerText = transcript.trim();
      const nextRecords: TurnRecord[] = [...turnRecords, { persona: currentTurn.persona, kind: currentTurn.kind, text: answerText }];
      setTurnRecords(nextRecords);
      let nextTurns = pendingTurns;

      if (currentTurn.kind === 'main') {
        const mainName = personaDisplayName(currentTurn.persona);
        let calloutTarget = currentTurn.calloutTarget;
        if (!calloutTarget || calloutTarget === currentTurn.persona) {
          calloutTarget = pickRandom(ALL_PERSONAS.filter(p => p !== currentTurn.persona));
        }

        const calloutTurn: PendingTurn = {
          persona: calloutTarget,
          kind: 'intervention',
          message: `${mainName} vient de te prendre à partie sur la question: "${userQuestion}". Il a dit: "${truncateForPrompt(answerText, 250)}". Réponds-lui directement — adresse-le par son nom. Dis clairement si t'es d'accord ou pas, puis rebondis sur son argument avec le tien. Sois naturel, comme dans un vrai débat. 3-5 phrases max, français oral.`
        };

        // Suivre qui a parlé pour ne citer que des personnes déjà intervenues
        const interventionPlan = getInterventionPlan(currentTurn.persona, [calloutTarget]);
        const spokenSoFar: PersonaType[] = [currentTurn.persona, calloutTarget];

        const interventionTurns: PendingTurn[] = interventionPlan.map((item) => {
          // Ne citer que quelqu'un qui a déjà parlé (pas le persona courant)
          const citablePersonas = spokenSoFar.filter(p => p !== item.persona);
          const teaseTarget = citablePersonas.length > 0
            ? pickRandom(citablePersonas)
            : currentTurn.persona; // fallback: citer le persona principal
          const teaseName = personaDisplayName(teaseTarget);

          // Ajouter ce persona à la liste des "déjà parlé"
          spokenSoFar.push(item.persona);

          const stanceInstruction = item.stance === 'support'
            ? `Tu es plutôt d'accord avec ${mainName} sur ce coup-là. Dis-le clairement, puis renforce son argument avec ton propre angle. Tu peux quand même envoyer une pique à ${teaseName} en passant.`
            : item.stance === 'challenge'
              ? `Tu n'es pas d'accord avec ${mainName}. Dis-le franchement, pointe ce qui cloche dans son raisonnement et propose une alternative. Tu peux interpeller ${teaseName} aussi.`
              : `Tu apportes un angle complètement différent que personne n'a vu. Surprends tout le monde — un twist, une hypothèse, un fait inattendu. Interpelle ${teaseName} au passage.`;

          return {
            persona: item.persona,
            kind: 'intervention' as TurnKind,
            message: `On débat sur: "${userQuestion}". ${mainName} vient de dire: "${truncateForPrompt(answerText, 200)}". ${stanceInstruction} 3-5 phrases max, français oral, naturel.`
          };
        });

        nextTurns = [...pendingTurns, calloutTurn, ...interventionTurns];
        setPendingTurns(nextTurns);
      }

      const nextIndex = turnIndex + 1;
      const nextTurn = nextTurns[nextIndex];

      setHasStartedSpeaking(false);
      disconnect();
      setQuestionSent(false);

      if (nextTurn) {
        setTurnIndex(nextIndex);
        setSelectedPersona(nextTurn.persona);
        setAppState('connecting');

        setTimeout(() => {
          connect(nextTurn.persona);
        }, 300);
      } else if (currentTurn.kind !== 'closing') {
        const main = pendingTurns.find(t => t.kind === 'main')?.persona || 'Adrien';
        const closingPersona = getClosingPersona(main);
        const closingTargets = Array.from(
          new Set(nextRecords.map(r => r.persona).filter(p => p !== closingPersona))
        );
        const closingTease = closingTargets.length > 0
          ? pickRandom(closingTargets)
          : pickRandom(ALL_PERSONAS.filter(p => p !== closingPersona));
        const closingTeaseName = personaDisplayName(closingTease);
        const debateRecap = nextRecords
          .map(r => `${personaDisplayName(r.persona)}: "${truncateForPrompt(r.text, 300)}"`)
          .join(' | ');

        const closingTurn: PendingTurn = {
          persona: closingPersona,
          kind: 'closing',
          message: `Tu es Nova, l'animatrice du débat des Cinq. La question était: "${userQuestion}". Voici ce que chacun a dit: ${debateRecap}. Maintenant, conclus le débat comme une vraie animatrice TV: (1) Reprends brièvement la position de chaque intervenant en les citant par leur nom — "Adrien a dit que...", "Henri lui a répondu que...", etc. (2) Donne ton verdict: qui avait le meilleur argument et pourquoi. (3) Termine par une punchline de fin et une dernière pique amicale à ${closingTeaseName}. Français oral, naturel. 6-8 phrases pour bien conclure.`
        };

        const updatedTurns = [...nextTurns, closingTurn];
        const closingIndex = updatedTurns.length - 1;
        setPendingTurns(updatedTurns);
        setTurnIndex(closingIndex);
        setSelectedPersona(closingPersona);
        setAppState('connecting');

        setTimeout(() => {
          connect(closingPersona);
        }, 300);
      } else {
        // Sauvegarder le débat complet avant de tout reset
        setCompletedDebate({
          question: userQuestion,
          records: nextRecords,
          date: new Date()
        });

        setLastExchange({
          question: userQuestion,
          persona: currentTurn.persona,
          answer: answerText
        });

        setPendingTurns([]);
        setTurnIndex(0);
        setSelectedPersona(null);
        setUserQuestion('');
        setTurnRecords([]);
        setAppState('listening_question');
      }
    }
  }, [
    appState,
    isConnected,
    isSpeaking,
    hasStartedSpeaking,
    pendingTurns,
    turnIndex,
    transcript,
    userQuestion,
    turnRecords,
    disconnect,
    connect
  ]);

  // Télécharger la transcription du débat
  const downloadTranscript = useCallback(() => {
    if (!completedDebate) return;

    const kindLabels: Record<TurnKind, string> = {
      main: 'Réponse principale',
      intervention: 'Intervention',
      closing: 'Conclusion'
    };

    const dateStr = completedDebate.date.toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    let content = `LE DÉBAT DES CINQ\n`;
    content += `${'═'.repeat(50)}\n\n`;
    content += `📅 ${dateStr}\n`;
    content += `❓ Question : ${completedDebate.question}\n\n`;
    content += `${'─'.repeat(50)}\n\n`;

    completedDebate.records.forEach((record, i) => {
      const persona = PERSONAS[record.persona];
      const label = kindLabels[record.kind] || record.kind;
      content += `${persona.emoji} ${persona.name} — ${label}\n`;
      content += `${record.text}\n\n`;
      if (i < completedDebate.records.length - 1) {
        content += `${'· '.repeat(25)}\n\n`;
      }
    });

    content += `${'═'.repeat(50)}\n`;
    content += `Généré par Le Débat des Cinq\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debat-des-cinq-${completedDebate.date.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [completedDebate]);

  // Reset
  const handleNewQuestion = () => {
    stopListening();
    disconnect();
    setAppState('listening_question');
    setUserQuestion('');
    setSelectedPersona(null);
    setQuestionSent(false);
    setHasStartedSpeaking(false);
    setPendingTurns([]);
    setTurnIndex(0);
    setTurnRecords([]);
  };

  const handleReset = () => {
    stopListening();
    disconnect();
    setAppState('welcome');
    setUserName('');
    setUserQuestion('');
    setSelectedPersona(null);
    setQuestionSent(false);
    setHasStartedSpeaking(false);
    setPendingTurns([]);
    setTurnIndex(0);
    setLastExchange(null);
    setTurnRecords([]);
  };

  return (
    <div className="voice-app">
      <header className="voice-header">
        <h1>🏛️ Le débat des Cinq</h1>
        {userName && <p className="user-greeting">Bonjour {userName}</p>}
      </header>

      {/* Les 5 personas toujours visibles */}
      <div className="personas-bar">
        {ALL_PERSONAS.map(p => {
          const config = PERSONAS[p];
          const isActive = selectedPersona === p;
          const isTalking = isActive && isSpeaking;
          return (
            <div
              key={p}
              className={`persona-avatar ${isActive ? 'active' : ''} ${isTalking ? 'talking' : ''}`}
              style={{ '--persona-color': config.color } as React.CSSProperties}
            >
              <span className="avatar-emoji">{config.emoji}</span>
              <span className="avatar-name">{config.name}</span>
              {isTalking && <span className="talking-indicator">🎙️</span>}
            </div>
          );
        })}
      </div>

      <main className="voice-main">

        {/* Accueil */}
        {appState === 'welcome' && (
          <div className="center-content">
            <h2>Bienvenue</h2>
            <p>Cliquez pour démarrer une conversation vocale</p>
            <button className="start-btn" onClick={handleStart}>
              🎙️ Commencer
            </button>
          </div>
        )}

        {/* Intro parlée par l'hôte */}
        {appState === 'intro_speaking' && (
          <div className="center-content">
            <div className="status-badge speaking">🔊 Le débat des Cinq vous accueille...</div>
            {transcript && <p className="transcript-live">{transcript}</p>}
          </div>
        )}

        {/* Écoute du nom */}
        {appState === 'listening_name' && (
          <div className="center-content">
            <div className="status-badge listening">🎤 Dites votre prénom</div>
            {interimTranscript && <p className="transcript-live">"{interimTranscript}"</p>}
          </div>
        )}

        {/* Greeting parlé */}
        {appState === 'greeting_speaking' && (
          <div className="center-content">
            <div className="status-badge speaking">🔊 Le débat des Cinq vous écoute...</div>
            {transcript && <p className="transcript-live">{transcript}</p>}
          </div>
        )}

        {/* Écoute de la question */}
        {appState === 'listening_question' && (
          <div className="center-content">
            <div className="status-badge listening">🎤 Posez votre question</div>
            {interimTranscript && <p className="transcript-live">"{interimTranscript}"</p>}
            {completedDebate && (
              <button className="download-btn" onClick={downloadTranscript}>
                📄 Télécharger la transcription
              </button>
            )}
          </div>
        )}

        {/* Connexion */}
        {appState === 'connecting' && (
          <div className="center-content">
            {currentSpeaker && (
              <div className="speaker-banner" style={{ borderColor: currentSpeaker.color }}>
                <span className="speaker-emoji">{currentSpeaker.emoji}</span>
                <strong className="speaker-name">{currentSpeaker.name}</strong>
                {currentTurnLabel && <span className="speaker-kind">{currentTurnLabel}</span>}
                {pendingTurns.length > 0 && <span className="speaker-progress">Tour {turnIndex + 1}/{pendingTurns.length}</span>}
              </div>
            )}

            <div className="status-badge">⏳ Connexion…</div>
          </div>
        )}

        {/* Réponse */}
        {appState === 'responding' && (
          <div className="center-content">
            {currentSpeaker && (
              <div className="speaker-banner" style={{ borderColor: currentSpeaker.color }}>
                <span className="speaker-emoji">{currentSpeaker.emoji}</span>
                <strong className="speaker-name">{currentSpeaker.name}</strong>
                {currentTurnLabel && <span className="speaker-kind">{currentTurnLabel}</span>}
                {pendingTurns.length > 0 && <span className="speaker-progress">Tour {turnIndex + 1}/{pendingTurns.length}</span>}
              </div>
            )}

            <div className={`status-badge ${isSpeaking ? 'speaking' : 'listening'}`}>
              {isSpeaking ? '🔊 Réponse en cours...' : '🎤 À votre écoute'}
            </div>

            {transcript && (
              <div className="transcript-box">
                <p>{transcript}</p>
              </div>
            )}

            {userQuestion && (
              <div className="question-reminder">
                <strong>Question :</strong> {userQuestion}
              </div>
            )}

            <button className="reset-btn" onClick={handleNewQuestion}>
              🎤 Nouvelle question
            </button>

            <button className="reset-btn" onClick={handleReset}>
              🔄 Recommencer
            </button>
          </div>
        )}

        {/* Erreur */}
        {(error || voiceError) && (
          <div className="error-box">❌ {error || voiceError}</div>
        )}
      </main>

      <style>{`
        .voice-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .voice-header {
          text-align: center;
          padding: 1rem;
        }

        .voice-header h1 {
          font-size: 1.5rem;
          margin: 0;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .user-greeting {
          color: #94a3b8;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }

        /* Barre des 5 personas toujours visible */
        .personas-bar {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(0,0,0,0.2);
        }

        .persona-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 2px solid transparent;
          opacity: 0.25;
          transition: all 0.3s ease;
          position: relative;
        }

        .persona-avatar.active {
          opacity: 1;
          border-color: var(--persona-color);
          background: rgba(255,255,255,0.08);
          transform: scale(1.14);
        }

        .persona-avatar.talking {
          animation: talking-pulse 0.8s infinite;
          box-shadow: 0 0 20px var(--persona-color);
        }

        .talking-indicator {
          position: absolute;
          top: -0.35rem;
          right: -0.35rem;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 999px;
          padding: 0.15rem 0.35rem;
          font-size: 0.7rem;
        }

        @keyframes talking-pulse {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.2); }
        }

        .avatar-emoji {
          font-size: 1.8rem;
        }

        .avatar-name {
          font-size: 0.65rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        .persona-avatar.active .avatar-name {
          color: white;
        }

        /* Zone principale */
        .voice-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          max-width: 500px;
          margin: 0 auto;
          width: 100%;
        }

        .center-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1.5rem;
        }

        .center-content h2 {
          font-size: 1.5rem;
          margin: 0;
        }

        .center-content p {
          color: #94a3b8;
          margin: 0;
        }

        /* Bouton démarrer */
        .start-btn {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          transition: all 0.3s;
        }

        .start-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        /* Badge de statut */
        .status-badge {
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          font-size: 1rem;
          font-weight: 500;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .status-badge.speaking {
          background: rgba(245, 158, 11, 0.15);
          border-color: #f59e0b;
          color: #fcd34d;
          animation: badge-pulse 1s infinite;
        }

        .status-badge.listening {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10b981;
          color: #6ee7b7;
        }

        .speaker-banner {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 2px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .speaker-emoji {
          font-size: 1.2rem;
        }

        .speaker-name {
          font-size: 1rem;
          color: white;
        }

        .speaker-kind,
        .speaker-progress {
          font-size: 0.85rem;
          color: #cbd5e1;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
        }

        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 15px 3px rgba(245, 158, 11, 0.2); }
        }

        /* Transcript en direct */
        .transcript-live {
          font-size: 1.2rem;
          color: #93c5fd;
          font-style: italic;
          max-width: 100%;
          padding: 0 1rem;
        }

        /* Boîte de transcript */
        .transcript-box {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
        }

        .transcript-box p {
          margin: 0;
          line-height: 1.6;
          color: #e2e8f0;
        }

        /* Rappel de la question */
        .question-reminder {
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          font-size: 0.85rem;
          color: #94a3b8;
          width: 100%;
        }

        /* Bouton reset */
        .reset-btn {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.3s;
        }

        .reset-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .download-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 10px;
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          cursor: pointer;
          transition: all 0.3s;
        }

        .download-btn:hover {
          background: rgba(74, 222, 128, 0.2);
          border-color: rgba(74, 222, 128, 0.5);
          color: #86efac;
        }

        /* Erreur */
        .error-box {
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
