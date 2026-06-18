import { useRef, useState, useCallback, useEffect } from "react";

const CRAYON_COLORS = [
  { name: "Cherry",  color: "#FF6B8A" },
  { name: "Ocean",   color: "#5BAEFF" },
  { name: "Mint",    color: "#5FD49A" },
  { name: "Grape",   color: "#C06BDB" },
  { name: "Sun",     color: "#FFD06B" },
  { name: "Coral",   color: "#FF8C6B" },
  { name: "Teal",    color: "#5BD4D2" },
  { name: "Dark",    color: "#3A3A3A" },
];

const BRUSH_SIZES = [
  { label: "S", size: 6  },
  { label: "M", size: 14 },
  { label: "L", size: 24 },
];

interface DrawModeProps {
  onSaveDrawing: (dataUrl: string) => void;
}

export function DrawMode({ onSaveDrawing }: DrawModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState(CRAYON_COLORS[0].color);
  const [brushSize, setBrushSize] = useState(1); // index into BRUSH_SIZES

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFBF2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // dot grid
    ctx.fillStyle = "rgba(100,100,100,0.12)";
    for (let y = 20; y < canvas.height; y += 20) {
      for (let x = 20; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, BRUSH_SIZES[brushSize].size / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [color, brushSize]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = BRUSH_SIZES[brushSize].size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setLastPos(pos);
  }, [isDrawing, lastPos, color, brushSize]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSaveDrawing(canvas.toDataURL());
  }, [onSaveDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFBF2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(100,100,100,0.12)";
    for (let y = 20; y < canvas.height; y += 20) {
      for (let x = 20; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    onSaveDrawing(canvas.toDataURL());
  };

  return (
    <div className="flex-1 flex gap-0 overflow-hidden" style={{ fontFamily: "'Chewy', cursive" }}>

      {/* ── Left sidebar: tools ── */}
      <div style={{
        width: "72px", flexShrink: 0,
        background: "#FFE033",
        borderRight: "3px solid #1A1A1A",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: "12px",
        padding: "16px 0",
      }}>
        {/* Brush sizes */}
        <span style={{ fontSize: "0.7rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>SIZE</span>
        {BRUSH_SIZES.map((b, i) => (
          <button
            key={b.label}
            onClick={() => setBrushSize(i)}
            style={{
              width: `${18 + i * 8}px`, height: `${18 + i * 8}px`,
              borderRadius: "50%",
              background: brushSize === i ? color : "#FFFBF2",
              border: `3px solid #1A1A1A`,
              cursor: "pointer",
              boxShadow: brushSize === i ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
              transform: brushSize === i ? "translate(1px,1px)" : "none",
              transition: "all 0.1s",
            }}
          />
        ))}

        {/* Divider */}
        <div style={{ width: "48px", height: "3px", background: "#1A1A1A", borderRadius: "2px" }} />

        {/* Color swatches */}
        <span style={{ fontSize: "0.7rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>COLOR</span>
        {CRAYON_COLORS.map((c) => (
          <button
            key={c.color}
            title={c.name}
            onClick={() => setColor(c.color)}
            style={{
              width: "36px", height: "36px",
              borderRadius: "50%",
              background: c.color,
              border: color === c.color ? "4px solid #1A1A1A" : "3px solid #1A1A1A",
              cursor: "pointer",
              boxShadow: color === c.color ? "2px 2px 0 #1A1A1A" : "3px 3px 0 #1A1A1A",
              transform: color === c.color ? "translate(1px,1px) scale(1.1)" : "none",
              transition: "all 0.1s",
            }}
          />
        ))}
      </div>

      {/* ── Center: canvas ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "12px", padding: "16px",
        background: "#5BC8F5",
      }}>
        {/* Label */}
        <div style={{
          background: "#FF8C42", border: "3px solid #1A1A1A",
          borderRadius: "50px", padding: "4px 20px",
          boxShadow: "3px 3px 0 #1A1A1A",
        }}>
          <span style={{ fontSize: "1.1rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive" }}>
            🎨 ¡Dibuja a tu mascota!
          </span>
        </div>

        {/* Canvas frame */}
        <div style={{
          background: "#1A1A1A",
          borderRadius: "12px",
          padding: "6px",
          boxShadow: "6px 6px 0 #1A1A1A",
        }}>
          <canvas
            ref={canvasRef}
            width={440}
            height={400}
            style={{
              display: "block",
              cursor: "crosshair",
              borderRadius: "8px",
              touchAction: "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        {/* Hint text */}
        <span style={{
          fontSize: "0.8rem", color: "#1A1A1A", opacity: 0.6,
          fontFamily: "'Chewy',cursive",
        }}>dibuja aquí tu mascota ✦</span>
      </div>

      {/* ── Right sidebar: actions ── */}
      <div style={{
        width: "88px", flexShrink: 0,
        background: "#B8E04A",
        borderLeft: "3px solid #1A1A1A",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "14px",
        padding: "16px 0",
      }}>
        {/* Current color preview */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: color, border: "3px solid #1A1A1A",
          boxShadow: "3px 3px 0 #1A1A1A",
        }} />
        <span style={{ fontSize: "0.7rem", color: "#1A1A1A", fontFamily: "'Chewy',cursive", textAlign: "center" }}>color activo</span>

        <div style={{ width: "60px", height: "3px", background: "#1A1A1A" }} />

        {/* Clear button */}
        <button
          onClick={clearCanvas}
          style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "#FF6B8A", border: "3px solid #1A1A1A",
            cursor: "pointer", fontFamily: "'Chewy',cursive",
            fontSize: "0.75rem", color: "#1A1A1A",
            boxShadow: "3px 3px 0 #1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "2px",
            transition: "all 0.1s",
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = "translate(2px,2px)";
            e.currentTarget.style.boxShadow = "1px 1px 0 #1A1A1A";
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "3px 3px 0 #1A1A1A";
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>🗑️</span>
          <span>Reset</span>
        </button>

        {/* Camera button placeholder */}
        <button
          style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "#5BC8F5", border: "3px solid #1A1A1A",
            cursor: "pointer", fontFamily: "'Chewy',cursive",
            fontSize: "0.75rem", color: "#1A1A1A",
            boxShadow: "3px 3px 0 #1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "2px",
            transition: "all 0.1s",
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = "translate(2px,2px)";
            e.currentTarget.style.boxShadow = "1px 1px 0 #1A1A1A";
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "3px 3px 0 #1A1A1A";
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📷</span>
          <span>Cam</span>
        </button>
      </div>
    </div>
  );
}
