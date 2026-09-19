"use client";

import { useState, useEffect, useRef } from "react";

export function useSpeechToText(language = "en-IN") {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setError("Microphone access denied. Please allow microphone permissions or use manual text entry. (Note: Voice recording requires HTTPS or localhost).");
          } else {
            setError(`Speech recognition error: ${event.error}. Please use manual entry.`);
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setError("Your browser does not support voice recording. Please use manual text entry.");
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [language]);

  const startListening = () => {
    setError(null);
    if (!recognitionRef.current) {
      setError("Your browser does not support voice recording. Please use manual text entry.");
      return;
    }
    
    // We append to existing transcript rather than wiping it
    // setTranscript(""); 

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Error starting recognition", err);
      // Already started error can happen if button double clicked
      if (err.name !== 'InvalidStateError') {
         setError("Failed to start recording: " + err.message);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    setTranscript, // Manual fallback
    startListening,
    stopListening,
    error,
    isSupported: !!recognitionRef.current,
  };
}
