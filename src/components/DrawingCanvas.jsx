import { useRef, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';

const COLORS = ['#000000', '#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#805ad5', '#dd6b20', '#ffffff'];
const SIZES = [2, 4, 8, 12, 20];

export default function DrawingCanvas({ onClose, phrase }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIdx + 1);
      newHistory.push(data);
      return newHistory;
    });
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = Math.max(parent.clientHeight - 10, 300);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (phrase) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(phrase, canvas.width / 2, 30);
    }
    saveState();
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    saveState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (phrase) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(phrase, canvas.width / 2, 30);
    }
    saveState();
  };

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIdx];
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `drawing_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="drawing-overlay" onClick={onClose}>
      <div className="drawing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawing-toolbar">
          <div className="drawing-tools-left">
            <button
              className={`btn-icon btn-icon-sm ${tool === 'pen' ? 'drawing-active' : ''}`}
              onClick={() => setTool('pen')}
              title={t('pen') || 'Pen'}
            >
              ✏️
            </button>
            <button
              className={`btn-icon btn-icon-sm ${tool === 'eraser' ? 'drawing-active' : ''}`}
              onClick={() => setTool('eraser')}
              title={t('eraser') || 'Eraser'}
            >
              🧹
            </button>
            <button className="btn-icon btn-icon-sm" onClick={handleUndo} title="Undo">↩️</button>
            <button className="btn-icon btn-icon-sm" onClick={handleClear} title={t('clearText') || 'Clear'}>🗑️</button>
          </div>
          <div className="drawing-tools-right">
            <button className="btn-icon btn-icon-sm" onClick={handleSave} title={t('save') || 'Save'}>💾</button>
            <button className="btn-icon btn-icon-sm" onClick={onClose} title={t('close') || 'Close'}>✕</button>
          </div>
        </div>

        <div className="drawing-options">
          <div className="color-picker">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c && tool === 'pen' ? 'color-active' : ''}`}
                style={{ backgroundColor: c, border: c === '#ffffff' ? '2px solid #cbd5e1' : '2px solid transparent' }}
                onClick={() => { setColor(c); setTool('pen'); }}
              />
            ))}
          </div>
          <div className="size-picker">
            {SIZES.map(s => (
              <button
                key={s}
                className={`size-btn ${size === s ? 'size-active' : ''}`}
                onClick={() => setSize(s)}
              >
                <span className="size-dot" style={{ width: Math.min(s, 16), height: Math.min(s, 16) }} />
              </button>
            ))}
          </div>
        </div>

        <div className="drawing-canvas-area">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
      </div>
    </div>
  );
}
