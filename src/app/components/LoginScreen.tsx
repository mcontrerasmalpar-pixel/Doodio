import { useState } from "react";

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = () => {
    const name = username.trim();
    if (!name) { setError("Enter your name first! 🤔"); return; }
    onLogin(name);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    borderRadius: "14px", border: "3px solid #1A1A1A",
    background: "#FFFBF2", fontFamily: "'Chewy', cursive",
    fontSize: "1.1rem", color: "#1A1A1A", outline: "none",
    boxSizing: "border-box", boxShadow: "2px 2px 0 #1A1A1A",
    textAlign: "center",
  };

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "#5BC8F5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Chewy', cursive",
      position: "relative", overflow: "hidden",
    }}>
      {/* Floating bg elements */}
      {[
        { e: "🎵", top: "8%",  left: "8%",  size: "2rem",   rot: "15deg",  op: 0.5 },
        { e: "🎨", top: "12%", left: "82%", size: "1.8rem", rot: "-12deg", op: 0.45 },
        { e: "✶",  top: "6%",  left: "50%", size: "1.5rem", rot: "20deg",  op: 0.4 },
        { e: "🎶", top: "78%", left: "85%", size: "1.6rem", rot: "-15deg", op: 0.4 },
        { e: "⭐", top: "82%", left: "10%", size: "1.4rem", rot: "8deg",   op: 0.45 },
        { e: "✏️", top: "65%", left: "4%",  size: "1.2rem", rot: "12deg",  op: 0.35 },
        { e: "🎶", top: "25%", left: "90%", size: "1.4rem", rot: "-8deg",  op: 0.4 },
        { e: "✶",  top: "70%", left: "92%", size: "1rem",   rot: "25deg",  op: 0.35 },
      ].map((d, i) => (
        <span key={i} style={{
          position: "absolute", fontSize: d.size, top: d.top, left: d.left,
          transform: `rotate(${d.rot})`, opacity: d.op, pointerEvents: "none",
        }}>{d.e}</span>
      ))}

      {/* Green hill */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
        background: "#B8E04A", borderTop: "3px solid #1A1A1A",
        borderRadius: "60% 60% 0 0 / 30px 30px 0 0",
      }} />

      {/* Card */}
      <div style={{
        background: "#FFE033",
        borderRadius: "60% 40% 55% 45% / 45% 55% 40% 60%",
        border: "4px solid #1A1A1A",
        padding: "44px 40px 40px",
        width: "320px",
        boxShadow: "6px 6px 0 #1A1A1A",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
        position: "relative", zIndex: 2,
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "#FF8C42", border: "4px solid #1A1A1A",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", boxShadow: "3px 3px 0 #1A1A1A", marginBottom: "4px",
        }}>🎨</div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", color: "#1A1A1A", fontFamily: "'Chewy', cursive", letterSpacing: "1px" }}>
            Doodio
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#5A3A00", fontFamily: "'Chewy', cursive" }}>
            Doodle it. Hear it. 👋
          </p>
        </div>

        <input
          style={inputStyle}
          placeholder="Your name..."
          value={username}
          maxLength={20}
          onChange={e => { setUsername(e.target.value); setError(null); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          autoFocus
        />

        {error && (
          <div style={{
            width: "100%", padding: "8px 12px",
            background: "#FF6B8A", border: "3px solid #1A1A1A",
            borderRadius: "12px", boxShadow: "2px 2px 0 #1A1A1A",
            fontSize: "0.85rem", color: "#1A1A1A", textAlign: "center",
          }}>{❌} {error}</div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "13px", borderRadius: "50px",
            background: "#FF8C42",
            border: "3px solid #1A1A1A", color: "#1A1A1A",
            fontFamily: "'Chewy', cursive", fontSize: "1.2rem",
            cursor: "pointer",
            boxShadow: "4px 4px 0 #1A1A1A",
            transition: "all 0.1s",
            touchAction: "manipulation",
          }}
          onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "2px 2px 0 #1A1A1A"; }}
          onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "4px 4px 0 #1A1A1A"; }}
        >
          Let’s go! 🎨
        </button>
      </div>
    </div>
  );
}
