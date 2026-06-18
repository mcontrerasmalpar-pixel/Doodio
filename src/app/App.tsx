import { useState } from "react";
import { DrawMode } from "./components/DrawMode";
import { PlayMode } from "./components/PlayMode";
import { VoiceMode } from "./components/VoiceMode";
import { LoginScreen } from "./components/LoginScreen";

type Screen = "draw" | "play" | "voice";

export default function App() {
  const [screen, setScreen] = useState<Screen>("draw");
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [petName, setPetName] = useState("Mochi");

  if (!loggedIn) {
    return (
      <LoginScreen
        onLogin={(name) => {
          setPetName(name);
          setLoggedIn(true);
        }}
      />
    );
  }

  const TABS: { id: Screen; label: string }[] = [
    { id: "draw",  label: "🎨 Draw"  },
    { id: "play",  label: "🎵 Play"  },
    { id: "voice", label: "🔊 Voice" },
  ];

  return (
    <div
      className="size-full flex flex-col overflow-hidden"
      style={{
        background: "#5BC8F5",
        fontFamily: "'Chewy', 'Caveat', cursive",
        position: "relative",
      }}
    >
      {/* Floating bg doodles */}
      {[
        { e: "🎵", top: "8%",  left: "4%",  size: "1.6rem", rot: "15deg",  op: 0.45 },
        { e: "🐾", top: "15%", left: "92%", size: "1.4rem", rot: "-10deg", op: 0.4  },
        { e: "✦",  top: "5%",  left: "55%", size: "1.2rem", rot: "20deg",  op: 0.35 },
        { e: "🎵", top: "72%", left: "88%", size: "1.3rem", rot: "-18deg", op: 0.35 },
        { e: "⭐", top: "80%", left: "6%",  size: "1.1rem", rot: "8deg",   op: 0.4  },
        { e: "🐾", top: "60%", left: "2%",  size: "1rem",   rot: "12deg",  op: 0.3  },
      ].map((d, i) => (
        <span key={i} style={{
          position: "fixed", fontSize: d.size, top: d.top, left: d.left,
          transform: `rotate(${d.rot})`, opacity: d.op, pointerEvents: "none", zIndex: 0,
        }}>{d.e}</span>
      ))}

      {/* ── Header ── */}
      <header style={{
        background: "#FFE033",
        borderBottom: "3px solid #1A1A1A",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
        boxShadow: "0 3px 0 #1A1A1A",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: "#FF8C42", border: "3px solid #1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem", boxShadow: "2px 2px 0 #1A1A1A",
          }}>🐾</div>
          <div>
            <h1 style={{
              fontSize: "1.4rem", margin: 0, color: "#1A1A1A",
              fontFamily: "'Chewy', cursive", lineHeight: 1.1, letterSpacing: "0.5px",
            }}>Pet Voice Synthesizer</h1>
            <p style={{
              fontSize: "0.75rem", margin: 0, color: "#5A3A00",
              fontFamily: "'Chewy', cursive",
            }}>draw · play · speak 🎵</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {TABS.map((t) => {
            const isActive = screen === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setScreen(t.id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "50px",
                  background: isActive ? "#FF8C42" : "#FFFBF2",
                  border: "3px solid #1A1A1A",
                  color: "#1A1A1A",
                  cursor: "pointer",
                  fontFamily: "'Chewy', cursive",
                  fontSize: "1rem",
                  boxShadow: isActive ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
                  transform: isActive ? "translate(1px,1px)" : "none",
                  transition: "all 0.1s",
                }}
              >{t.label}</button>
            );
          })}
        </div>

        {/* Pet chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#B8E04A", border: "3px solid #1A1A1A",
          borderRadius: "50px", padding: "5px 14px",
          boxShadow: "3px 3px 0 #1A1A1A",
        }}>
          <span style={{ fontSize: "1.2rem" }}>🐱</span>
          <span style={{ fontFamily: "'Chewy', cursive", fontSize: "0.95rem", color: "#1A1A1A" }}>{petName}</span>
        </div>
      </header>

      {/* ── Screens ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ position: "relative", zIndex: 1 }}>
        {screen === "draw"  && <DrawMode  onSaveDrawing={setDrawingDataUrl} />}
        {screen === "play"  && <PlayMode  drawingDataUrl={drawingDataUrl}   />}
        {screen === "voice" && <VoiceMode drawingDataUrl={drawingDataUrl}   />}
      </div>

      {/* ── Footer ── */}
      <div style={{
        height: "44px", flexShrink: 0,
        background: "#B8E04A", borderTop: "3px solid #1A1A1A",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "24px",
        boxShadow: "0 -2px 0 #1A1A1A",
      }}>
        {["1 · Draw 🎨", "→", "2 · Play 🎵", "→", "3 · Voice 🔊"].map((t, i) => (
          <span key={i} style={{
            fontSize: "0.9rem", color: "#1A1A1A",
            fontFamily: "'Chewy', cursive",
            opacity: i % 2 === 1 ? 0.5 : 1,
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
