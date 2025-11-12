import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Download, Undo, Redo, Pen, Eraser, Circle, Square, Minus } from 'lucide-react';

export default function DrawingCanvas({ initialData, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // pen, eraser, circle, square, line
  const [color, setColor] = useState('#3b82f6'); // azul padrão
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState(null);

  // Carregar dados iniciais do canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Configurar tamanho do canvas
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Preencher com fundo escuro
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const initHistory = () => {
      const imageData = canvas.toDataURL();
      setHistory([imageData]);
      setHistoryStep(0);
    };

    // Carregar imagem salva se existir
    if (initialData && initialData.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        initHistory();
      };
      img.src = initialData;
    } else {
      initHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    // Salvar automaticamente
    onSave(imageData);
  };

  const undo = useCallback(() => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const newStep = historyStep - 1;
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
      setHistoryStep(newStep);
      onSave(history[newStep]);
    }
  }, [history, historyStep, onSave]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const newStep = historyStep + 1;
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
      setHistoryStep(newStep);
      onSave(history[newStep]);
    }
  }, [history, historyStep, onSave]);

  // Efeito para adicionar atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'sketch.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = tool === 'eraser' ? '#1a1a1a' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'circle' || tool === 'square' || tool === 'line') {
      // Para formas, redesenhar do histórico e adicionar preview
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        if (tool === 'circle') {
          const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        } else if (tool === 'square') {
          const width = x - startPos.x;
          const height = y - startPos.y;
          ctx.rect(startPos.x, startPos.y, width, height);
        } else if (tool === 'line') {
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      img.src = history[historyStep];
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const colors = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Amarelo', value: '#f59e0b' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Branco', value: '#ffffff' },
    { name: 'Cinza', value: '#6b7280' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-dark-surface border-b border-dark-border p-3 flex items-center gap-4 flex-wrap">
        {/* Ferramentas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded transition-colors ${
              tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-gray-400 hover:text-white'
            }`}
            title="Caneta"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded transition-colors ${
              tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-gray-400 hover:text-white'
            }`}
            title="Borracha"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-2 rounded transition-colors ${
              tool === 'line' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-gray-400 hover:text-white'
            }`}
            title="Linha"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded transition-colors ${
              tool === 'circle' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-gray-400 hover:text-white'
            }`}
            title="Círculo"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('square')}
            className={`p-2 rounded transition-colors ${
              tool === 'square' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-gray-400 hover:text-white'
            }`}
            title="Retângulo"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-dark-border"></div>

        {/* Cores */}
        <div className="flex items-center gap-2">
          {colors.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                color === c.value ? 'border-white scale-110' : 'border-dark-border'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-dark-border"></div>

        {/* Espessura */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Espessura:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-300 w-6">{lineWidth}</span>
        </div>

        <div className="w-px h-6 bg-dark-border"></div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Desfazer"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Refazer"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 bg-dark-bg rounded text-red-400 hover:text-red-300 transition-colors"
            title="Limpar tudo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={downloadCanvas}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white transition-colors"
            title="Baixar imagem"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-dark-bg p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-dark-border rounded cursor-crosshair"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
