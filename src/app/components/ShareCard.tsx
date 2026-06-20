import { useEffect, useState, useRef } from "react";
import { fetchDailyDoodle, type DailyDoodle } from "../../lib/supabase";
import { generateMelody, PlayMode } from "./PlayMode";
import type { MelodyNote } from "./PlayMode";

// Shown when someone opens ?doodle=<id>
export function ShareCard({ id }: { id: string }) {
  const [doodle, setDoodle]   = useState<DailyDoodle | null>(null);
  const [loading, setLoading] = useState(true);
  const [melody,  setMelody]  = useState<MelodyNote[]>([]);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchDailyDoodle(id).then(d => {
      setDoodle(d);
      setLoading(false);
      if (d?.melody_json) setMelody(d.melody_json as MelodyNote[]);
    });
    return () => stopRef.current?.();
  }, [id]);

  if (loading) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, fontFamily:"'Chewy',cursive", background:"#5BC8F5" }}>
      <span style={{ fontSize:"2rem" }}>⏳</span>
      <span style={{ fontSize:"1rem", color:"#1A1A1A" }}>Loading doodle...</span>
    </div>
  );

  if (!doodle) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, fontFamily:"'Chewy',cursive", background:"#5BC8F5" }}>
      <span style={{ fontSize:"2rem" }}>🕵️</span>
      <span style={{ fontSize:"1rem", color:"#1A1A1A" }}>Doodle not found</span>
      <a href="/" style={{ padding:"8px 20px", borderRadius:"50px", background:"#B8E04A", border:"3px solid #1A1A1A", fontFamily:"'Chewy',cursive", fontSize:"0.9rem", color:"#1A1A1A", boxShadow:"3px 3px 0 #1A1A1A", textDecoration:"none" }}>
        🎨 Make yours!
      </a>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#FFE033", fontFamily:"'Chewy',cursive" }}>
      {/* Header */}
      <div style={{ background:"#FF8C42", borderBottom:"3px solid #1A1A1A", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"#FFE033", border:"3px solid #1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", boxShadow:"2px 2px 0 #1A1A1A" }}>🎨</div>
          <span style={{ fontSize:"1rem", color:"#1A1A1A" }}>Doodio Daily</span>
        </div>
        <span style={{ fontSize:"0.7rem", color:"#1A1A1A", opacity:0.7 }}>{doodle.day}</span>
      </div>

      {/* Prompt */}
      <div style={{ padding:"12px 16px", background:"#FFFBF2", borderBottom:"3px solid #1A1A1A", textAlign:"center" }}>
        <div style={{ fontSize:"0.7rem", color:"#555", marginBottom:4 }}>Today's prompt</div>
        <div style={{ fontSize:"1.1rem", color:"#1A1A1A" }}>&ldquo;{doodle.prompt}&rdquo;</div>
      </div>

      {/* Drawing + PlayMode */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {doodle.drawing_url ? (
          <PlayMode
            drawingDataUrl={doodle.drawing_url}
            onMelodyReady={setMelody}
            onStopRef={stopRef}
          />
        ) : (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"0.9rem", color:"#555" }}>No drawing saved</span>
          </div>
        )}
      </div>

      {/* Author + CTA */}
      <div style={{ flexShrink:0, background:"#FFFBF2", borderTop:"3px solid #1A1A1A", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div>
          <div style={{ fontSize:"0.7rem", color:"#555" }}>drawn by</div>
          <div style={{ fontSize:"1rem", color:"#1A1A1A" }}>{doodle.owner_name}</div>
        </div>
        <a
          href={`/?prompt=1`}
          style={{ padding:"10px 20px", borderRadius:"50px", background:"#B8E04A", border:"3px solid #1A1A1A", fontFamily:"'Chewy',cursive", fontSize:"0.95rem", color:"#1A1A1A", boxShadow:"4px 4px 0 #1A1A1A", textDecoration:"none", display:"flex", alignItems:"center", gap:6, touchAction:"manipulation" }}>
          <span>🎨</span><span>Make yours!</span>
        </a>
      </div>
    </div>
  );
}
