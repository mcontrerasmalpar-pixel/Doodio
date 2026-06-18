import { useState, useRef, useEffect } from "react";
import type { MelodyNote } from "./PlayMode";

let _expCtx: AudioContext | null = null;
function getCtx() {
  if (!_expCtx) _expCtx = new AudioContext();
  return _expCtx;
}

type InstrumentId = "piano" | "guitar" | "marimba" | "flute" | "bells" | "synthpad";

const INSTRUMENTS: { id: InstrumentId; emoji: string; label: string; bg: string; size: number; angle: number }[] = [
  { id: "piano",    emoji: "🎹", label: "Piano",   bg: "#FF6B8A", size: 64, angle: 0   },
  { id: "guitar",   emoji: "🎸", label: "Guitar",  bg: "#FFE033", size: 58, angle: 60  },
  { id: "marimba",  emoji: "🎵", label: "Marimba", bg: "#B8E04A", size: 54, angle: 120 },
  { id: "flute",    emoji: "🪈", label: "Flute",   bg: "#5BC8F5", size: 58, angle: 180 },
  { id: "bells",    emoji: "🔔", label: "Bells",   bg: "#FF8C42", size: 54, angle: 240 },
  { id: "synthpad", emoji: "🌟", label: "Synth",   bg: "#C06BDB", size: 62, angle: 300 },
];

function playNoteInst(freq: number, vol: number, dur: number, inst: InstrumentId) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, now);

  switch (inst) {
    case "piano": {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq; o.connect(gain);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.start(now); o.stop(now + dur);
      const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = freq * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.1; o2.connect(g2); g2.connect(gain);
      o2.start(now); o2.stop(now + dur);
      break;
    }
    case "guitar": {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1800;
      o.connect(f); f.connect(gain);
      gain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);
      o.start(now); o.stop(now + dur);
      break;
    }
    case "marimba": {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq; o.connect(gain);
      gain.gain.linearRampToValueAtTime(vol, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      o.start(now); o.stop(now + 0.6);
      break;
    }
    case "flute": {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq;
      const vib = ctx.createOscillator(); vib.frequency.value = 5.5;
      const vg = ctx.createGain(); vg.gain.value = freq * 0.012;
      vib.connect(vg); vg.connect(o.frequency); o.connect(gain);
      gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.06);
      gain.gain.setValueAtTime(vol * 0.7, now + dur - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      vib.start(now); vib.stop(now + dur);
      o.start(now); o.stop(now + dur);
      break;
    }
    case "bells": {
      [1, 2.756, 5.404].forEach((ratio, i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq * ratio;
        const g = ctx.createGain(); g.gain.value = i === 0 ? vol : vol * 0.14;
        o.connect(g); g.connect(gain); o.start(now); o.stop(now + dur * 1.5);
      });
      gain.gain.linearRampToValueAtTime(1, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.5);
      break;
    }
    case "synthpad": {
      [1, 1.005, 0.5].forEach(ratio => {
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq * ratio;
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
        o.connect(f); f.connect(gain); o.start(now); o.stop(now + dur + 0.3);
      });
      gain.gain.linearRampToValueAtTime(vol * 0.5, now + 0.12);
      gain.gain.setValueAtTime(vol * 0.5, now + dur - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.3);
      break;
    }
  }
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "",
  ];
  for (const t of types) {
    if (t === "" || (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t))) return t;
  }
  return "";
}

interface Props {
  melody: MelodyNote[];
}

export function ExperimentMode({ melody }: Props) {
  const [petPhoto,   setPetPhoto]   = useState<string | null>(null);
  const [recording,  setRecording]  = useState(false);
  const [recorded,   setRecorded]   = useState(false);
  const [remixURL,   setRemixURL]   = useState<string | null>(null);
  const [remixExt,   setRemixExt]   = useState("webm");
  const [noteStep,   setNoteStep]   = useState(0);
  const [flashInst,  setFlashInst]  = useState<InstrumentId | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<BlobPart[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const notes = melody.filter(n => !n.rest);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPetPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") await ctx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mr = new MediaRecorder(stream, options);

      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const finalMime = mr.mimeType || mimeType || "audio/webm";
        const ext = finalMime.includes("ogg") ? "ogg" : finalMime.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        setRemixExt(ext);
        setRemixURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mr.start(100);
      mediaRecRef.current = mr;

      setRecording(true); setRecorded(false); setRemixURL(null);
      setNoteStep(0); setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      mediaRecRef.current.stop();
    }
    setRecording(false); setRecorded(true);
  };

  const tapInstrument = (id: InstrumentId) => {
    if (!notes.length) return;
    const note = notes[noteStep % notes.length];
    playNoteInst(note.freq, note.volume, note.duration, id);
    setNoteStep(s => s + 1);
    setFlashInst(id);
    setTimeout(() => setFlashInst(null), 180);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const half = 190;
  const photoR = 90;
  const orbitR = half - photoR - 8;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#1A1A2E", fontFamily:"'Chewy',cursive" }}>

      <div style={{ padding:"10px 16px 0", color:"#FFE033", fontSize:"1.1rem", flexShrink:0 }}>🧪 Experiments</div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <div style={{ position:"relative", width: half*2, height: half*2 }}>

          {INSTRUMENTS.map(inst => {
            const rad = (inst.angle * Math.PI) / 180;
            const cx = half + Math.cos(rad) * orbitR;
            const cy = half + Math.sin(rad) * orbitR;
            const isFlashing = flashInst === inst.id;
            const canTap = recording || recorded;
            return (
              <button
                key={inst.id}
                onPointerDown={e => { e.preventDefault(); if (canTap) tapInstrument(inst.id); }}
                style={{
                  position:"absolute",
                  left: cx - inst.size/2, top: cy - inst.size/2,
                  width: inst.size, height: inst.size,
                  borderRadius:"50%",
                  background: isFlashing ? "#FFFFFF" : inst.bg,
                  border:"3px solid #1A1A1A",
                  boxShadow: isFlashing ? `0 0 20px 8px ${inst.bg}` : "3px 3px 0 #000",
                  cursor: canTap ? "pointer" : "default",
                  fontSize: inst.size > 56 ? "1.6rem" : "1.3rem",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transform: isFlashing ? "scale(1.28)" : "scale(1)",
                  transition:"transform 0.1s, box-shadow 0.12s, background 0.1s",
                  opacity: canTap ? 1 : 0.45,
                  zIndex:2, padding:0,
                  WebkitTapHighlightColor:"transparent",
                  touchAction:"manipulation",
                }}>
                {inst.emoji}
              </button>
            );
          })}

          {/* Pet photo */}
          <label htmlFor="pet-upload" style={{
            position:"absolute",
            left: half - photoR, top: half - photoR,
            width: photoR*2, height: photoR*2,
            borderRadius:"50%",
            background: petPhoto ? "transparent" : "#2A2A4A",
            border:"4px solid #FFE033",
            boxShadow:"0 0 0 4px #1A1A1A, 5px 5px 0 #000",
            cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:"4px",
            overflow:"hidden", zIndex:3,
          }}>
            {petPhoto
              ? <img src={petPhoto} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : (<>
                  <span style={{ fontSize:"2.2rem" }}>📷</span>
                  <span style={{ fontSize:"0.7rem", color:"#FFE033", textAlign:"center", lineHeight:1.3, padding:"0 10px" }}>Upload pet photo</span>
                </>)
            }
          </label>
          <input id="pet-upload" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:"none" }} />

          {/* Note dots */}
          {notes.length > 0 && (
            <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", display:"flex", gap:"4px", zIndex:4 }}>
              {Array.from({ length: Math.min(notes.length, 16) }).map((_, i) => (
                <div key={i} style={{
                  width:5, height:5, borderRadius:"50%",
                  background: i === noteStep % Math.min(notes.length, 16) ? "#FFE033" : "rgba(255,255,255,0.2)",
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ flexShrink:0, padding:"10px 16px 14px", display:"flex", flexDirection:"column", gap:"8px", background:"#12122A", borderTop:"3px solid #FFE033" }}>
        <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.5)", textAlign:"center" }}>
          {!recording && !recorded && "Upload a pet photo, then record + tap circles!"}
          {recording && `🔴 Recording ${recSeconds}s — tap circles to add notes!`}
          {recorded && !recording && "✅ Done! Tap more circles or listen below."}
        </div>

        <button
          onPointerDown={e => { e.preventDefault(); recording ? stopRecording() : startRecording(); }}
          style={{
            width:"100%", padding:"12px", borderRadius:"50px",
            background: recording ? "#FF6B8A" : "#FFE033",
            border: recording ? "3px solid #FF0040" : "3px solid #1A1A1A",
            cursor:"pointer", fontFamily:"'Chewy',cursive", fontSize:"1rem", color:"#1A1A1A",
            boxShadow: recording ? "0 0 14px #FF6B8A88" : "4px 4px 0 #000",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}>
          <span>{recording ? "⏹" : "🔴"}</span>
          <span>{recording ? `Stop (${recSeconds}s)` : "Record your pet"}</span>
        </button>

        {remixURL && (
          <div style={{ background:"#B8E04A", border:"2px solid #1A1A1A", borderRadius:"12px", padding:"8px 12px", display:"flex", alignItems:"center", gap:"8px" }}>
            <audio controls src={remixURL} style={{ flex:1, height:"32px" }} />
            <a
              href={remixURL} download={`pet-experiment.${remixExt}`}
              style={{ display:"flex", alignItems:"center", gap:"4px", padding:"6px 10px", borderRadius:"50px", background:"#FFFBF2", border:"2px solid #1A1A1A", fontFamily:"'Chewy',cursive", fontSize:"0.8rem", color:"#1A1A1A", boxShadow:"2px 2px 0 #1A1A1A", textDecoration:"none", flexShrink:0 }}>
              ⬇️ Save
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
