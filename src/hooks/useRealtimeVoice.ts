/**
 * 🎙️ HOOK REALTIME VOICE - Council of Five
 * Hook React pour les interactions vocales en temps réel
 */

import { useState, useCallback, useEffect } from 'react';
import { PersonaType } from '../types';
import { realtimeVoice } from '../services/realtimeVoice';

interface UseRealtimeVoiceReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentPersona: PersonaType | null;
  transcript: string;
  error: string | null;
  connect: (persona: PersonaType) => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
}

export function useRealtimeVoice(apiKey: string): UseRealtimeVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<PersonaType | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      realtimeVoice.setApiKey(apiKey);
    }
    
    realtimeVoice.setCallbacks({
      onTranscript: (text) => {
        setTranscript(prev => prev + text);
      },
      onSpeaking: (speaking) => {
        setIsSpeaking(speaking);
        if (!speaking) {
          // Reset transcript quand le persona a fini de parler
          setTimeout(() => setTranscript(''), 1000);
        }
      }
    });
    
    return () => {
      realtimeVoice.disconnect();
    };
  }, [apiKey]);

  const connect = useCallback(async (persona: PersonaType): Promise<boolean> => {
    setError(null);
    setTranscript('');
    
    try {
      const success = await realtimeVoice.connect(persona);
      
      if (success) {
        setIsConnected(true);
        setIsListening(true);
        setCurrentPersona(persona);
        return true;
      } else {
        setError('Échec de la connexion');
        return false;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    realtimeVoice.disconnect();
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentPersona(null);
    setTranscript('');
  }, []);

  const sendMessage = useCallback((text: string) => {
    // Appeler directement le service, il gère sa propre vérification
    realtimeVoice.sendTextMessage(text);
  }, []);

  return {
    isConnected,
    isListening,
    isSpeaking,
    currentPersona,
    transcript,
    error,
    connect,
    disconnect,
    sendMessage
  };
}
