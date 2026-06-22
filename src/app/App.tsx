import { useState, useCallback, useRef, useEffect } from "react";
import { DrawMode }   from "./components/DrawMode";
import { PlayMode }   from "./components/PlayMode";
import { LoginScreen } from "./components/LoginScreen";
import { DailyMode }  from "./components/DailyMode";
import { ShareCard }  from "./components/ShareCard";
import { uploadDrawing, savePet, type AnimalType, type Pet } from "../lib/supabase";
import type { MelodyNote } from "./components/PlayMode";

type Screen = "daily" | "draw" | "play";

export default function App() {
  const [loggedIn,       setLoggedIn]       = useState(false);
  const [ownerName,      setOwnerName]      = useState("Tú");
  const [screen,         setScreen]         = useState<Screen>("daily");
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [melody,         setMelody]         = useState<MelodyNote[]>([]);
  const [sharedDoodleId, setSharedDoodleId] = useState<string | null>(null);

  const stopMelodyRef = useRef<(() => void) | null>(null);

  // Detect ?doodle=<id> in URL and show ShareCard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("doodle");
    if (id) setSharedDoodleId(id);
  }, []);

  const handleLogin = (name: string) => {
    setOwnerName(name || "Tú");
    setLoggedIn(true);
  };

  const handleSaveDrawing = useCallback((url: string) => {
    setDrawingDataUrl(url);
  }, []);

  const goTo = (s: Screen) => {
    stopMelodyRef.current?.();
    setScreen(s);
  };

  // If there's a shared doodle in the URL, show ShareCard directly (no login needed)
  if (sharedDoodleId) {
    return (
      <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", overflow:"hidden", background:"#5BC8F5", fontFamily:"'Chewy',cursive" }}>
        <header style={{ flexShrink:0, background:"#FFE033", borderBottom:"3px solid #1A1A1A", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"#FF8C42", border:"3px solid #1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", boxShadow:"2px 2px 0 #1A1A1A" }}>🎨</div>
            <span style={{ fontSize:"1rem", color:"#1A1A1A" }}>Doodio</span>
          </div>
          <button
            onClick={() => { setSharedDoodleId(null); window.history.replaceState({}, "", "/"); }}
            style={{ padding:"6px 16px", borderRadius:"50px", background:"#B8E04A", border:"3px solid #1A1A1A", cursor:"pointer", fontFamily:"'Chewy',cursive", fontSize:"0.85rem", color:"#1A1A1A", boxShadow:"3px 3px 0 #1A1A1A", touchAction:"manipulation" }}>
            🎨 Make yours!
          </button>
        </header>
        <ShareCard id={sharedDoodleId} />
      </div>
    );
  }

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const TABS: { id: Screen; label: string }[] = [
    { id: "daily", label: "🎯 Daily" },
    { id: "draw",  label: "🎨 Draw"  },
    { id: "play",  label: "🎵 Listen" },
  ];

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", overflow:"hidden", background:"#5BC8F5", fontFamily:"'Chewy', cursive" }}>
      <header style={{ flexShrink:0, background:"#FFE033", borderBottom:"3px solid #1A1A1A", boxShadow:"0 3px 0 #1A1A1A", padding:"6px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
          <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"#FF8C42", border:"3px solid #1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", boxShadow:"2px 2px 0 #1A1A1A" }}>🎨</div>
          <div>
            <div style={{ fontSize:"1rem", color:"#1A1A1A", fontFamily:"'Chewy'", lineHeight:1 }}>Doodio</div>
            <div style={{ fontSize:"0.58rem", color:"#5A3A00", fontFamily:"'Chewy'", lineHeight:1 }}>Hi, {ownerName} 👋</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => goTo(t.id)} style={{ padding:"6px 14px", borderRadius:"50px", background: screen===t.id ? "#FF8C42" : "#FFFBF2", border: screen===t.id ? "3px solid #1A1A1A" : "2px solid #1A1A1A", color:"#1A1A1A", cursor:"pointer", fontFamily:"'Chewy'", fontSize:"0.85rem", boxShadow:"2px 2px 0 #1A1A1A", transform: screen===t.id ? "translate(1px,1px)" : "none", whiteSpace:"nowrap", touchAction:"manipulation" }}>
              {t.label}
            </button>
          ))}
        </div>
        {/* spacer for symmetry */}
        <div style={{ width: 34, flexShrink: 0 }} />
      </header>
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {screen === "daily" && <DailyMode onMelodyReady={setMelody} ownerName={ownerName} />}
        {screen === "draw"  && <DrawMode onSaveDrawing={handleSaveDrawing} onGoToListen={() => goTo("play")} hasDrawing={!!drawingDataUrl} />}
        {screen === "play"  && <PlayMode drawingDataUrl={drawingDataUrl} onMelodyReady={setMelody} onStopRef={stopMelodyRef} />}
      </div>
    </div>
  );
}
