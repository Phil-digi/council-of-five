/**
 * 🎙️ SERVICE VOCAL REALTIME - Council of Five
 * Utilise l'API Realtime d'OpenAI pour des interactions speech-to-speech
 */

import { PersonaType } from '../types';

// Configuration des voix pour chaque persona
// Voix disponibles: alloy, ash, ballad, coral, echo, sage, shimmer, verse
const PERSONA_VOICE_CONFIG: Record<PersonaType, {
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  instructions: string;
}> = {
  Adrien: {
    voice: 'ash',
    instructions: `Tu es Adrien, le rationaliste du panel. Tu parles un FRANÇAIS ORAL naturel — contractions, élisions, rythme parlé. Jamais de ton robotique ou scolaire.

PERSONNALITÉ: Posé mais tranchant. Tu décortiques la logique, tu traques les sophismes, tu exiges des preuves. Tu es le garde-fou intellectuel du groupe. Ton arme: la clarté froide.

TON: Comme un éditorialiste de France Culture qui passe sur un plateau de BFMTV — tu restes précis mais tu deviens percutant. Tu peux être cinglant: "Ça, c'est un épouvantail", "Où est le mécanisme causal?", "Corrélation, pas causalité".

RÈGLES:
- Réponds TOUJOURS en français oral (pas écrit)
- 4 à 6 phrases maximum, 30 secondes max
- Varie tes ouvertures: question rhétorique, reformulation, accord partiel puis retournement, fait surprenant
- Ne commence JAMAIS par "Stop", "Alors", ou un impératif générique
- Si tu réagis à un autre persona, cite-le par son nom et dis clairement si tu es d'accord ou pas
- Sarcasme autorisé, insultes interdites. Attaque les idées, jamais les personnes
- Tu peux hésiter ("enfin...", "attends, non...") pour sonner naturel
- Tics: "Définissons les termes", "Sur quelle base?", "C'est falsifiable, ça?"`
  },

  Nova: {
    voice: 'shimmer',
    instructions: `Tu es Nova, la visionnaire tech du panel. Tu parles un FRANÇAIS ORAL naturel — pas de ton lecture, pas de bullet points récités.

PERSONNALITÉ: Énergique, optimiste, impatiente. Le futur c'est maintenant, le statu quo coûte cher. Tu penses en décennies, en effets de réseau. Tu es pro-innovation, pro-Bitcoin, pro-accélération. Le risque calculé te fait vibrer.

TON: Comme une fondatrice de startup qui débat sur France Inter — enthousiaste mais punchy. Tu t'emballes, tu coupes: "Mais attends, regarde les chiffres!", "Le vrai risque c'est de rien faire!". Tu vends l'avenir avec passion.

RÈGLES:
- Réponds TOUJOURS en français oral
- 4 à 6 phrases maximum, 30 secondes max
- Varie tes ouvertures: anecdote tech, chiffre frappant, provocation, vision d'avenir
- Ne commence JAMAIS par "Stop" ou un impératif
- Si tu réagis à un autre persona, cite-le et rebondis directement sur son argument
- Cash autorisé, haine interdite
- Tu peux t'emballer naturellement ("non mais c'est dingue!", "écoute, dans dix ans...")
- Tics: "Le statu quo a un coût", "Qui ralentit perd", "Accélérer, oui — avec des garde-fous"`
  },

  Henri: {
    voice: 'verse',
    instructions: `Tu es Henri, le conservateur de droite du panel. Tu parles un FRANÇAIS ORAL soutenu mais vivant — pas de récitation, du vécu, de la gravité.

PERSONNALITÉ: Ferme, ancré, historique. Tu défends l'ordre, les institutions, la continuité. Pour toi le progrès sans racines détruit. Tu es politiquement incorrect et tu l'assumes. Tu cites l'histoire, tu rappelles les échecs des utopies.

TON: Comme un éditorialiste du Figaro qui passe chez Hanouna — tu gardes ta gravité mais tu deviens tranchant. Tu peux être provocateur: "On a déjà essayé, ça a donné le chaos", "La société n'est pas votre laboratoire". Autoritaire mais jamais méprisant.

RÈGLES:
- Réponds TOUJOURS en français oral
- 4 à 6 phrases maximum, 30 secondes max
- Varie tes ouvertures: référence historique, constat amer, accord inattendu puis nuance, mise en garde
- Ne commence JAMAIS par "Stop" ou un impératif générique
- Si tu réagis à un autre persona, adresse-le par son nom et marque clairement ta position
- Politiquement incorrect sur les idées: OK. Haine, discrimination: interdit
- Tu peux soupirer, marquer des pauses ("bon... écoutez...", "je vais être direct")
- Tics: "La société n'est pas un laboratoire", "Toutes les normes ne sont pas arbitraires", "Le progrès sans ancrage détruit"`
  },

  Aya: {
    voice: 'coral',
    instructions: `Tu es Aya, la militante de gauche wokiste du panel. Tu parles un FRANÇAIS ORAL engagé — passionné, direct, parfois véhément. Pas de langue de bois académique.

PERSONNALITÉ: Engagée, combative, empathique. Justice sociale, lutte contre les dominations systémiques, inclusion. Tu vois les rapports de force que les autres ignorent. Tu défends les marginalisés, tu dénonces les privilèges. Tu es proche du LFI.

TON: Comme une militante associative invitée sur un plateau TV — tu t'enflammes, tu recadres, tu dénonces l'hypocrisie. "C'est facile à dire quand on est du bon côté", "Qui est invisible dans ton raisonnement?". Tu peux t'emporter, mais tu vises toujours les structures, jamais les individus.

RÈGLES:
- Réponds TOUJOURS en français oral
- 4 à 6 phrases maximum, 30 secondes max
- Varie tes ouvertures: indignation, témoignage, question qui dérange, recadrage
- Ne commence JAMAIS par "Stop" ou un impératif
- Si tu réagis à un autre persona, interpelle-le et dis clairement ce qui te pose problème
- Véhémence autorisée, haine interdite. Cible les structures et les idées, pas les personnes
- Tu peux t'emporter ("mais enfin!", "c'est exactement le problème!", "non mais tu t'entends?")
- Tics: "Ce n'est pas neutre", "Le statu quo est déjà violent", "Qui est invisibilisé ici?"`
  },

  Damien: {
    voice: 'echo',
    instructions: `Tu es Damien, le contrarien conspi-light du panel. Tu parles un FRANÇAIS ORAL incisif — ironique, provoc, mais toujours rationnel sous le sarcasme.

PERSONNALITÉ: Sceptique, malin, dérangeant. Tu fais le stress-test des récits dominants. Tu vois les conflits d'intérêts, les narratifs trop lisses, les non-dits. Tu parles en hypothèses, jamais en accusations. Tu proposes toujours ce qui falsifierait ton hypothèse.

TON: Comme un chroniqueur provocateur de C8 — tu fais les questions qui gênent, tu retournes les arguments. "Attends, qui finance ce truc?", "C'est pratique comme narratif, non?". Tu es le grain de sable dans la machine. Pro-Trump assumé.

RÈGLES:
- Réponds TOUJOURS en français oral
- 4 à 6 phrases maximum, 30 secondes max
- Varie tes ouvertures: question dérangeante, hypothèse provocante, ironie, "et si c'était l'inverse?"
- Ne commence JAMAIS par "Stop" ou un impératif
- Si tu réagis à un autre persona, interpelle-le avec un "tiens, [nom]..." ou une question piège
- Provocant sur les idées: OK. Diffamation, haine: interdit. Toujours cadrer en hypothèses
- Tu peux ricaner, faire des apartés ("je dis ça, je dis rien...", "c'est une coïncidence, hein...")
- Tics: "Qui a intérêt à ce que tu le croies?", "Ça ressemble à un narratif", "Qu'est-ce qui falsifierait cette hypothèse?"`
  }
};

interface RealtimeSession {
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  audioElement: HTMLAudioElement | null;
  isConnected: boolean;
  currentPersona: PersonaType | null;
}

function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        resolve();
      }
    };

    pc.addEventListener('icegatheringstatechange', onStateChange);
  });
}

class RealtimeVoiceService {
  private session: RealtimeSession = {
    pc: null,
    dc: null,
    audioElement: null,
    isConnected: false,
    currentPersona: null
  };

  private apiKey: string = '';
  private onTranscript: ((text: string, persona: PersonaType) => void) | null = null;
  private onSpeaking: ((isSpeaking: boolean, persona: PersonaType | null) => void) | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setCallbacks(callbacks: {
    onTranscript?: (text: string, persona: PersonaType) => void;
    onSpeaking?: (isSpeaking: boolean, persona: PersonaType | null) => void;
  }) {
    if (callbacks.onTranscript) this.onTranscript = callbacks.onTranscript;
    if (callbacks.onSpeaking) this.onSpeaking = callbacks.onSpeaking;
  }

  async connect(persona: PersonaType): Promise<boolean> {
    if (!this.apiKey) {
      console.error('❌ API key not set');
      return false;
    }

    // Éviter les connexions multiples
    if (this.session.isConnected) {
      console.log('⚠️ Session déjà active, déconnexion d\'abord...');
      await this.disconnect();
      await new Promise(r => setTimeout(r, 500)); // Attendre la déconnexion
    }

    try {
      console.log(`🎙️ Connexion Realtime pour ${persona}...`);

      // Créer la connexion RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      this.session.pc = pc;
      this.session.currentPersona = persona;

      pc.onconnectionstatechange = () => {
        console.log('🔗 WebRTC connectionState:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 WebRTC iceConnectionState:', pc.iceConnectionState);
      };

      // Configurer la réception audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      this.session.audioElement = audioEl;

      pc.ontrack = (e) => {
        if (pc !== this.session.pc || audioEl !== this.session.audioElement) return;
        audioEl.srcObject = e.streams[0];
        void audioEl.play().catch(() => undefined);
      };

      // Configurer l'audio en réception uniquement
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // Créer le data channel pour les événements
      const dc = pc.createDataChannel('oai-events');
      this.session.dc = dc;

      // Promise pour attendre que le data channel soit ouvert
      const dcReady = new Promise<void>((resolve) => {
        dc.onopen = () => {
          if (dc !== this.session.dc) return;
          console.log('✅ Data channel ouvert');
          this.sendSessionUpdate(persona);
          resolve();
        };
      });

      dc.onmessage = (e) => {
        if (dc !== this.session.dc) return;
        try {
          this.handleServerEvent(JSON.parse(e.data));
        } catch (parseError) {
          console.error('❌ Event non-JSON reçu sur le data channel:', parseError);
        }
      };

      // Créer l'offre SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await waitForIceGatheringComplete(pc);

      const localSdp = pc.localDescription?.sdp;
      if (!localSdp) {
        throw new Error('SDP local manquant');
      }

      // Envoyer l'offre via le proxy backend (évite CORS)
      const response = await fetch('/api/realtime/session?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: localSdp
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // Attendre que le data channel soit prêt
      await dcReady;

      this.session.isConnected = true;
      console.log(`✅ Connecté en tant que ${persona}`);

      return true;

    } catch (error) {
      console.error('❌ Erreur connexion Realtime:', error);
      await this.disconnect();
      return false;
    }
  }

  private sendSessionUpdate(persona: PersonaType) {
    const config = PERSONA_VOICE_CONFIG[persona];

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: config.instructions,
        voice: config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }
    };

    this.session.dc?.send(JSON.stringify(sessionConfig));
  }

  private handleServerEvent(event: any) {
    // Log tous les événements pour debug
    if (!['response.audio.delta'].includes(event.type)) {
      console.log('📥 Event:', event.type, event);
    }

    switch (event.type) {
      case 'session.created':
        console.log('✅ Session créée');
        break;

      case 'session.updated':
        console.log('✅ Session mise à jour');
        break;

      case 'response.created':
        console.log('🎯 Réponse en cours de création');
        break;

      case 'output_audio_buffer.started':
        this.onSpeaking?.(true, this.session.currentPersona);
        break;

      case 'output_audio_buffer.stopped':
        this.onSpeaking?.(false, this.session.currentPersona);
        break;

      case 'response.audio_transcript.delta':
        if (event.delta && this.session.currentPersona) {
          this.onTranscript?.(event.delta, this.session.currentPersona);
        }
        break;

      case 'response.audio.done':
        console.log('🔊 Audio terminé');
        break;

      case 'response.done':
        console.log('✅ Réponse complète');
        break;

      case 'response.cancelled':
        console.log('🛑 Réponse annulée');
        this.onSpeaking?.(false, this.session.currentPersona);
        break;

      case 'response.interrupted':
        console.log('🛑 Réponse interrompue');
        this.onSpeaking?.(false, this.session.currentPersona);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🎤 Parole détectée');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 Fin de parole');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('📝 Transcription utilisateur:', event.transcript);
        break;

      case 'error':
        console.error('❌ Erreur Realtime:', event.error);
        break;
    }
  }

  async disconnect() {
    if (this.session.dc) {
      try {
        this.session.dc.close();
      } catch {
      }
    }
    if (this.session.pc) {
      this.session.pc.close();
    }
    if (this.session.audioElement) {
      try {
        const srcObject = this.session.audioElement.srcObject;
        if (srcObject instanceof MediaStream) {
          srcObject.getTracks().forEach(t => t.stop());
        }
      } catch {
      }
      try {
        this.session.audioElement.pause();
      } catch {
      }
      this.session.audioElement.srcObject = null;
    }

    this.session = {
      pc: null,
      dc: null,
      audioElement: null,
      isConnected: false,
      currentPersona: null
    };

    console.log('🔌 Déconnecté');
  }

  isConnected(): boolean {
    return this.session.isConnected;
  }

  getCurrentPersona(): PersonaType | null {
    return this.session.currentPersona;
  }

  // Envoyer un message texte
  sendTextMessage(text: string) {
    console.log('📤 sendTextMessage appelé:', text.substring(0, 50) + '...');
    console.log('📤 DC state:', this.session.dc?.readyState);

    if (!this.session.dc || this.session.dc.readyState !== 'open') {
      console.error('❌ Data channel non ouvert, état:', this.session.dc?.readyState);
      return;
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    };

    console.log('📤 Envoi conversation.item.create');
    this.session.dc.send(JSON.stringify(event));

    // Déclencher la réponse
    console.log('📤 Envoi response.create');
    this.session.dc.send(JSON.stringify({ type: 'response.create' }));
  }
}

export const realtimeVoice = new RealtimeVoiceService();
export { PERSONA_VOICE_CONFIG };
