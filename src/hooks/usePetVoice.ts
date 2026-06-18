import { useRef, useState, useCallback, useEffect } from "react";

// Only real animals — no robots, babies or dinosaurs
export type PetVoicePreset =
  | "cat" | "dog" | "bird" | "frog" | "rabbit" | "hamster" | "cow" | "lion";

export interface PetVoiceConfig {
  preset: PetVoicePreset;
  pitch: number;
  rate: number;
  pitchShift: number;
  robotize: boolean;
  echo: boolean;
}

export const PRESETS: Record<PetVoicePreset, Omit<PetVoiceConfig,"preset">> = {
  cat:     { pitch: 2.0, rate: 1.1, pitchShift:  7, robotize: false, echo: false },
  dog:     { pitch: 0.6, rate: 0.9, pitchShift: -3, robotize: false, echo: false },
  bird:    { pitch: 3.8, rate: 1.4, pitchShift: 12, robotize: false, echo: true  },
  frog:    { pitch: 0.4, rate: 0.7, pitchShift: -6, robotize: false, echo: false },
  rabbit:  { pitch: 2.8, rate: 1.2, pitchShift:  5, robotize: false, echo: false },
  hamster: { pitch: 3.5, rate: 1.5, pitchShift:  9, robotize: false, echo: false },
  cow:     { pitch: 0.3, rate: 0.5, pitchShift: -8, robotize: false, echo: false },
  lion:    { pitch: 0.2, rate: 0.6, pitchShift:-10, robotize: false, echo: false },
};

export const PRESET_META: Record<PetVoicePreset,{emoji:string;label:string;bg:string;sound:string}> = {
  cat:     { emoji: "🐱", label: "Gato",    bg: "#FF6B8A", sound: "miau miau miau" },
  dog:     { emoji: "🐶", label: "Perro",   bg: "#FF8C42", sound: "guau guau guau" },
  bird:    { emoji: "🐦", label: "Pájaro",  bg: "#5BC8F5", sound: "pío pío pío" },
  frog:    { emoji: "🐸", label: "Rana",    bg: "#B8E04A", sound: "croc croc croc" },
  rabbit:  { emoji: "🐇", label: "Conejo",  bg: "#FFE033", sound: "squeak squeak" },
  hamster: { emoji: "🐹", label: "Hámster", bg: "#FF8C42", sound: "squeak squeak squeak" },
  cow:     { emoji: "🐄", label: "Vaca",    bg: "#FFFBF2", sound: "muuu muuu" },
  lion:    { emoji: "🦁", label: "León",    bg: "#FFE033", sound: "roaar roaar" },
};

/** Synthesize an animal sound using Web Audio — no TTS needed */
export function playAnimalSound(preset: PetVoicePreset, vol = 0.5): void {
  let ctx: AudioContext;
  try { ctx = new AudioContext(); } catch { return; }
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  switch(preset) {
    case "cat": {
      // High rising-falling "miau"
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.45;
        const o = ctx.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(600, t);
        o.frequency.linearRampToValueAtTime(900, t + 0.12);
        o.frequency.exponentialRampToValueAtTime(500, t + 0.35);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.4);
      }
      break;
    }
    case "dog": {
      // "woof" — short bark burst
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.55;
        const o = ctx.createOscillator(); o.type = "sawtooth";
        o.frequency.setValueAtTime(200, t);
        o.frequency.linearRampToValueAtTime(120, t + 0.18);
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 800;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.3);
      }
      break;
    }
    case "bird": {
      // Chirping — rapid freq sweeps
      for (let i = 0; i < 5; i++) {
        const t = now + i * 0.18;
        const o = ctx.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(2400 + Math.random()*400, t);
        o.frequency.linearRampToValueAtTime(3200 + Math.random()*400, t + 0.08);
        const g = ctx.createGain(); g.gain.setValueAtTime(vol*0.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.15);
      }
      break;
    }
    case "frog": {
      // "croak" — low guttural pulse
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.4;
        const o = ctx.createOscillator(); o.type = "square";
        o.frequency.setValueAtTime(120, t);
        o.frequency.linearRampToValueAtTime(80, t + 0.15);
        const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 300; f.Q.value = 2;
        const g = ctx.createGain(); g.gain.setValueAtTime(vol*0.7, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.22);
      }
      break;
    }
    case "rabbit":
    case "hamster": {
      // High "squeak"
      const count = preset === "hamster" ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const t = now + i * 0.25;
        const o = ctx.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(1800, t);
        o.frequency.linearRampToValueAtTime(2400, t + 0.06);
        o.frequency.exponentialRampToValueAtTime(1600, t + 0.14);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol*0.5, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.18);
      }
      break;
    }
    case "cow": {
      // Low "muuu" — long, slow
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(90, now);
      o.frequency.linearRampToValueAtTime(130, now + 0.3);
      o.frequency.setValueAtTime(130, now + 0.3);
      o.frequency.linearRampToValueAtTime(100, now + 0.9);
      const vib = ctx.createOscillator(); vib.frequency.value = 6;
      const vg = ctx.createGain(); vg.gain.value = 8;
      vib.connect(vg); vg.connect(o.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.15);
      g.gain.setValueAtTime(vol, now + 0.7);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      o.connect(g); g.connect(ctx.destination);
      vib.start(now); vib.stop(now + 1.1);
      o.start(now); o.stop(now + 1.1);
      break;
    }
    case "lion": {
      // Deep roar with rumble noise
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.8));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 180; f.Q.value = 1.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol*1.2, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      src.start(now); src.stop(now + 1.5);
      break;
    }
  }
  gain.disconnect();
  // Auto-close context after sound ends
  setTimeout(() => ctx.close(), 3000);
}

function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
  });
}

export function usePetVoice() {
  const [config, setConfig] = useState<PetVoiceConfig>({ preset:"cat", ...PRESETS["cat"] });
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState("");
  const [error,       setError]       = useState<string|null>(null);
  const recognRef = useRef<any>(null);

  useEffect(() => { if (window.speechSynthesis) getVoicesAsync(); }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (!window.speechSynthesis) { setError("Tu browser no soporta síntesis de voz 😢"); return; }
    window.speechSynthesis.cancel();
    setError(null); setIsSpeaking(true);
    // Play animal sound first, then speak the text
    playAnimalSound(config.preset, 0.4);
    const utt = new SpeechSynthesisUtterance(text);
    utt.pitch  = Math.min(Math.max(config.pitch, 0.1), 2);
    utt.rate   = Math.min(Math.max(config.rate,  0.1), 10);
    utt.lang   = "es-ES"; utt.volume = 0.9;
    try {
      const voices = await getVoicesAsync();
      const esVoice = voices.find(v=>v.lang.startsWith("es"))??voices.find(v=>v.default)??voices[0];
      if (esVoice) utt.voice = esVoice;
    } catch { /* use default */ }
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = (ev) => {
      setIsSpeaking(false);
      if ((ev as any).error !== "interrupted") setError(`Error al sintetizar voz (${(ev as any).error??"desconocido"})`);
    };
    window.speechSynthesis.speak(utt);
  }, [config]);

  const stopSpeaking = useCallback(() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }, []);

  const startListening = useCallback(() => {
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if (!SR) { setError("Tu browser no soporta reconocimiento de voz. Usa Chrome."); return; }
    const recog = new SR();
    recog.lang="es-ES"; recog.interimResults=true; recog.continuous=false;
    recog.onstart  = () => { setIsListening(true); setError(null); };
    recog.onend    = () => setIsListening(false);
    recog.onerror  = (e: any) => { setIsListening(false); setError(e.error==="not-allowed"?"Permite el micrófono 🎤":`Error mic: ${e.error}`); };
    recog.onresult = (e: any) => {
      const t=Array.from(e.results as any[]).map((r:any)=>r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length-1].isFinal) speak(t);
    };
    recognRef.current=recog; recog.start();
  }, [speak]);

  const stopListening = useCallback(() => { recognRef.current?.stop(); setIsListening(false); }, []);
  const applyPreset   = useCallback((preset: PetVoicePreset) => { setConfig({preset,...PRESETS[preset]}); }, []);
  const updateConfig  = useCallback((patch: Partial<PetVoiceConfig>) => { setConfig(prev=>({...prev,...patch})); }, []);

  return { config, updateConfig, applyPreset, speak, stopSpeaking, isSpeaking, startListening, stopListening, isListening, transcript, setTranscript, error };
}
