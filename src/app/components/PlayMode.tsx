import { useState } from "react";

// ─── Audio Engine ────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playOsc(freq: number, type: OscillatorType, dur = 1.2, vol = 0.35, attack = 0.01, vib = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (vib > 0) {
    const vibOsc = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vibOsc.frequency.value = 5.5;
    vibGain.gain.value = vib;
    vibOsc.connect(vibGain);
    vibGain.connect(osc.frequency);
    vibOsc.start(ctx.currentTime);
    vibOsc.stop(ctx.currentTime + dur);
  }
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function playNoise(dur = 0.18, vol = 0.4, highpass = 1200) {
  const ctx = getCtx();
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = highpass;
  const gain = ctx.createGain();
  src.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.start();
  src.stop(ctx.currentTime + dur);
}

function piano(f: number)   { playOsc(f, "sine", 1.6, 0.4, 0.005); }
function guitar(f: number)  { playOsc(f, "triangle", 1.4, 0.45, 0.003); }
function trumpet(f: number) { playOsc(f, "sawtooth", 0.9, 0.35, 0.05, 8); }
function sax(f: number)     { playOsc(f, "sawtooth", 1.1, 0.38, 0.08, 5); }
function violin(f: number)  { playOsc(f, "sawtooth", 1.8, 0.3, 0.18, 14); }
function marimba(f: number) { playOsc(f, "sine", 0.7, 0.5, 0.002); }
function accordion(f: number) { playOsc(f, "square", 1.0, 0.28, 0.04, 6); }

function kick() {
  const ctx = getCtx();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(160, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
  g.gain.setValueAtTime(0.9, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  o.start(); o.stop(ctx.currentTime + 0.45);
}
function snare()    { playNoise(0.18, 0.5, 1200); }
function hihat()    { playNoise(0.08, 0.28, 8000); }
function tom(f: number) {
  const ctx = getCtx();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(f, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(f * 0.6, ctx.currentTime + 0.25);
  g.gain.setValueAtTime(0.7, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  o.start(); o.stop(ctx.currentTime + 0.35);
}

function guitarChord(freqs: number[]) {
  freqs.forEach((f, i) => setTimeout(() => guitar(f), i * 28));
}

const NOTES_C4 = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B", "C²"];
const BLACK = [
  { after: 0, freq: 277.18, name: "C#" },
  { after: 1, freq: 311.13, name: "D#" },
  { after: 3, freq: 369.99, name: "F#" },
  { after: 4, freq: 415.30, name: "G#" },
  { after: 5, freq: 466.16, name: "A#" },
];

const GUITAR_CHORDS: Record<string, number[]> = {
  "C":  [261.63, 329.63, 392, 523.25, 659.25],
  "G":  [196, 246.94, 293.66, 392, 493.88, 659.25],
  "Am": [220, 261.63, 329.63, 440, 523.25],
  "F":  [174.61, 220, 261.63, 349.23, 440],
  "Em": [164.81, 196, 246.94, 329.63, 392, 493.88],
  "D":  [293.66, 369.99, 440, 587.33],
};
const GUITAR_STRINGS = [
  { name: "E²", freq: 329.63 }, { name: "B", freq: 246.94 },
  { name: "G", freq: 196 },    { name: "D", freq: 146.83 },
  { name: "A", freq: 110 },    { name: "E", freq: 82.41 },
];

const TRUMPET_NOTES = [
  { label: "○○○", name: "Bb4", freq: 466.16 },
  { label: "●○○", name: "Ab4", freq: 415.3 },
  { label: "○●○", name: "A4",  freq: 440 },
  { label: "○○●", name: "G4",  freq: 392 },
  { label: "●●○", name: "F4",  freq: 349.23 },
  { label: "●○●", name: "E4",  freq: 329.63 },
  { label: "○●●", name: "Eb4", freq: 311.13 },
  { label: "●●●", name: "D4",  freq: 293.66 },
];

const SAX_KEYS = [
  { name: "C",  freq: 261.63 }, { name: "D",  freq: 293.66 },
  { name: "E",  freq: 329.63 }, { name: "F",  freq: 349.23 },
  { name: "G",  freq: 392 },    { name: "A",  freq: 440 },
  { name: "B",  freq: 493.88 }, { name: "C²", freq: 523.25 },
  { name: "D²", freq: 587.33 }, { name: "E²", freq: 659.25 },
  { name: "F²", freq: 698.46 }, { name: "G²", freq: 783.99 },
];

const VIOLIN_STRINGS = [
  { name: "G", freq: 196,    color: "#B8E04A" },
  { name: "D", freq: 293.66, color: "#FFE033" },
  { name: "A", freq: 440,    color: "#FF8C42" },
  { name: "E", freq: 659.25, color: "#FF6B8A" },
];

const MARIMBA_NOTES = [
  { name: "C",  freq: 261.63, color: "#FF6B8A", h: 90 },
  { name: "D",  freq: 293.66, color: "#FF8C42", h: 86 },
  { name: "E",  freq: 329.63, color: "#FFE033", h: 82 },
  { name: "F",  freq: 349.23, color: "#B8E04A", h: 78 },
  { name: "G",  freq: 392,    color: "#5BC8F5", h: 74 },
  { name: "A",  freq: 440,    color: "#C06BDB", h: 70 },
  { name: "B",  freq: 493.88, color: "#5BAEFF", h: 66 },
  { name: "C²", freq: 523.25, color: "#5FD49A", h: 62 },
];

const ACCORDION_BASS = [
  { name: "C",  freq: 65.41 }, { name: "F",  freq: 87.31 },
  { name: "G",  freq: 98 },    { name: "Am", freq: 110 },
  { name: "D",  freq: 73.42 }, { name: "E",  freq: 82.41 },
];
const ACCORDION_TREBLE = [
  { name: "C",  freq: 261.63 }, { name: "D",  freq: 293.66 }, { name: "E",  freq: 329.63 },
  { name: "F",  freq: 349.23 }, { name: "G",  freq: 392 },    { name: "A",  freq: 440 },
  { name: "B",  freq: 493.88 }, { name: "C²", freq: 523.25 }, { name: "D²", freq: 587.33 },
  { name: "E²", freq: 659.25 }, { name: "F²", freq: 698.46 }, { name: "G²", freq: 783.99 },
];

const INSTRUMENTS = [
  { id: "piano",     label: "Piano",    emoji: "🎹", bg: "#FF6B8A" },
  { id: "guitar",    label: "Guitarra", emoji: "🎸", bg: "#FFE033" },
  { id: "trumpet",   label: "Trompeta", emoji: "🎺", bg: "#FF8C42" },
  { id: "saxophone", label: "Saxofón",  emoji: "🎷", bg: "#C06BDB" },
  { id: "violin",    label: "Violín",   emoji: "🎻", bg: "#5BAEFF" },
  { id: "drums",     label: "Batería",  emoji: "🥁", bg: "#B8E04A" },
  { id: "accordion", label: "Acordeón", emoji: "🪗", bg: "#5FD49A" },
  { id: "marimba",   label: "Marimba",  emoji: "🎵", bg: "#5BC8F5" },
];

function usePressed() {
  const [pressed, setPressed] = useState<string | null>(null);
  const press = (key: string, fn: () => void) => {
    fn();
    setPressed(key);
    setTimeout(() => setPressed(null), 180);
  };
  return { pressed, press };
}

// ─── Pet Drawing Display ──────────────────────────────────────────────────────
function PetFrame({ dataUrl }: { dataUrl: string | null }) {
  return (
    <div style={{
      width: "120px", height: "120px",
      background: dataUrl ? "transparent" : "#FFFBF2",
      border: "4px solid #1A1A1A",
      borderRadius: "16px",
      boxShadow: "4px 4px 0 #1A1A1A",
      overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {dataUrl ? (
        <img src={dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>🎨</div>
          <div style={{ fontSize: "0.7rem", color: "#888", fontFamily: "'Chewy',cursive" }}>Dibuja primero</div>
        </div>
      )}
    </div>
  );
}

// ─── Instrument selector cards ────────────────────────────────────────────────
function InstrumentCards({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
      {INSTRUMENTS.map((ins, i) => (
        <button
          key={ins.id}
          onClick={() => onSelect(i)}
          style={{
            width: "72px", height: "72px",
            borderRadius: "16px",
            background: active === i ? ins.bg : "#FFFBF2",
            border: active === i ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
            cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "2px",
            boxShadow: active === i ? "2px 2px 0 #1A1A1A" : "4px 4px 0 #1A1A1A",
            transform: active === i ? "translate(2px,2px)" : "none",
            transition: "all 0.1s",
            fontFamily: "'Chewy',cursive",
          }}
        >
          <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{ins.emoji}</span>
          <span style={{ fontSize: "0.6rem", color: "#1A1A1A" }}>{ins.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Piano Panel ──────────────────────────────────────────────────────────────
function PianoPanel() {
  const { pressed, press } = usePressed();
  const W = 50;
  const KEY_COLORS = ["#FF6B8A","#FF8C42","#FFE033","#B8E04A","#5BC8F5","#5BAEFF","#C06BDB","#5FD49A"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎹 ¡Toca las teclas!</span>
      <div style={{
        position: "relative", height: "100px",
        width: `${NOTES_C4.length * (W + 4)}px`,
        background: "#FFFBF2", border: "3px solid #1A1A1A",
        borderRadius: "8px", padding: "4px",
        boxShadow: "4px 4px 0 #1A1A1A",
      }}>
        {NOTES_C4.map((freq, i) => (
          <button key={NOTE_NAMES[i]}
            onMouseDown={() => press(NOTE_NAMES[i], () => piano(freq))}
            onTouchStart={() => press(NOTE_NAMES[i], () => piano(freq))}
            style={{
              position: "absolute", left: `${i * (W + 4) + 4}px`, top: "4px",
              width: `${W}px`, height: "84px",
              background: pressed === NOTE_NAMES[i] ? KEY_COLORS[i] : "#FFFBF2",
              border: "3px solid #1A1A1A",
              borderRadius: "4px", cursor: "pointer",
              transform: pressed === NOTE_NAMES[i] ? "scaleY(0.95) translateY(3px)" : "none",
              transition: "transform 0.08s",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              paddingBottom: "6px", zIndex: 1,
              boxShadow: pressed === NOTE_NAMES[i] ? "none" : "0 3px 0 #1A1A1A",
            }}>
            <span style={{ fontSize: "0.8rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>{NOTE_NAMES[i]}</span>
          </button>
        ))}
        {BLACK.map(b => (
          <button key={b.name}
            onMouseDown={() => press(b.name, () => piano(b.freq))}
            onTouchStart={() => press(b.name, () => piano(b.freq))}
            style={{
              position: "absolute",
              left: `${b.after * (W + 4) + W - 10 + 4}px`, top: "4px",
              width: "22px", height: "56px",
              background: pressed === b.name ? "#555" : "#1A1A1A",
              border: "2px solid #000",
              borderRadius: "0 0 4px 4px",
              cursor: "pointer", zIndex: 2,
              transform: pressed === b.name ? "scaleY(0.94) translateY(2px)" : "none",
              transition: "transform 0.08s",
            }} />
        ))}
      </div>
    </div>
  );
}

// ─── Guitar Panel ─────────────────────────────────────────────────────────────
function GuitarPanel() {
  const { pressed, press } = usePressed();
  const CHORD_COLORS = ["#FF6B8A","#FFE033","#B8E04A","#5BC8F5","#C06BDB","#FF8C42"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎸 Cuerdas & Acordes</span>
      <div style={{ display: "flex", gap: "14px" }}>
        <div style={{
          background: "#FFFBF2", padding: "10px 12px",
          border: "3px solid #1A1A1A", borderRadius: "12px",
          boxShadow: "4px 4px 0 #1A1A1A", display: "flex",
          flexDirection: "column", gap: "6px",
        }}>
          <span style={{ fontSize: "0.8rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive", textAlign: "center" }}>Cuerdas</span>
          {GUITAR_STRINGS.map((s, i) => (
            <button key={s.name}
              onMouseDown={() => press(s.name, () => guitar(s.freq))}
              style={{
                height: "16px", width: "160px", borderRadius: "50px",
                cursor: "pointer",
                background: pressed === s.name ? CHORD_COLORS[i % CHORD_COLORS.length] : "#FFFBF2",
                border: "2px solid #1A1A1A",
                boxShadow: pressed === s.name ? "none" : "0 2px 0 #1A1A1A",
                transition: "all 0.08s",
                display: "flex", alignItems: "center", paddingLeft: "8px", gap: "6px",
                fontFamily: "'Chewy',cursive",
              }}>
              <div style={{ height: "2px", flex: 1, background: "#1A1A1A", borderRadius: "1px" }} />
              <span style={{ fontSize: "0.75rem", color: "#1A1A1A", minWidth: "24px" }}>{s.name}</span>
            </button>
          ))}
        </div>
        <div style={{
          background: "#FFFBF2", padding: "10px 12px",
          border: "3px solid #1A1A1A", borderRadius: "12px",
          boxShadow: "4px 4px 0 #1A1A1A",
        }}>
          <span style={{ fontSize: "0.8rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive", display: "block", textAlign: "center", marginBottom: "6px" }}>Acordes</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {Object.entries(GUITAR_CHORDS).map(([name, freqs], i) => (
              <button key={name}
                onMouseDown={() => press(name, () => guitarChord(freqs))}
                style={{
                  padding: "8px 12px", borderRadius: "50px", cursor: "pointer",
                  background: pressed === name ? CHORD_COLORS[i % CHORD_COLORS.length] : "#FFFBF2",
                  border: "3px solid #1A1A1A",
                  fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A",
                  boxShadow: pressed === name ? "none" : "3px 3px 0 #1A1A1A",
                  transform: pressed === name ? "translate(2px,2px)" : "none",
                  transition: "all 0.08s",
                }}>{name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trumpet Panel ────────────────────────────────────────────────────────────
function TrumpetPanel() {
  const { pressed, press } = usePressed();
  const COLORS = ["#FF6B8A","#FFE033","#B8E04A","#5BC8F5","#FF8C42","#C06BDB","#5BAEFF","#5FD49A"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎺 Válvulas</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {TRUMPET_NOTES.map((n, i) => (
          <button key={n.name}
            onMouseDown={() => press(n.name, () => trumpet(n.freq))}
            style={{
              padding: "10px 14px", borderRadius: "14px", cursor: "pointer",
              background: pressed === n.name ? COLORS[i] : "#FFFBF2",
              border: "3px solid #1A1A1A",
              fontFamily: "'Chewy',cursive", textAlign: "center",
              boxShadow: pressed === n.name ? "none" : "3px 3px 0 #1A1A1A",
              transform: pressed === n.name ? "translate(2px,2px)" : "none",
              transition: "all 0.08s",
            }}>
            <div style={{ fontSize: "0.7rem", color: "#555" }}>{n.label}</div>
            <div style={{ fontSize: "1rem", color: "#1A1A1A" }}>{n.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sax Panel ────────────────────────────────────────────────────────────────
function SaxPanel() {
  const { pressed, press } = usePressed();
  const COLORS = ["#FF6B8A","#5BAEFF","#B8E04A","#C06BDB","#FFE033","#FF8C42","#5FD49A","#5BC8F5","#FF6B8A","#5BAEFF","#B8E04A","#FFE033"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎷 Llaves del saxofón</span>
      <div style={{
        background: "#FFFBF2", padding: "12px 14px",
        border: "3px solid #1A1A1A", borderRadius: "16px",
        boxShadow: "4px 4px 0 #1A1A1A",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "8px" }}>
          {SAX_KEYS.map((k, i) => (
            <button key={k.name}
              onMouseDown={() => press(k.name, () => sax(k.freq))}
              style={{
                width: "44px", height: "44px", borderRadius: "50%", cursor: "pointer",
                background: pressed === k.name ? COLORS[i] : "#FFFBF2",
                border: "3px solid #1A1A1A",
                fontFamily: "'Chewy',cursive", fontSize: "0.7rem", color: "#1A1A1A",
                boxShadow: pressed === k.name ? "none" : "3px 3px 0 #1A1A1A",
                transform: pressed === k.name ? "translate(2px,2px)" : "none",
                transition: "all 0.1s",
              }}>{k.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Violin Panel ─────────────────────────────────────────────────────────────
function ViolinPanel() {
  const { pressed, press } = usePressed();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎻 Desliza para tocar</span>
      <div style={{
        display: "flex", gap: "12px", alignItems: "center",
        background: "#FFFBF2", padding: "12px 18px",
        border: "3px solid #1A1A1A", borderRadius: "16px",
        boxShadow: "4px 4px 0 #1A1A1A",
      }}>
        {VIOLIN_STRINGS.map((s) => (
          <div key={s.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>{s.name}</span>
            <button
              onMouseDown={() => press(s.name, () => violin(s.freq))}
              style={{
                width: "40px", height: "96px", borderRadius: "20px",
                background: pressed === s.name ? s.color : "#FFFBF2",
                border: "3px solid #1A1A1A",
                cursor: "ns-resize", position: "relative",
                boxShadow: pressed === s.name ? "none" : "3px 3px 0 #1A1A1A",
                transform: pressed === s.name ? "translate(2px,2px)" : "none",
                transition: "all 0.1s",
              }}>
              <div style={{ position: "absolute", left: "50%", top: "8px", bottom: "8px", width: "2px", background: "#1A1A1A", transform: "translateX(-50%)", borderRadius: "1px" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drums Panel ──────────────────────────────────────────────────────────────
function DrumsPanel() {
  const { pressed, press } = usePressed();
  const PADS = [
    { id: "crash", label: "Crash", fn: () => playNoise(0.35, 0.35, 3000), color: "#FFE033", w: 70, h: 14 },
    { id: "hihat", label: "Hi-hat", fn: hihat, color: "#FF6B8A", w: 56, h: 14 },
    { id: "ride",  label: "Ride",  fn: () => playNoise(0.4, 0.28, 5000), color: "#C06BDB", w: 60, h: 14 },
    { id: "tom1",  label: "Tom 1", fn: () => tom(220), color: "#5BAEFF", w: 62, h: 50 },
    { id: "tom2",  label: "Tom 2", fn: () => tom(160), color: "#5BC8F5", w: 68, h: 54 },
    { id: "snare", label: "Snare", fn: snare, color: "#FF8C42", w: 76, h: 60 },
    { id: "kick",  label: "Kick",  fn: kick,  color: "#B8E04A", w: 100, h: 80 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🥁 Kit de batería</span>
      <div style={{
        background: "#FFFBF2", padding: "12px 14px",
        border: "3px solid #1A1A1A", borderRadius: "16px",
        boxShadow: "4px 4px 0 #1A1A1A",
      }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "8px" }}>
          {PADS.slice(0, 3).map(p => (
            <button key={p.id}
              onMouseDown={() => press(p.id, p.fn)}
              style={{
                width: `${p.w}px`, height: `${p.h}px`, borderRadius: "50%",
                cursor: "pointer",
                background: pressed === p.id ? p.color : "#FFFBF2",
                border: "3px solid #1A1A1A",
                fontFamily: "'Chewy',cursive", fontSize: "0.65rem", color: "#1A1A1A",
                transform: pressed === p.id ? "scaleY(0.88)" : "none",
                transition: "all 0.07s",
                boxShadow: pressed === p.id ? "none" : "0 3px 0 #1A1A1A",
              }}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", justifyContent: "center", marginBottom: "8px" }}>
          {PADS.slice(3, 6).map(p => (
            <button key={p.id}
              onMouseDown={() => press(p.id, p.fn)}
              style={{
                width: `${p.w}px`, height: `${p.h}px`, borderRadius: "50%",
                cursor: "pointer",
                background: pressed === p.id ? p.color : "#FFFBF2",
                border: "3px solid #1A1A1A",
                fontFamily: "'Chewy',cursive", fontSize: "0.8rem", color: "#1A1A1A",
                transform: pressed === p.id ? "scale(0.92)" : "scale(1)",
                transition: "all 0.08s",
                boxShadow: pressed === p.id ? "none" : "3px 3px 0 #1A1A1A",
              }}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onMouseDown={() => press("kick", kick)}
            style={{
              width: "100px", height: "80px", borderRadius: "50%", cursor: "pointer",
              background: pressed === "kick" ? "#B8E04A" : "#FFFBF2",
              border: "4px solid #1A1A1A",
              fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A",
              transform: pressed === "kick" ? "scale(0.92)" : "scale(1)",
              transition: "all 0.08s",
              boxShadow: pressed === "kick" ? "none" : "4px 4px 0 #1A1A1A",
            }}>Kick 💥</button>
        </div>
      </div>
    </div>
  );
}

// ─── Accordion Panel ──────────────────────────────────────────────────────────
function AccordionPanel() {
  const { pressed, press } = usePressed();
  const BASS_COLORS = ["#FF6B8A","#FFE033","#B8E04A","#5BC8F5","#FF8C42","#C06BDB"];
  const TREBLE_COLORS = ["#FF6B8A","#5BAEFF","#B8E04A","#C06BDB","#FFE033","#FF8C42","#5FD49A","#5BC8F5","#FF6B8A","#5BAEFF","#B8E04A","#FFE033"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🪗 Acordeón</span>
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{
          background: "#FFFBF2", padding: "10px 10px",
          border: "3px solid #1A1A1A", borderRadius: "12px",
          boxShadow: "3px 3px 0 #1A1A1A", display: "flex",
          flexDirection: "column", gap: "6px", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>Bajos</span>
          {ACCORDION_BASS.map((b, i) => (
            <button key={b.name}
              onMouseDown={() => press("b"+b.name, () => accordion(b.freq))}
              style={{
                width: "44px", height: "38px", borderRadius: "50%", cursor: "pointer",
                background: pressed === "b"+b.name ? BASS_COLORS[i] : "#FFFBF2",
                border: "3px solid #1A1A1A",
                fontFamily: "'Chewy',cursive", fontSize: "0.8rem", color: "#1A1A1A",
                boxShadow: pressed === "b"+b.name ? "none" : "2px 2px 0 #1A1A1A",
                transform: pressed === "b"+b.name ? "translate(1px,1px)" : "none",
                transition: "all 0.1s",
              }}>{b.name}</button>
          ))}
        </div>
        <div style={{
          background: "#FFFBF2", padding: "10px 10px",
          border: "3px solid #1A1A1A", borderRadius: "12px",
          boxShadow: "3px 3px 0 #1A1A1A",
        }}>
          <span style={{ fontSize: "0.75rem", color: "#1A1A1A", display: "block", textAlign: "center", marginBottom: "6px", fontFamily: "'Chewy',cursive" }}>Agudos</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "5px" }}>
            {ACCORDION_TREBLE.map((t, i) => (
              <button key={t.name+i}
                onMouseDown={() => press("t"+t.name+i, () => accordion(t.freq))}
                style={{
                  width: "40px", height: "34px", borderRadius: "50%", cursor: "pointer",
                  background: pressed === "t"+t.name+i ? TREBLE_COLORS[i%12] : "#FFFBF2",
                  border: "2px solid #1A1A1A",
                  fontFamily: "'Chewy',cursive", fontSize: "0.65rem", color: "#1A1A1A",
                  boxShadow: pressed === "t"+t.name+i ? "none" : "2px 2px 0 #1A1A1A",
                  transform: pressed === "t"+t.name+i ? "translate(1px,1px)" : "none",
                  transition: "all 0.1s",
                }}>{t.name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Marimba Panel ────────────────────────────────────────────────────────────
function MarimbaPanel() {
  const { pressed, press } = usePressed();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎵 Marimba</span>
      <div style={{
        background: "#FFFBF2", padding: "12px 16px",
        border: "3px solid #1A1A1A", borderRadius: "16px",
        boxShadow: "4px 4px 0 #1A1A1A",
        display: "flex", gap: "6px", alignItems: "flex-end",
      }}>
        {MARIMBA_NOTES.map((n) => (
          <button key={n.name}
            onMouseDown={() => press(n.name, () => marimba(n.freq))}
            style={{
              width: "48px", height: `${n.h}px`, borderRadius: "8px", cursor: "pointer",
              background: pressed === n.name ? n.color : "#FFFBF2",
              border: "3px solid #1A1A1A",
              fontFamily: "'Chewy',cursive", fontSize: "0.8rem", color: "#1A1A1A",
              display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "6px",
              transform: pressed === n.name ? "scaleY(0.93) translateY(4px)" : "none",
              transition: "all 0.09s",
              boxShadow: pressed === n.name ? "none" : "3px 3px 0 #1A1A1A",
            }}>{n.name}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function PlayMode({ drawingDataUrl }: { drawingDataUrl: string | null }) {
  const [activeInst, setActiveInst] = useState(0);
  const inst = INSTRUMENTS[activeInst];

  function renderPanel() {
    switch (inst.id) {
      case "piano":     return <PianoPanel />;
      case "guitar":    return <GuitarPanel />;
      case "trumpet":   return <TrumpetPanel />;
      case "saxophone": return <SaxPanel />;
      case "violin":    return <ViolinPanel />;
      case "drums":     return <DrumsPanel />;
      case "accordion": return <AccordionPanel />;
      case "marimba":   return <MarimbaPanel />;
      default:          return <PianoPanel />;
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ fontFamily: "'Chewy', cursive" }}>

      {/* Top section: pet + instrument selector */}
      <div style={{
        background: "#5BC8F5",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: "20px",
        borderBottom: "3px solid #1A1A1A",
        flexWrap: "wrap",
      }}>
        {/* Pet drawing */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <PetFrame dataUrl={drawingDataUrl} />
          <span style={{ fontSize: "0.8rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>tu mascota 🐾</span>
        </div>

        {/* Active instrument badge */}
        <div style={{
          background: inst.bg, border: "3px solid #1A1A1A",
          borderRadius: "50px", padding: "6px 18px",
          boxShadow: "3px 3px 0 #1A1A1A",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "1.6rem" }}>{inst.emoji}</span>
          <span style={{ fontSize: "1.1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>Tocando: {inst.label}</span>
        </div>

        {/* Instrument cards */}
        <div style={{ flex: 1 }}>
          <InstrumentCards active={activeInst} onSelect={setActiveInst} />
        </div>
      </div>

      {/* Bottom: instrument panel */}
      <div style={{
        flex: 1,
        background: "#FFE033",
        borderTop: "3px solid #1A1A1A",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "auto",
      }}>
        {renderPanel()}
      </div>
    </div>
  );
}
