import { useState } from "react";
import {
  usePetVoice,
  PRESET_META,
  PetVoicePreset,
} from "../../hooks/usePetVoice";

const PRESETS_LIST: PetVoicePreset[] = [
  "cat", "dog", "bird", "frog", "robot", "ghost", "baby", "giant",
];

const QUICK_PHRASES = [
  "¡Hola! Soy tu mascota favorita",
  "¡Quiero comida ahora mismo!",
  "Juguemos juntos por favor",
  "Estoy muy feliz hoy",
  "¡Miau miau! ¿Me das un abrazo?",
  "Zzzz... tengo mucho sueño",
];

export function VoiceMode({ drawingDataUrl }: { drawingDataUrl: string | null }) {
  const {
    config, updateConfig, applyPreset,
    speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    transcript, setTranscript,
    error,
  } = usePetVoice();

  const [inputText, setInputText] = useState("");
  const meta = PRESET_META[config.preset];

  const handleSpeak = () => speak(inputText || transcript || "¡Hola!");

  // Slider style helper
  const sliderStyle: React.CSSProperties = {
    width: "100%",
    accentColor: meta.bg,
    cursor: "pointer",
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Chewy', cursive", background: "#5BC8F5" }}
    >
      {/* ── Top bar ── */}
      <div style={{
        background: "#FFE033",
        borderBottom: "3px solid #1A1A1A",
        padding: "10px 20px",
        display: "flex", alignItems: "center", gap: "14px",
        flexShrink: 0,
      }}>
        {/* Pet mini */}
        <div style={{
          width: "52px", height: "52px",
          background: drawingDataUrl ? "transparent" : "#FFFBF2",
          border: "3px solid #1A1A1A", borderRadius: "12px",
          overflow: "hidden", flexShrink: 0,
          boxShadow: "3px 3px 0 #1A1A1A",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {drawingDataUrl
            ? <img src={drawingDataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "1.5rem" }}>🎨</span>
          }
        </div>

        {/* Active preset badge */}
        <div style={{
          background: meta.bg, border: "3px solid #1A1A1A",
          borderRadius: "50px", padding: "6px 18px",
          boxShadow: "3px 3px 0 #1A1A1A",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "1.8rem" }}>{meta.emoji}</span>
          <div>
            <div style={{ fontSize: "1.1rem", color: "#1A1A1A" }}>Voz: {meta.label}</div>
            <div style={{ fontSize: "0.7rem", color: "#5A3A00" }}>
              tono {config.pitch.toFixed(1)} · velocidad {config.rate.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div style={{
            background: "#FF6B8A", border: "3px solid #1A1A1A",
            borderRadius: "50px", padding: "5px 14px",
            boxShadow: "2px 2px 0 #1A1A1A",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ fontSize: "1rem" }}>🔊</span>
            <span style={{ fontSize: "0.9rem", color: "#1A1A1A" }}>Hablando...</span>
          </div>
        )}

        {isListening && (
          <div style={{
            background: "#B8E04A", border: "3px solid #1A1A1A",
            borderRadius: "50px", padding: "5px 14px",
            boxShadow: "2px 2px 0 #1A1A1A",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ fontSize: "1rem" }}>🎤</span>
            <span style={{ fontSize: "0.9rem", color: "#1A1A1A" }}>Escuchando...</span>
          </div>
        )}

        {error && (
          <div style={{
            background: "#FF6B8A", border: "2px solid #1A1A1A",
            borderRadius: "8px", padding: "4px 12px",
          }}>
            <span style={{ fontSize: "0.8rem", color: "#1A1A1A" }}>{error}</span>
          </div>
        )}
      </div>

      {/* ── Main body ── */}
      <div style={{
        flex: 1, display: "flex", gap: "0",
        overflow: "hidden",
      }}>

        {/* Left: preset selector */}
        <div style={{
          width: "100px", flexShrink: 0,
          background: "#FFE033",
          borderRight: "3px solid #1A1A1A",
          padding: "14px 8px",
          display: "flex", flexDirection: "column", gap: "8px",
          overflowY: "auto",
        }}>
          <span style={{ fontSize: "0.7rem", color: "#1A1A1A", textAlign: "center" }}>VOZ</span>
          {PRESETS_LIST.map(p => {
            const m = PRESET_META[p];
            const active = config.preset === p;
            return (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                style={{
                  width: "80px", height: "72px",
                  borderRadius: "16px",
                  background: active ? m.bg : "#FFFBF2",
                  border: active ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "2px",
                  boxShadow: active ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
                  transform: active ? "translate(2px,2px)" : "none",
                  transition: "all 0.1s",
                  fontFamily: "'Chewy',cursive",
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>{m.emoji}</span>
                <span style={{ fontSize: "0.65rem", color: "#1A1A1A" }}>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: input + speech */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          gap: "12px", padding: "16px",
          overflowY: "auto",
        }}>

          {/* Text input card */}
          <div style={{
            background: "#FFFBF2",
            border: "3px solid #1A1A1A",
            borderRadius: "16px",
            padding: "14px",
            boxShadow: "4px 4px 0 #1A1A1A",
          }}>
            <div style={{ marginBottom: "8px", fontSize: "1rem", color: "#1A1A1A" }}>
              ✏️ ¿Qué dice tu mascota?
            </div>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Escribe algo para que ${meta.label} lo diga...`}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "3px solid #1A1A1A",
                borderRadius: "12px",
                background: "#FFF8E8",
                fontFamily: "'Chewy', cursive",
                fontSize: "1rem",
                color: "#1A1A1A",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "2px 2px 0 #1A1A1A",
              }}
            />

            {/* Transcript from mic */}
            {transcript && !inputText && (
              <div style={{
                marginTop: "6px", padding: "8px 12px",
                background: "#B8E04A", border: "2px solid #1A1A1A",
                borderRadius: "8px",
                fontSize: "0.9rem", color: "#1A1A1A",
              }}>
                🎤 <em>{transcript}</em>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                style={{
                  flex: 1, minWidth: "120px",
                  padding: "10px 16px",
                  borderRadius: "50px",
                  background: isSpeaking ? "#DDD" : meta.bg,
                  border: "3px solid #1A1A1A",
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A",
                  boxShadow: isSpeaking ? "none" : "4px 4px 0 #1A1A1A",
                  transition: "all 0.1s",
                }}
                onMouseDown={e => { if (!isSpeaking) { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "2px 2px 0 #1A1A1A"; }}}
                onMouseUp={e =>   { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isSpeaking ? "none" : "4px 4px 0 #1A1A1A"; }}
              >
                {isSpeaking ? "🔊 Hablando..." : `${meta.emoji} ¡Hablar!`}
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  style={{
                    padding: "10px 16px", borderRadius: "50px",
                    background: "#FF6B8A", border: "3px solid #1A1A1A",
                    cursor: "pointer", fontFamily: "'Chewy',cursive",
                    fontSize: "1rem", color: "#1A1A1A",
                    boxShadow: "3px 3px 0 #1A1A1A",
                  }}
                >⏹ Stop</button>
              )}

              <button
                onClick={isListening ? stopListening : startListening}
                style={{
                  flex: 1, minWidth: "120px",
                  padding: "10px 16px",
                  borderRadius: "50px",
                  background: isListening ? "#B8E04A" : "#5BC8F5",
                  border: isListening ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
                  cursor: "pointer",
                  fontFamily: "'Chewy',cursive", fontSize: "1rem", color: "#1A1A1A",
                  boxShadow: isListening ? "2px 2px 0 #1A1A1A" : "4px 4px 0 #1A1A1A",
                  transform: isListening ? "translate(1px,1px)" : "none",
                  transition: "all 0.1s",
                }}
              >
                {isListening ? "🔴 Parar mic" : "🎤 Hablar al mic"}
              </button>
            </div>
          </div>

          {/* Quick phrases */}
          <div style={{
            background: "#FFFBF2",
            border: "3px solid #1A1A1A",
            borderRadius: "16px",
            padding: "14px",
            boxShadow: "4px 4px 0 #1A1A1A",
          }}>
            <div style={{ marginBottom: "10px", fontSize: "0.95rem", color: "#1A1A1A" }}>⚡ Frases rápidas</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {QUICK_PHRASES.map(phrase => (
                <button
                  key={phrase}
                  onClick={() => { setInputText(phrase); speak(phrase); }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "50px",
                    background: "#FFFBF2",
                    border: "3px solid #1A1A1A",
                    cursor: "pointer",
                    fontFamily: "'Chewy',cursive",
                    fontSize: "0.85rem",
                    color: "#1A1A1A",
                    boxShadow: "3px 3px 0 #1A1A1A",
                    transition: "all 0.1s",
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1A1A1A"; }}
                  onMouseUp={e =>   { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1A1A1A"; }}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: voice controls */}
        <div style={{
          width: "200px", flexShrink: 0,
          background: "#B8E04A",
          borderLeft: "3px solid #1A1A1A",
          padding: "16px 14px",
          display: "flex", flexDirection: "column", gap: "16px",
          overflowY: "auto",
        }}>
          <span style={{ fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>🎛️ Ajustes de voz</span>

          {/* Pitch */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#1A1A1A" }}>🎵 Tono</span>
              <span style={{
                background: meta.bg, border: "2px solid #1A1A1A",
                borderRadius: "50px", padding: "1px 8px",
                fontSize: "0.75rem", color: "#1A1A1A",
              }}>{config.pitch.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="4" step="0.1"
              value={config.pitch}
              onChange={e => updateConfig({ pitch: parseFloat(e.target.value) })}
              style={sliderStyle}
            />
          </div>

          {/* Rate */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#1A1A1A" }}>⚡ Velocidad</span>
              <span style={{
                background: meta.bg, border: "2px solid #1A1A1A",
                borderRadius: "50px", padding: "1px 8px",
                fontSize: "0.75rem", color: "#1A1A1A",
              }}>{config.rate.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="2" step="0.1"
              value={config.rate}
              onChange={e => updateConfig({ rate: parseFloat(e.target.value) })}
              style={sliderStyle}
            />
          </div>

          {/* Pitch shift */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#1A1A1A" }}>🔼 Shifter</span>
              <span style={{
                background: meta.bg, border: "2px solid #1A1A1A",
                borderRadius: "50px", padding: "1px 8px",
                fontSize: "0.75rem", color: "#1A1A1A",
              }}>{config.pitchShift > 0 ? "+" : ""}{config.pitchShift}</span>
            </div>
            <input
              type="range" min="-12" max="12" step="1"
              value={config.pitchShift}
              onChange={e => updateConfig({ pitchShift: parseInt(e.target.value) })}
              style={sliderStyle}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {([
              { key: "robotize" as const, emoji: "🤖", label: "Robotizar" },
              { key: "echo"     as const, emoji: "🌊", label: "Eco/Reverb" },
            ] as const).map(({ key, emoji, label }) => (
              <button
                key={key}
                onClick={() => updateConfig({ [key]: !config[key] })}
                style={{
                  width: "100%", padding: "8px",
                  borderRadius: "12px",
                  background: config[key] ? meta.bg : "#FFFBF2",
                  border: config[key] ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
                  cursor: "pointer",
                  fontFamily: "'Chewy',cursive", fontSize: "0.9rem", color: "#1A1A1A",
                  boxShadow: config[key] ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
                  transform: config[key] ? "translate(1px,1px)" : "none",
                  transition: "all 0.1s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
                  {config[key] ? "ON" : "OFF"}
                </span>
              </button>
            ))}
          </div>

          {/* Reset to preset */}
          <button
            onClick={() => applyPreset(config.preset)}
            style={{
              width: "100%", padding: "8px",
              borderRadius: "12px",
              background: "#FF6B8A",
              border: "3px solid #1A1A1A",
              cursor: "pointer",
              fontFamily: "'Chewy',cursive", fontSize: "0.85rem", color: "#1A1A1A",
              boxShadow: "3px 3px 0 #1A1A1A",
              transition: "all 0.1s",
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1A1A1A"; }}
            onMouseUp={e =>   { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1A1A1A"; }}
          >
            🔄 Reset preset
          </button>
        </div>
      </div>
    </div>
  );
}
