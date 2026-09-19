"use client";

import { useState, useEffect, useRef } from "react";

export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synth.current = window.speechSynthesis;
    } else {
      setIsSupported(false);
    }
  }, []);

  const stop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string, lang = "en-IN") => {
    if (!synth.current) return;
    
    // Stop any ongoing speech first
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set preferred language
    utterance.lang = lang;
    
    // Sometimes voices aren't immediately available on load, try to match
    const voices = synth.current.getVoices();
    const preferredVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
    };

    synth.current.speak(utterance);
  };

  return { speak, stop, isSpeaking, isSupported };
}
