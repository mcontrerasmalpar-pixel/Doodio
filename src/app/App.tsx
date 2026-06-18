import { useState, useCallback } from "react";
import { DrawMode }     from "./components/DrawMode";
import { PlayMode }     from "./components/PlayMode";
import { PetProfile }   from "./components/PetProfile";
import { SavePetModal } from "./components/SavePetModal";
import { LoginScreen }  from "./components/LoginScreen";
import { uploadDrawing, savePet, type AnimalType, type Pet } from "../lib/supabase";
import type { MelodyNote } from "./components/PlayMode";

type Screen = "draw" | "play" | "profile";

export default function App() {
  const [loggedIn,       setLoggedIn]       = useState(false);
  const [ownerName,      setOwnerName]      = useState("Tú");
  const [screen,         setScreen]         = useState<Screen>("draw");
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [showSaveModal,  setShowSaveModal]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [savedPet,       setSavedPet]       = useState<Pet | null>(null);
  const [melody,         setMelody]         = useState<MelodyNote[]>([]);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [playTrigger,    setPlayTrigger]    = useState(0);

  const handleLogin = (name: string) => {
    setOwnerName(name || "Tú");
    setLoggedIn(true);
  };

  // Only saves the dataUrl in memory — does NOT switch screen
  const handleSaveDrawing = useCallback((url: string) => {
    setDrawingDataUrl(url);
  }, []);

  const handleSavePet = async (name: string, animal: AnimalType) => {
    setSaving(true);
    try {
      const drawingUrl = drawingDataUrl
        ? await uploadDrawing(drawingDataUrl, name)
        : null;
      const pet = await savePet({
        name, animal_type: animal,
        owner_name: ownerName,
        drawing_url: drawingUrl,
        melody_json: melody,
      });
      if (pet) {
        setSavedPet(pet);
        setShowSaveModal(false);
        setScreen("profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const TABS = [
    { id: "draw"    as Screen, label: "🎨 Dibujar" },
    { id: "play"    as Screen, label: "🎵 Escuchar", locked: false },
    { id: "profile" as Screen, label: "🐾 Perfil",   locked: !savedPet },
  ];

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "#5BC8F5",
      fontFamily: "'Chewy', cursive",
    }}>
      {showSaveModal && drawingDataUrl && (
        <SavePetModal
          drawingDataUrl={drawingDataUrl}
          ownerName={ownerName}
          onSave={handleSavePet}
          onClose={() => setShowSaveModal(false)}
          saving={saving}
        />
      )}

      {/* Header */}
      <header style={{
        flexShrink: 0,
        background: "#FFE033",
        borderBottom: "3px solid #1A1A1A",
        boxShadow: "0 3px 0 #1A1A1A",
        padding: "6px 12px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        gap: "8px", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "#FF8C42", border: "3px solid #1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", boxShadow: "2px 2px 0 #1A1A1A",
          }}>🐾</div>
          <div>
            <div style={{ fontSize: "1rem", color: "#1A1A1A", fontFamily: "'Chewy'", lineHeight: 1 }}>Pet Melody</div>
            <div style={{ fontSize: "0.6rem", color: "#5A3A00", fontFamily: "'Chewy'" }}>dibuja · escucha · guarda 🎵</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => !t.locked && setScreen(t.id)}
              style={{
                padding: "6px 14px", borderRadius: "50px",
                background: screen === t.id ? "#FF8C42" : t.locked ? "#E8E0C8" : "#FFFBF2",
                border: screen === t.id ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
                color: t.locked ? "#AAA" : "#1A1A1A",
                cursor: t.locked ? "not-allowed" : "pointer",
                fontFamily: "'Chewy'", fontSize: "0.85rem",
                boxShadow: screen === t.id ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
                transform: screen === t.id ? "translate(1px,1px)" : "none",
              }}
            >{t.label}{t.locked ? " 🔒" : ""}</button>
          ))}
        </div>

        <button
          onClick={() => drawingDataUrl && setShowSaveModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: savedPet ? "#B8E04A" : "#FFFBF2",
            border: "3px solid #1A1A1A", borderRadius: "50px",
            padding: "4px 12px", boxShadow: "3px 3px 0 #1A1A1A",
            cursor: drawingDataUrl ? "pointer" : "default",
            fontFamily: "'Chewy'", flexShrink: 0,
          }}
        >
          {drawingDataUrl
            ? <img src={drawingDataUrl} style={{ width: "22px", height: "22px", borderRadius: "4px", border: "2px solid #1A1A1A", objectFit: "cover" }} />
            : <span style={{ fontSize: "0.95rem" }}>🐱</span>
          }
          <span style={{ fontSize: "0.8rem", color: "#1A1A1A" }}>
            {savedPet ? `${savedPet.name} ✅` : "Guardar"}
          </span>
        </button>
      </header>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {screen === "draw" && (
          <DrawMode
            onSaveDrawing={handleSaveDrawing}
            onGoToListen={() => setScreen("play")}
            hasDrawing={!!drawingDataUrl}
          />
        )}
        {screen === "play" && (
          <PlayMode
            drawingDataUrl={drawingDataUrl}
            onMelodyReady={setMelody}
            onPlayingChange={setIsPlaying}
            externalPlayTrigger={playTrigger}
            onSavePet={() => setShowSaveModal(true)}
            savedPet={savedPet}
          />
        )}
        {screen === "profile" && (
          <PetProfile
            currentPet={savedPet}
            melody={melody}
            onPlayMelody={() => { setScreen("play"); setPlayTrigger(p => p + 1); }}
            isPlaying={isPlaying}
          />
        )}
      </div>

      <div style={{
        flexShrink: 0, height: "28px",
        background: "#B8E04A", borderTop: "3px solid #1A1A1A",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      }}>
        {["1 · Dibuja 🎨", "→", "2 · Escucha 🎵", "→", "3 · Guarda 🐾"].map((t, i) => (
          <span key={i} style={{ fontSize: "0.75rem", color: "#1A1A1A", fontFamily: "'Chewy'", opacity: i % 2 === 1 ? 0.4 : 1 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
