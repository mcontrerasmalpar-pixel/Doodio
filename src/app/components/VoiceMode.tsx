import { useState, useRef, useEffect } from "react";
import { useDrawSound } from "../../hooks/useDrawSound";
import { getMoodResult, type MoodResult } from "../../lib/moodDetect";

// ─── tiny preset meta (no TTS needed anymore) ───────────────────────────────
const ANIMAL_META: Record<string, { emoji: string; label: string; bg: string }> = {
  cat:     { emoji: "🐱", label: "Cat",     bg: "#FF6B8A" },
  dog:     { emoji: "🐶", label: "Dog",     bg: "#FF8C42" },
  bird:    { emoji: "🐦", label: "Bird",    bg: "#5BC8F5" },
  frog:    { emoji: "🐸", label: "Frog",    bg: "#B8E04A" },
  rabbit:  { emoji: "🐇", label: "Rabbit",  bg: "#C06BDB" },
  hamster: { emoji: "🐹", label: "Hamster", bg: "#FFE033" },
  cow:     { emoji: "🐄", label: "Cow",     bg: "#5BAEFF" },
  lion:    { emoji: "🦁", label: "Lion",    bg: "#FF6B8A" },
};
const ANIMAL_LIST = Object.keys(ANIMAL_META);

// ─── Sound profile bar ───────────────────────────────────────────────────────
function SoundBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem" }}>
      <span style={{ width: "80px", color: "#1A1A1A", fontFamily: "'Chewy',cursive", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: "10px", background: "#E8E0C8", border: "2px solid #1A1A1A", borderRadius: "50px", overflow: "hidden" }}>
        <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: "50px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function VoiceMode({ drawingDataUrl }: { drawingDataUrl: string | null }) {
  const { profile, analyze, play, stopAll, isPlaying, isAnalyzing } = useDrawSound();
  const [activeTab,   setActiveTab]   = useState<"record" | "sound">("record");
  const [animal,      setAnimal]      = useState("cat");
  const [moodResult,  setMoodResult]  = useState<MoodResult | null>(null);

  // ── Recorder state ──
  const [recording,   setRecording]   = useState(false);
  const [audioURL,    setAudioURL]    = useState<string | null>(null);
  const [audioBlob,   setAudioBlob]   = useState<Blob | null>(null);
  const [remixing,    setRemixing]    = useState(false);
  const [remixURL,    setRemixURL]    = useState<string | null>(null);
  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<BlobPart[]>([]);
  const audioCtxRef   = useRef<AudioContext | null>(null);

  const meta = ANIMAL_META[animal] ?? ANIMAL_META.cat;

  // Analyze drawing whenever it changes
  useEffect(() => {
    if (!drawingDataUrl) return;
    analyze(drawingDataUrl).then(p => {
      const result = getMoodResult(p, animal as any);
      setMoodResult(result);
    });
  }, [drawingDataUrl]);

  // Recompute mood when animal changes
  useEffect(() => {
    if (!profile) return;
    const result = getMoodResult(profile, animal as any);
    setMoodResult(result);
  }, [animal, profile]);

  // ── Recording helpers ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setRemixURL(null);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
      setAudioURL(null);
      setRemixURL(null);
    } catch {
      alert("Microphone access denied. Please allow mic access and try again.");
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    setRecording(false);
  };

  // ── Remix: layer pet voice over drawing melody ─────────────────────────────
  // Strategy: decode the recorded audio, pitch-shift it slightly using
  // AudioContext detune on a BufferSource, then play both melody + pet voice.
  const remixWithMelody = async () => {
    if (!audioBlob || !drawingDataUrl) return;
    setRemixing(true);
    try {
      // Play drawing melody
      play(drawingDataUrl);

      // Decode pet recording and replay with detune from sound profile
      const actx = new AudioContext();
      audioCtxRef.current = actx;
      const arrayBuf = await audioBlob.arrayBuffer();
      const decoded  = await actx.decodeAudioData(arrayBuf);

      const src = actx.createBufferSource();
      src.buffer = decoded;
      // Use drawing's base frequency to detune the pet sound (cents)
      const detuneCents = profile ? Math.round(((profile.baseFreq - 440) / 440) * 100) : 0;
      src.detune.value = Math.max(-1200, Math.min(1200, detuneCents));
      src.loop = true;

      const gain = actx.createGain();
      gain.gain.value = profile ? Math.min(profile.volume * 1.2, 1) : 0.8;

      // Optional reverb via convolver if profile has echo
      if (profile?.echo) {
        const convolver = actx.createConvolver();
        const irLen   = actx.sampleRate * 1.5;
        const irBuf   = actx.createBuffer(2, irLen, actx.sampleRate);
        for (let c = 0; c < 2; c++) {
          const d = irBuf.getChannelData(c);
          for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2);
        }
        convolver.buffer = irBuf;
        src.connect(gain).connect(convolver).connect(actx.destination);
      } else {
        src.connect(gain).connect(actx.destination);
      }

      src.start();

      // Record the remix to produce a downloadable URL
      const dest   = actx.createMediaStreamDestination();
      gain.connect(dest);
      const mr2    = new MediaRecorder(dest.stream);
      const chunks2: BlobPart[] = [];
      mr2.ondataavailable = e => chunks2.push(e.data);
      const duration = (profile?.duration ?? 4) * 1000 + 2000;
      mr2.onstop = () => {
        const blob2 = new Blob(chunks2, { type: "audio/webm" });
        setRemixURL(URL.createObjectURL(blob2));
        setRemixing(false);
      };
      mr2.start();
      setTimeout(() => { mr2.stop(); src.stop(); actx.close(); stopAll(); }, duration);
    } catch (err) {
      console.error(err);
      setRemixing(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ fontFamily: "'Chewy',cursive", background: "#5BC8F5" }}>

      {/* Top bar */}
      <div style={{ background: "#FFE033", borderBottom: "3px solid #1A1A1A", padding: "8px 16px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ width: "48px", height: "48px", background: drawingDataUrl ? "transparent" : "#FFFBF2", border: "3px solid #1A1A1A", borderRadius: "12px", overflow: "hidden", flexShrink: 0, boxShadow: "3px 3px 0 #1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {drawingDataUrl ? <img src={drawingDataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.4rem" }}>🎨</span>}
        </div>

        {moodResult && (
          <div style={{ background: meta.bg, border: "3px solid #1A1A1A", borderRadius: "50px", padding: "6px 16px", boxShadow: "3px 3px 0 #1A1A1A", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.4rem" }}>{moodResult.emoji}</span>
            <div>
              <div style={{ fontSize: "0.65rem", color: "#5A3A00", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your drawing says...</div>
              <div style={{ fontSize: "1rem", color: "#1A1A1A" }}>{meta.emoji} {meta.label} feels <strong>{moodResult.label}</strong></div>
            </div>
          </div>
        )}

        {recording && (
          <div style={{ background: "#FF6B8A", border: "3px solid #1A1A1A", borderRadius: "50px", padding: "4px 14px", boxShadow: "2px 2px 0 #1A1A1A", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem" }}>🔴</span><span style={{ fontSize: "0.85rem" }}>Recording...</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>

        {/* Animal selector */}
        <div style={{ width: "96px", flexShrink: 0, background: "#FFE033", borderRight: "3px solid #1A1A1A", padding: "12px 8px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
          <span style={{ fontSize: "0.65rem", color: "#1A1A1A", textAlign: "center" }}>ANIMAL</span>
          {ANIMAL_LIST.map(a => {
            const m = ANIMAL_META[a];
            const active = animal === a;
            return (
              <button key={a} onClick={() => setAnimal(a)} style={{
                width: "78px", height: "68px", borderRadius: "14px",
                background: active ? m.bg : "#FFFBF2",
                border: active ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "2px",
                boxShadow: active ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
                transform: active ? "translate(2px,2px)" : "none",
                transition: "all 0.1s", fontFamily: "'Chewy',cursive",
              }}>
                <span style={{ fontSize: "1.5rem" }}>{m.emoji}</span>
                <span style={{ fontSize: "0.6rem", color: "#1A1A1A" }}>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "3px solid #1A1A1A", background: "#5BC8F5", flexShrink: 0 }}>
            {(["record", "sound"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px", background: activeTab === tab ? "#FFFBF2" : "transparent", border: "none", borderRight: "3px solid #1A1A1A", cursor: "pointer", fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A", transition: "background 0.1s" }}>
                {tab === "record" ? "🎙️ Record your pet" : "🎨 Sound profile"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>

            {/* ── RECORD TAB ── */}
            {activeTab === "record" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Mood card */}
                {moodResult ? (
                  <div style={{ background: "#FFFBF2", border: "4px solid #1A1A1A", borderRadius: "20px", padding: "16px", boxShadow: "5px 5px 0 #1A1A1A", position: "relative" }}>
                    <div style={{ position: "absolute", top: "-14px", left: "18px", background: meta.bg, border: "3px solid #1A1A1A", borderRadius: "50px", padding: "3px 14px", fontSize: "0.75rem", color: "#1A1A1A", boxShadow: "2px 2px 0 #1A1A1A", fontFamily: "'Chewy',cursive" }}>
                      🎨 Generated from your drawing
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                      <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: meta.bg, border: "3px solid #1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", boxShadow: "3px 3px 0 #1A1A1A", flexShrink: 0 }}>
                        {moodResult.emoji}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#5A3A00", textTransform: "uppercase", letterSpacing: "0.5px" }}>Detected mood: <strong>{moodResult.label}</strong></div>
                        <div style={{ fontSize: "1rem", color: "#1A1A1A", fontStyle: "italic", marginTop: "4px" }}>"{moodResult.phrase}"</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#FFFBF2", border: "3px solid #1A1A1A", borderRadius: "16px", padding: "20px", boxShadow: "4px 4px 0 #1A1A1A", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem" }}>{isAnalyzing ? "🔍" : "🎨"}</div>
                    <div style={{ fontSize: "0.95rem", marginTop: "8px", color: "#1A1A1A" }}>
                      {isAnalyzing ? "Reading your drawing..." : "Draw something first so your pet has a mood 👀"}
                    </div>
                  </div>
                )}

                {/* Recorder card */}
                <div style={{ background: "#FFFBF2", border: "4px solid #1A1A1A", borderRadius: "20px", padding: "20px", boxShadow: "5px 5px 0 #1A1A1A" }}>
                  <div style={{ fontSize: "1rem", color: "#1A1A1A", marginBottom: "6px" }}>🎙️ Record your real {meta.label.toLowerCase()}</div>
                  <div style={{ fontSize: "0.8rem", color: "#5A3A00", marginBottom: "14px" }}>Make a noise, press record — your pet's real voice becomes the instrument.</div>

                  {/* Big record button */}
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    style={{
                      width: "100%", padding: "16px", borderRadius: "16px",
                      background: recording ? "#FF6B8A" : meta.bg,
                      border: recording ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
                      cursor: "pointer", fontFamily: "'Chewy',cursive", fontSize: "1.2rem",
                      color: "#1A1A1A", boxShadow: recording ? "2px 2px 0 #1A1A1A" : "5px 5px 0 #1A1A1A",
                      transform: recording ? "translate(2px,2px)" : "none",
                      transition: "all 0.1s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    }}>
                    <span>{recording ? "⏹" : "🔴"}</span>
                    <span>{recording ? "Stop recording" : `Record ${meta.label} sound`}</span>
                  </button>

                  {/* Playback */}
                  {audioURL && !recording && (
                    <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ fontSize: "0.85rem", color: "#1A1A1A" }}>✅ Recording captured — listen:</div>
                      <audio controls src={audioURL} style={{ width: "100%", borderRadius: "8px" }} />

                      {/* Remix button */}
                      <button
                        onClick={remixWithMelody}
                        disabled={remixing || !drawingDataUrl}
                        style={{
                          width: "100%", padding: "14px", borderRadius: "16px",
                          background: remixing ? "#DDD" : "#C06BDB",
                          border: "3px solid #1A1A1A", cursor: remixing || !drawingDataUrl ? "not-allowed" : "pointer",
                          fontFamily: "'Chewy',cursive", fontSize: "1.1rem", color: "#1A1A1A",
                          boxShadow: remixing ? "none" : "4px 4px 0 #1A1A1A",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                        }}>
                        <span>🎵</span>
                        <span>{remixing ? "Mixing..." : "Remix with my drawing's melody!"}</span>
                      </button>

                      {!drawingDataUrl && (
                        <div style={{ fontSize: "0.75rem", color: "#FF6B8A", textAlign: "center" }}>⚠️ Go to Draw first to enable remix</div>
                      )}
                    </div>
                  )}

                  {/* Remix result */}
                  {remixURL && (
                    <div style={{ marginTop: "14px", background: "#B8E04A", border: "3px solid #1A1A1A", borderRadius: "16px", padding: "14px", boxShadow: "4px 4px 0 #1A1A1A" }}>
                      <div style={{ fontSize: "0.9rem", color: "#1A1A1A", marginBottom: "8px" }}>🎉 Your pet + your drawing = this:</div>
                      <audio controls src={remixURL} style={{ width: "100%", borderRadius: "8px" }} />
                      <a
                        href={remixURL}
                        download={`${meta.label.toLowerCase()}-remix.webm`}
                        style={{ display: "inline-block", marginTop: "10px", padding: "8px 18px", borderRadius: "50px", background: "#FFFBF2", border: "3px solid #1A1A1A", fontFamily: "'Chewy',cursive", fontSize: "0.85rem", color: "#1A1A1A", boxShadow: "3px 3px 0 #1A1A1A", textDecoration: "none" }}>
                        ⬇️ Download remix
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SOUND PROFILE TAB ── */}
            {activeTab === "sound" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {!drawingDataUrl ? (
                  <div style={{ background: "#FFFBF2", border: "3px solid #1A1A1A", borderRadius: "16px", padding: "24px", boxShadow: "4px 4px 0 #1A1A1A", textAlign: "center" }}>
                    <div style={{ fontSize: "3rem" }}>🎨</div>
                    <div style={{ fontSize: "1rem", color: "#1A1A1A", marginTop: "8px" }}>Go to <strong>Draw</strong> first</div>
                  </div>
                ) : (
                  <>
                    <div style={{ background: "#FFFBF2", border: "3px solid #1A1A1A", borderRadius: "16px", padding: "16px", boxShadow: "4px 4px 0 #1A1A1A", display: "flex", gap: "16px", alignItems: "center" }}>
                      <img src={drawingDataUrl} style={{ width: "90px", height: "90px", objectFit: "cover", border: "3px solid #1A1A1A", borderRadius: "12px", boxShadow: "3px 3px 0 #1A1A1A", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        {isAnalyzing
                          ? <div style={{ background: "#FFE033", border: "2px solid #1A1A1A", borderRadius: "8px", padding: "4px 10px", fontSize: "0.8rem", color: "#1A1A1A", display: "inline-block" }}>⏳ Analyzing...</div>
                          : profile && <div style={{ background: "#B8E04A", border: "2px solid #1A1A1A", borderRadius: "8px", padding: "4px 10px", fontSize: "0.75rem", color: "#1A1A1A", display: "inline-block" }}>✅ {profile.label}</div>}
                        <div style={{ fontSize: "0.75rem", color: "#5A3A00", marginTop: "6px" }}>Every color and stroke becomes a sound property — this is how your drawing sounds.</div>
                      </div>
                    </div>

                    {profile && (
                      <div style={{ background: "#FFFBF2", border: "3px solid #1A1A1A", borderRadius: "16px", padding: "14px", boxShadow: "4px 4px 0 #1A1A1A", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontSize: "0.95rem", color: "#1A1A1A" }}>🔊 Sound Profile</span>
                        <SoundBar value={profile.baseFreq}        max={1046} color="#FF6B8A" label="🎵 Frequency" />
                        <SoundBar value={profile.volume}          max={1}    color="#FF8C42" label="🔊 Volume" />
                        <SoundBar value={profile.duration}        max={7}    color="#FFE033" label="⏱ Duration" />
                        <SoundBar value={profile.filterFreq / 100} max={84}  color="#B8E04A" label="🔷 Filter" />
                        <SoundBar value={profile.vibrato}         max={12}   color="#5BC8F5" label="🌀 Vibrato" />
                        <SoundBar value={profile.harmonics}       max={4}    color="#C06BDB" label="✨ Harmonics" />
                        {profile.echo && <span style={{ background: "#5BAEFF", border: "2px solid #1A1A1A", borderRadius: "50px", padding: "2px 10px", fontSize: "0.75rem", color: "#1A1A1A", alignSelf: "flex-start" }}>🌊 Echo active</span>}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => play(drawingDataUrl)} disabled={isPlaying || isAnalyzing} style={{ flex: 1, padding: "12px", borderRadius: "50px", background: isPlaying ? "#DDD" : "#C06BDB", border: "3px solid #1A1A1A", cursor: isPlaying ? "not-allowed" : "pointer", fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A", boxShadow: isPlaying ? "none" : "4px 4px 0 #1A1A1A" }}>
                        {isPlaying ? "🎶 Playing..." : "▶️ Play drawing sound"}
                      </button>
                      {isPlaying && <button onClick={stopAll} style={{ padding: "12px 18px", borderRadius: "50px", background: "#FF6B8A", border: "3px solid #1A1A1A", cursor: "pointer", fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A", boxShadow: "3px 3px 0 #1A1A1A" }}>⏹</button>}
                    </div>
                    <button onClick={() => analyze(drawingDataUrl!)} disabled={isAnalyzing} style={{ padding: "8px", borderRadius: "50px", background: "#FFE033", border: "3px solid #1A1A1A", cursor: "pointer", fontFamily: "'Chewy',cursive", fontSize: "0.85rem", color: "#1A1A1A", boxShadow: "3px 3px 0 #1A1A1A" }}>
                      🔄 Re-analyze drawing
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
