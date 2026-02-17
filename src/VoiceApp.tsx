/**
 * 🎙️ INTERFACE VOCALE - Council of Five
 * Interface entièrement vocale avec les 5 personas visibles
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PersonaType, PERSONAS } from './types';
import { useRealtimeVoice } from './hooks/useRealtimeVoice';
import { PERSONA_ICONS } from './components/PersonaIcons';

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
      message: `${previousContext}${userName} te demande: "${question}". Réponds comme dans un vrai débat TV français — cash, vivant, naturel. Donne ta position en 4-6 phrases max. À la fin, adresse-toi directement à ${calloutName} — il va te répondre juste après. Pose-lui une question qui le met en difficulté ou provoque-le sur ses idées. Français oral, pas écrit.`
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
        // Exclure Nova (closing persona) pour éviter qu'elle parle deux fois
        const closingPersona = getClosingPersona(currentTurn.persona);
        const interventionPlan = getInterventionPlan(currentTurn.persona, [calloutTarget, closingPersona]);
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
            ? `Tu es plutôt d'accord avec ${mainName} sur ce coup-là. Dis-le clairement, puis renforce son argument avec ton propre angle. Tu peux réagir à ce qu'a dit ${teaseName} aussi.`
            : item.stance === 'challenge'
              ? `Tu n'es pas d'accord avec ${mainName}. Dis-le franchement, pointe ce qui cloche dans son raisonnement et propose une alternative. Réagis aussi à ce que ${teaseName} a dit.`
              : `Tu apportes un angle complètement différent que personne n'a vu. Surprends tout le monde — un twist, une hypothèse, un fait inattendu. Réagis à ce qu'a dit ${teaseName} au passage.`;

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

  const personaRole = (p: PersonaType) => {
    const roles: Record<PersonaType, string> = {
      Adrien: 'Le Rationaliste',
      Nova: 'La Visionnaire',
      Henri: 'Le Conservateur',
      Aya: 'Justice Sociale',
      Damien: 'Le Contrarien'
    };
    return roles[p] || '';
  };

  return (
    <div className="studio">
      {/* ── Show Header / Ticker Bar ── */}
      <header className="show-header">
        <div className="show-logo">
          <span className="logo-accent">LE DÉBAT</span>
          <span className="logo-main">DES CINQ</span>
        </div>
        {userName && <span className="show-user">Invité : {userName}</span>}
        {userQuestion && (
          <div className="topic-ticker">
            <span className="ticker-label">SUJET</span>
            <span className="ticker-text">{userQuestion}</span>
          </div>
        )}
      </header>

      {/* ── Persona Desk — 5 panelists ── */}
      <div className="desk-row">
        {ALL_PERSONAS.map(p => {
          const config = PERSONAS[p];
          const isActive = selectedPersona === p;
          const isTalking = isActive && isSpeaking;
          const Icon = PERSONA_ICONS[p];
          return (
            <div
              key={p}
              className={`desk-card ${isActive ? 'active' : ''} ${isTalking ? 'on-air' : ''}`}
              style={{ '--pc': config.color } as React.CSSProperties}
            >
              <div className="desk-icon">{Icon && <Icon size={40} color={isActive ? config.color : '#64748b'} />}</div>
              <span className="desk-name">{config.name}</span>
              <span className="desk-role">{personaRole(p)}</span>
              {isTalking && <div className="on-air-badge">EN DIRECT</div>}
            </div>
          );
        })}
      </div>

      {/* ── Stage / Main Content ── */}
      <main className="stage">

        {/* Welcome */}
        {appState === 'welcome' && (
          <div className="stage-center cinema">
            <div className="cinema-logo">
              <div className="cinema-ring"></div>
              <span className="cinema-title">LE DÉBAT DES CINQ</span>
              <span className="cinema-sub">5 voix · 1 question · 0 filtre</span>
            </div>
            <button className="go-live-btn" onClick={handleStart}>
              <span className="go-live-dot"></span>
              ENTRER EN DIRECT
            </button>
          </div>
        )}

        {/* Intro speaking */}
        {appState === 'intro_speaking' && (
          <div className="stage-center">
            <div className="lower-third intro-lt">
              <div className="lt-accent-bar"></div>
              <div className="lt-content">
                <span className="lt-label">OUVERTURE</span>
                <span className="lt-title">Le Débat des Cinq vous accueille</span>
              </div>
            </div>
            {transcript && <p className="live-caption">{transcript}</p>}
          </div>
        )}

        {/* Listening name */}
        {appState === 'listening_name' && (
          <div className="stage-center">
            <div className="prompt-card">
              <div className="prompt-mic">
                <div className="mic-ring"></div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              </div>
              <span className="prompt-text">Dites votre prénom</span>
            </div>
            {interimTranscript && <p className="live-caption">« {interimTranscript} »</p>}
          </div>
        )}

        {/* Greeting */}
        {appState === 'greeting_speaking' && (
          <div className="stage-center">
            <div className="lower-third intro-lt">
              <div className="lt-accent-bar"></div>
              <div className="lt-content">
                <span className="lt-label">BIENVENUE</span>
                <span className="lt-title">Bienvenue {userName} sur le plateau</span>
              </div>
            </div>
            {transcript && <p className="live-caption">{transcript}</p>}
          </div>
        )}

        {/* Listening question */}
        {appState === 'listening_question' && (
          <div className="stage-center">
            <div className="prompt-card">
              <div className="prompt-mic">
                <div className="mic-ring"></div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              </div>
              <span className="prompt-text">Posez votre question au panel</span>
            </div>
            {interimTranscript && <p className="live-caption">« {interimTranscript} »</p>}
            {completedDebate && (
              <button className="download-btn" onClick={downloadTranscript}>
                📄 Télécharger la transcription
              </button>
            )}
          </div>
        )}

        {/* Connecting */}
        {appState === 'connecting' && currentSpeaker && (
          <div className="stage-center">
            <div className="lower-third" style={{ '--lt-color': currentSpeaker.color } as React.CSSProperties}>
              <div className="lt-accent-bar"></div>
              <div className="lt-content">
                <div className="lt-icon">{(() => { const Icon = PERSONA_ICONS[currentSpeaker.name]; return Icon ? <Icon size={36} color={currentSpeaker.color} /> : null; })()}</div>
                <div className="lt-info">
                  <span className="lt-name">{currentSpeaker.name}</span>
                  <span className="lt-role">{personaRole(currentSpeaker.name)}</span>
                </div>
                {currentTurnLabel && <span className="lt-badge">{currentTurnLabel}</span>}
              </div>
            </div>
            <div className="connecting-pulse">
              <div className="cp-dot"></div>
              <div className="cp-dot"></div>
              <div className="cp-dot"></div>
            </div>
            {/* Turn progress */}
            {pendingTurns.length > 1 && (
              <div className="turn-progress">
                {pendingTurns.map((t, i) => {
                  const tc = PERSONAS[t.persona]?.color || '#fff';
                  return <div key={i} className={`tp-dot ${i < turnIndex ? 'done' : i === turnIndex ? 'current' : ''}`} style={{ background: i <= turnIndex ? tc : 'rgba(255,255,255,0.15)' }} title={t.persona}></div>;
                })}
              </div>
            )}
          </div>
        )}

        {/* Responding */}
        {appState === 'responding' && currentSpeaker && (
          <div className="stage-center">
            <div className={`lower-third ${isSpeaking ? 'speaking' : ''}`} style={{ '--lt-color': currentSpeaker.color } as React.CSSProperties}>
              <div className="lt-accent-bar"></div>
              <div className="lt-content">
                <div className="lt-icon">{(() => { const Icon = PERSONA_ICONS[currentSpeaker.name]; return Icon ? <Icon size={36} color={currentSpeaker.color} /> : null; })()}</div>
                <div className="lt-info">
                  <span className="lt-name">{currentSpeaker.name}</span>
                  <span className="lt-role">{personaRole(currentSpeaker.name)}</span>
                </div>
                {currentTurnLabel && <span className="lt-badge">{currentTurnLabel}</span>}
                {isSpeaking && (
                  <div className="waveform">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                )}
              </div>
            </div>

            {transcript && (
              <div className="caption-box">
                <p>{transcript}</p>
              </div>
            )}

            {/* Turn progress */}
            {pendingTurns.length > 1 && (
              <div className="turn-progress">
                {pendingTurns.map((t, i) => {
                  const tc = PERSONAS[t.persona]?.color || '#fff';
                  return <div key={i} className={`tp-dot ${i < turnIndex ? 'done' : i === turnIndex ? 'current' : ''}`} style={{ background: i <= turnIndex ? tc : 'rgba(255,255,255,0.15)' }} title={t.persona}></div>;
                })}
              </div>
            )}

            <div className="stage-actions">
              <button className="action-btn" onClick={handleNewQuestion}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                Nouvelle question
              </button>
              <button className="action-btn secondary" onClick={handleReset}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                Quitter le plateau
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {(error || voiceError) && (
          <div className="error-bar">⚠ {error || voiceError}</div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ═══════════════════════════════════════
           STUDIO — Base
           ═══════════════════════════════════════ */
        .studio {
          min-height: 100vh;
          background: #0a0a0f;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.06) 0%, transparent 50%);
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
        }

        /* ═══════════════════════════════════════
           SHOW HEADER — Ticker bar
           ═══════════════════════════════════════ */
        .show-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.6rem 1.5rem;
          background: linear-gradient(90deg, #111118 0%, #16161f 50%, #111118 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: relative;
          z-index: 10;
        }

        .show-logo {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          flex-shrink: 0;
        }

        .logo-accent {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #3b82f6;
          text-transform: uppercase;
        }

        .logo-main {
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-transform: uppercase;
        }

        .show-user {
          font-size: 0.75rem;
          color: #64748b;
          flex-shrink: 0;
        }

        .topic-ticker {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          overflow: hidden;
        }

        .ticker-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #0a0a0f;
          background: #f59e0b;
          padding: 0.15rem 0.5rem;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .ticker-text {
          font-size: 0.8rem;
          color: #94a3b8;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-style: italic;
        }

        /* ═══════════════════════════════════════
           DESK ROW — Panelists
           ═══════════════════════════════════════ */
        .desk-row {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1rem 0.75rem;
          background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
        }

        .desk-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.6rem 0.9rem 0.5rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.04);
          opacity: 0.35;
          transition: all 0.4s cubic-bezier(.4,0,.2,1);
          position: relative;
          min-width: 72px;
        }

        .desk-card.active {
          opacity: 1;
          border-color: var(--pc);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          box-shadow: 0 4px 24px -4px color-mix(in srgb, var(--pc) 30%, transparent);
          transform: translateY(-2px);
        }

        .desk-card.on-air {
          animation: glow-pulse 1.5s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 4px 24px -4px color-mix(in srgb, var(--pc) 30%, transparent); }
          50% { box-shadow: 0 4px 40px -4px color-mix(in srgb, var(--pc) 50%, transparent); }
        }

        .desk-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .desk-name {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .desk-card.active .desk-name {
          color: white;
        }

        .desk-role {
          font-size: 0.55rem;
          color: #475569;
          text-align: center;
          line-height: 1.2;
        }

        .desk-card.active .desk-role {
          color: #94a3b8;
        }

        .on-air-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 0.5rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: white;
          background: #ef4444;
          padding: 2px 6px;
          border-radius: 3px;
          animation: on-air-blink 1s ease-in-out infinite;
        }

        @keyframes on-air-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ═══════════════════════════════════════
           STAGE — Main content
           ═══════════════════════════════════════ */
        .stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .stage-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          padding: 2rem 1.5rem;
          max-width: 720px;
          margin: 0 auto;
          width: 100%;
        }

        /* ═══════════════════════════════════════
           CINEMA — Welcome screen
           ═══════════════════════════════════════ */
        .cinema {
          gap: 2.5rem;
        }

        .cinema-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          position: relative;
        }

        .cinema-ring {
          position: absolute;
          top: -50px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 1px solid rgba(59,130,246,0.15);
          animation: ring-rotate 12s linear infinite;
        }

        .cinema-ring::after {
          content: '';
          position: absolute;
          top: -2px;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          transform: translateX(-50%);
        }

        @keyframes ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cinema-title {
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
        }

        .cinema-sub {
          font-size: 0.9rem;
          color: #64748b;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .go-live-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 2rem;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(239,68,68,0.4);
          border-radius: 6px;
          background: rgba(239,68,68,0.08);
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }

        .go-live-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.6);
          color: #fecaca;
          box-shadow: 0 0 30px rgba(239,68,68,0.15);
        }

        .go-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: on-air-blink 1s ease-in-out infinite;
        }

        /* ═══════════════════════════════════════
           PROMPT CARD — Microphone prompts
           ═══════════════════════════════════════ */
        .prompt-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .prompt-mic {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(59,130,246,0.1);
          border: 2px solid rgba(59,130,246,0.3);
          position: relative;
        }

        .mic-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(59,130,246,0.15);
          animation: mic-expand 2s ease-out infinite;
        }

        @keyframes mic-expand {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .prompt-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: #94a3b8;
        }

        /* ═══════════════════════════════════════
           LOWER THIRD — Speaker banner
           ═══════════════════════════════════════ */
        .lower-third {
          width: 100%;
          display: flex;
          align-items: stretch;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          animation: lt-slide-in 0.5s cubic-bezier(.4,0,.2,1);
          transition: box-shadow 0.3s;
        }

        .lower-third.speaking {
          box-shadow: 0 0 30px -8px color-mix(in srgb, var(--lt-color, #3b82f6) 25%, transparent);
        }

        @keyframes lt-slide-in {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .lt-accent-bar {
          width: 4px;
          flex-shrink: 0;
          background: var(--lt-color, #3b82f6);
        }

        .intro-lt .lt-accent-bar {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
        }

        .lt-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
        }

        .lt-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lt-info {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .lt-name {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.04em;
        }

        .lt-role {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .lt-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .lt-title {
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }

        .lt-badge {
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #cbd5e1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          margin-left: auto;
        }

        /* ── Waveform animation ── */
        .waveform {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-left: 0.5rem;
        }

        .waveform span {
          width: 3px;
          border-radius: 2px;
          background: var(--lt-color, #3b82f6);
          animation: wave 0.6s ease-in-out infinite;
        }

        .waveform span:nth-child(1) { height: 8px; animation-delay: 0s; }
        .waveform span:nth-child(2) { height: 14px; animation-delay: 0.1s; }
        .waveform span:nth-child(3) { height: 20px; animation-delay: 0.2s; }
        .waveform span:nth-child(4) { height: 14px; animation-delay: 0.3s; }
        .waveform span:nth-child(5) { height: 8px; animation-delay: 0.4s; }

        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }

        /* ═══════════════════════════════════════
           CONNECTING — Dots animation
           ═══════════════════════════════════════ */
        .connecting-pulse {
          display: flex;
          gap: 8px;
        }

        .cp-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
          animation: cp-bounce 1.2s ease-in-out infinite;
        }

        .cp-dot:nth-child(2) { animation-delay: 0.15s; }
        .cp-dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes cp-bounce {
          0%, 100% { transform: scale(0.5); opacity: 0.3; }
          50% { transform: scale(1); opacity: 1; }
        }

        /* ═══════════════════════════════════════
           TURN PROGRESS — Dots tracker
           ═══════════════════════════════════════ */
        .turn-progress {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tp-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: all 0.3s;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .tp-dot.current {
          transform: scale(1.3);
          border-color: transparent;
          box-shadow: 0 0 8px 2px rgba(255,255,255,0.2);
        }

        .tp-dot.done {
          opacity: 0.5;
        }

        /* ═══════════════════════════════════════
           CAPTION — Live transcript
           ═══════════════════════════════════════ */
        .live-caption {
          font-size: 1.15rem;
          color: #93c5fd;
          font-style: italic;
          max-width: 100%;
          text-align: center;
          line-height: 1.6;
        }

        .caption-box {
          width: 100%;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.04);
          max-height: 180px;
          overflow-y: auto;
        }

        .caption-box p {
          margin: 0;
          line-height: 1.7;
          color: #cbd5e1;
          font-size: 0.95rem;
        }

        /* ═══════════════════════════════════════
           ACTIONS
           ═══════════════════════════════════════ */
        .stage-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.1rem;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.25s;
          font-family: 'Inter', sans-serif;
        }

        .action-btn:hover {
          background: rgba(255,255,255,0.08);
          color: white;
          border-color: rgba(255,255,255,0.2);
        }

        .action-btn.secondary {
          border-color: rgba(255,255,255,0.06);
          color: #64748b;
        }

        .action-btn.secondary:hover {
          color: #94a3b8;
          border-color: rgba(255,255,255,0.12);
        }

        .download-btn {
          padding: 0.6rem 1.2rem;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(74, 222, 128, 0.25);
          border-radius: 6px;
          background: rgba(74, 222, 128, 0.06);
          color: #4ade80;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }

        .download-btn:hover {
          background: rgba(74, 222, 128, 0.12);
          border-color: rgba(74, 222, 128, 0.4);
        }

        /* ═══════════════════════════════════════
           ERROR
           ═══════════════════════════════════════ */
        .error-bar {
          position: fixed;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.6rem 1.5rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #fca5a5;
          font-size: 0.85rem;
          z-index: 100;
          backdrop-filter: blur(8px);
        }

        /* ═══════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════ */
        @media (max-width: 640px) {
          .show-header { flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem 1rem; }
          .topic-ticker { flex-basis: 100%; order: 3; }
          .desk-row { gap: 0.4rem; padding: 0.75rem 0.5rem; }
          .desk-card { min-width: 56px; padding: 0.5rem 0.5rem 0.4rem; }
          .desk-icon svg { width: 28px; height: 28px; }
          .desk-name { font-size: 0.6rem; }
          .desk-role { display: none; }
          .cinema-title { font-size: 1.5rem; }
          .cinema-sub { font-size: 0.7rem; letter-spacing: 0.15em; }
          .stage-center { padding: 1.25rem 1rem; }
          .stage-actions { flex-direction: column; width: 100%; }
          .action-btn { justify-content: center; }
        }
      `}</style>
    </div>
  );
}

