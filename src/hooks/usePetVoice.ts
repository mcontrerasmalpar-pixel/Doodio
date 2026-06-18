import { useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PetVoicePreset =
  | "cat" | "dog" | "bird" | "frog" | "robot" | "ghost" | "baby" | "giant";

export interface PetVoiceConfig {
  preset: PetVoicePreset;
  pitch: number;       // 0.1 – 4.0  (Web Speech pitch)
  rate: number;        // 0.1 – 2.0  (Web Speech rate)
  pitchShift: number;  // semitones applied via AudioContext (-12 to +12)
  robotize: boolean;   // vocoder-like ring modulation
  echo: boolean;       // delay feedback
}

export const PRESETS: Record<PetVoicePreset, Omit<PetVoiceConfig, "preset">> = {
  cat:   { pitch: 2.0, rate: 1.1, pitchShift:  7, robotize: false, echo: false },
  dog:   { pitch: 0.6, rate: 0.9, pitchShift: -3, robotize: false, echo: false },
  bird:  { pitch: 3.8, rate: 1.4, pitchShift: 12, robotize: false, echo: true  },
  frog:  { pitch: 0.4, rate: 0.7, pitchShift: -6, robotize: false, echo: false },
  robot: { pitch: 0.8, rate: 0.8, pitchShift:  0, robotize: true,  echo: false },
  ghost: { pitch: 1.6, rate: 0.6, pitchShift: -2, robotize: false, echo: true  },
  baby:  { pitch: 3.5, rate: 1.3, pitchShift:  9, robotize: false, echo: false },
  giant: { pitch: 0.2, rate: 0.5, pitchShift:-10, robotize: false, echo: false },
};

export const PRESET_META: Record<PetVoicePreset, { emoji: string; label: string; bg: string }> = {
  cat:   { emoji: "🐱", label: "Gato",   bg: "#FF6B8A" },
  dog:   { emoji: "🐶", label: "Perro",  bg: "#FF8C42" },
  bird:  { emoji: "🐦", label: "Pájaro", bg: "#5BC8F5" },
  frog:  { emoji: "🐸", label: "Rana",   bg: "#B8E04A" },
  robot: { emoji: "🤖", label: "Robot",  bg: "#5BAEFF" },
  ghost: { emoji: "👻", label: "Fantasma",bg: "#C06BDB" },
  baby:  { emoji: "🍼", label: "Bebé",   bg: "#FFE033" },
  giant: { emoji: "🦕", label: "Gigante",bg: "#5FD49A" },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePetVoice() {
  const [config, setConfig] = useState<PetVoiceConfig>({
    preset: "cat",
    ...PRESETS["cat"],
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [error, setError]             = useState<string | null>(null);

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const recognRef    = useRef<any>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }

  // ── Apply Web Audio FX chain to a MediaStream (mic) ──────────────────────
  function buildFxChain(ctx: AudioContext, src: AudioNode, cfg: PetVoiceConfig): AudioNode {
    let node: AudioNode = src;

    // Pitch shift via playback-rate trick: not applicable on live stream;
    // instead we use a BiquadFilter to colour the timbre.
    const eq = ctx.createBiquadFilter();
    if (cfg.pitchShift > 0) {
      eq.type = "highshelf";
      eq.frequency.value = 2000;
      eq.gain.value = cfg.pitchShift * 1.5;
    } else {
      eq.type = "lowshelf";
      eq.frequency.value = 800;
      eq.gain.value = Math.abs(cfg.pitchShift) * 1.5;
    }
    node.connect(eq);
    node = eq;

    if (cfg.robotize) {
      // Ring modulation: multiply signal by a sine carrier
      const carrier = ctx.createOscillator();
      carrier.frequency.value = 60;
      carrier.start();
      const ringGain = ctx.createGain();
      ringGain.gain.value = 0;
      carrier.connect(ringGain.gain);
      const ringMul = ctx.createGain();
      node.connect(ringMul);
      ringGain.connect(ringMul.gain);
      node = ringMul;
    }

    if (cfg.echo) {
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.28;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.42;
      const dryGain  = ctx.createGain(); dryGain.gain.value  = 0.7;
      const wetGain  = ctx.createGain(); wetGain.gain.value  = 0.5;
      const merger   = ctx.createGain();
      node.connect(dryGain); dryGain.connect(merger);
      node.connect(delay);   delay.connect(feedback); feedback.connect(delay);
      delay.connect(wetGain); wetGain.connect(merger);
      node = merger;
    }

    return node;
  }

  // ── Speak text via Web Speech API + record + re-process ──────────────────
  const speak = useCallback((text: string) => {
    if (!text.trim()) return;
    if (!window.speechSynthesis) {
      setError("Tu browser no soporta síntesis de voz 😢");
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setError(null);

    const utt = new SpeechSynthesisUtterance(text);
    utt.pitch = config.pitch;
    utt.rate  = config.rate;
    utt.lang  = "es-ES";

    // Try to pick a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith("es"));
    if (esVoice) utt.voice = esVoice;

    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => { setIsSpeaking(false); setError("Error al sintetizar voz"); };
    window.speechSynthesis.speak(utt);
  }, [config]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Mic listen → transcribe → speak as pet ───────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Tu browser no soporta reconocimiento de voz 😢");
      return;
    }
    const recog = new SR();
    recog.lang = "es-ES";
    recog.interimResults = true;
    recog.continuous     = false;

    recog.onstart  = () => { setIsListening(true); setError(null); };
    recog.onend    = () => setIsListening(false);
    recog.onerror  = (e: any) => {
      setIsListening(false);
      setError(e.error === "not-allowed" ? "Permite el micrófono 🎤" : `Error: ${e.error}`);
    };
    recog.onresult = (e: any) => {
      const t = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        speak(t);
      }
    };

    recognRef.current = recog;
    recog.start();
  }, [speak]);

  const stopListening = useCallback(() => {
    recognRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Apply preset ──────────────────────────────────────────────────────────
  const applyPreset = useCallback((preset: PetVoicePreset) => {
    setConfig({ preset, ...PRESETS[preset] });
  }, []);

  const updateConfig = useCallback((patch: Partial<PetVoiceConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  return {
    config, updateConfig, applyPreset,
    speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    transcript, setTranscript,
    error,
  };
}
