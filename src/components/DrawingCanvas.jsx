import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Download, Undo, Redo, Pen, Eraser, Circle, Square, Minus, Save, Hand, ZoomIn, ZoomOut } from 'lucide-react';

export default function DrawingCanvas({ initialData, onSave }) {
  const canvasRef = useRef(null);
  const lastSavedRef = useRef(null);
  const virtualCanvasRef = useRef(null); // Canvas virtual maior
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // pen, eraser, circle, square, line, hand
  const [color, setColor] = useState('#3b82f6'); // azul padrão
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState(null);
  
  // Estados para pan e zoom
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Tamanho do canvas virtual (muito maior que a tela)
  const VIRTUAL_WIDTH = 4000;
  const VIRTUAL_HEIGHT = 3000;

  // Carregar dados iniciais do canvas
  useEffect(() => {
    // Evita recarregar o canvas quando a mudança de initialData veio do próprio onSave
    if (initialData && lastSavedRef.current && initialData === lastSavedRef.current) {
      console.log('[DrawingCanvas] Ignorando recarregamento (initialData veio do próprio save)');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('[DrawingCanvas] useEffect: Canvas não encontrado');
      return;
    }

    console.log('[DrawingCanvas] useEffect: Iniciando carregamento', {
      hasInitialData: !!initialData,
      dataSize: initialData?.length || 0
    });

    const ctx = canvas.getContext('2d');
    
    // Configurar tamanho do canvas visível
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Criar canvas virtual (maior)
    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = VIRTUAL_WIDTH;
    virtualCanvas.height = VIRTUAL_HEIGHT;
    const virtualCtx = virtualCanvas.getContext('2d');
    
    // Preencher canvas virtual com fundo escuro
    virtualCtx.fillStyle = '#1a1a1a';
    virtualCtx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    
    virtualCanvasRef.current = virtualCanvas;

    console.log('[DrawingCanvas] Canvas configurado:', {
      visible: { width: canvas.width, height: canvas.height },
      virtual: { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT }
    });

    const initHistory = () => {
      renderViewport(); // Renderiza a viewport inicial
      const imageData = virtualCanvas.toDataURL();
      setHistory([imageData]);
      setHistoryStep(0);
      console.log('[DrawingCanvas] Histórico inicializado');
    };

    // Carregar imagem salva se existir
    if (initialData && initialData.startsWith('data:image')) {
      console.log('[DrawingCanvas] Carregando imagem salva...');
      const img = new Image();
      img.onload = () => {
        console.log('[DrawingCanvas] Imagem carregada com sucesso');
        virtualCtx.drawImage(img, 0, 0);
        initHistory();
        // Marca a última imagem conhecida para evitar loops de recarga
        lastSavedRef.current = initialData;
      };
      img.onerror = (error) => {
        console.error('[DrawingCanvas] Erro ao carregar imagem:', error);
        initHistory();
      };
      img.src = initialData;
    } else {
      console.log('[DrawingCanvas] Nenhuma imagem para carregar, iniciando vazio');
      initHistory();
      // Sem imagem inicial
      lastSavedRef.current = null;
    }
  // Recarrega quando o initialData muda (quando troca de card)
  }, [initialData]);

  // Função para renderizar a viewport (parte visível do canvas virtual)
  const renderViewport = useCallback(() => {
    const canvas = canvasRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    if (!canvas || !virtualCanvas) return;

    const ctx = canvas.getContext('2d');
    
    // Limpar canvas visível
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar a parte visível do canvas virtual com transformações
    ctx.save();
    ctx.scale(scale, scale);
    ctx.drawImage(
      virtualCanvas,
      offsetX / scale,
      offsetY / scale,
      canvas.width / scale,
      canvas.height / scale,
      0,
      0,
      canvas.width / scale,
      canvas.height / scale
    );
    ctx.restore();
  }, [offsetX, offsetY, scale]);

  // Atualizar renderização quando offset ou scale mudam
  useEffect(() => {
    renderViewport();
  }, [offsetX, offsetY, scale, renderViewport]);

  // Funções de zoom
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5)); // Máximo 5x
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1)); // Mínimo 0.1x
  };

  const resetView = () => {
    setOffsetX(0);
    setOffsetY(0);
    setScale(1);
  };

  const saveToHistory = () => {
    const virtualCanvas = virtualCanvasRef.current;
    if (!virtualCanvas) {
      console.log('[DrawingCanvas] saveToHistory: Canvas virtual não encontrado');
      return;
    }

    const imageData = virtualCanvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    console.log('[DrawingCanvas] Salvando no histórico:', {
      historyLength: newHistory.length,
      historyStep: newHistory.length - 1,
      dataSize: imageData.length
    });

    // Salvar automaticamente apenas no término do traço
    lastSavedRef.current = imageData;
    onSave(imageData);
  };

  const manualSave = () => {
    const virtualCanvas = virtualCanvasRef.current;
    if (!virtualCanvas) {
      console.log('[DrawingCanvas] manualSave: Canvas virtual não encontrado');
      return;
    }

    const imageData = virtualCanvas.toDataURL();
    console.log('[DrawingCanvas] Salvamento manual acionado:', {
      dataSize: imageData.length,
      timestamp: new Date().toISOString()
    });
    lastSavedRef.current = imageData;
    onSave(imageData);
  };

  const undo = useCallback(() => {
    if (historyStep > 0) {
      const virtualCanvas = virtualCanvasRef.current;
      const virtualCtx = virtualCanvas.getContext('2d');
      const newStep = historyStep - 1;
      
      console.log('[DrawingCanvas] Undo:', { from: historyStep, to: newStep });
      
      const img = new Image();
      img.onload = () => {
        virtualCtx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        virtualCtx.fillStyle = '#1a1a1a';
        virtualCtx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        virtualCtx.drawImage(img, 0, 0);
        renderViewport();
      };
      img.src = history[newStep];
      setHistoryStep(newStep);
    } else {
      console.log('[DrawingCanvas] Undo: Não há mais ações para desfazer');
    }
  }, [history, historyStep, renderViewport]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const virtualCanvas = virtualCanvasRef.current;
      const virtualCtx = virtualCanvas.getContext('2d');
      const newStep = historyStep + 1;
      
      console.log('[DrawingCanvas] Redo:', { from: historyStep, to: newStep });
      
      const img = new Image();
      img.onload = () => {
        virtualCtx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        virtualCtx.fillStyle = '#1a1a1a';
        virtualCtx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        virtualCtx.drawImage(img, 0, 0);
        renderViewport();
      };
      img.src = history[newStep];
      setHistoryStep(newStep);
    } else {
      console.log('[DrawingCanvas] Redo: Não há mais ações para refazer');
    }
  }, [history, historyStep, renderViewport]);

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
    const virtualCanvas = virtualCanvasRef.current;
    const virtualCtx = virtualCanvas.getContext('2d');
    virtualCtx.fillStyle = '#1a1a1a';
    virtualCtx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    renderViewport();
    saveToHistory();
  };

  const downloadCanvas = () => {
    const virtualCanvas = virtualCanvasRef.current;
    const link = document.createElement('a');
    link.download = 'sketch.png';
    link.href = virtualCanvas.toDataURL();
    link.click();
  };

  // Converter coordenadas da tela para coordenadas do canvas virtual
  const screenToVirtual = (screenX, screenY) => {
    return {
      x: (screenX / scale) + (offsetX / scale),
      y: (screenY / scale) + (offsetY / scale)
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Modo de pan (arrastar a tela)
    if (tool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: screenX, y: screenY });
      return;
    }

    const { x, y } = screenToVirtual(screenX, screenY);

    setIsDrawing(true);
    setStartPos({ x, y });

    const virtualCtx = virtualCanvas.getContext('2d');
    virtualCtx.strokeStyle = tool === 'eraser' ? '#1a1a1a' : color;
    virtualCtx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    virtualCtx.lineCap = 'round';
    virtualCtx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      virtualCtx.beginPath();
      virtualCtx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    const virtualCanvas = virtualCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Modo de pan (arrastar a tela)
    if (isPanning && tool === 'hand') {
      const deltaX = screenX - panStart.x;
      const deltaY = screenY - panStart.y;
      setOffsetX(prev => prev - deltaX);
      setOffsetY(prev => prev - deltaY);
      setPanStart({ x: screenX, y: screenY });
      return;
    }

    if (!isDrawing) return;

    const { x, y } = screenToVirtual(screenX, screenY);
    const virtualCtx = virtualCanvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      virtualCtx.lineTo(x, y);
      virtualCtx.stroke();
      renderViewport(); // Atualiza a visualização em tempo real
    } else if (tool === 'circle' || tool === 'square' || tool === 'line') {
      // Para formas, redesenhar do histórico e adicionar preview
      const img = new Image();
      img.onload = () => {
        virtualCtx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        virtualCtx.fillStyle = '#1a1a1a';
        virtualCtx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        virtualCtx.drawImage(img, 0, 0);

        virtualCtx.strokeStyle = color;
        virtualCtx.lineWidth = lineWidth;
        virtualCtx.beginPath();

        if (tool === 'circle') {
          const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
          virtualCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        } else if (tool === 'square') {
          const width = x - startPos.x;
          const height = y - startPos.y;
          virtualCtx.rect(startPos.x, startPos.y, width, height);
        } else if (tool === 'line') {
          virtualCtx.moveTo(startPos.x, startPos.y);
          virtualCtx.lineTo(x, y);
        }
        virtualCtx.stroke();
        renderViewport();
      };
      img.src = history[historyStep];
    }
  };

  const stopDrawing = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

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
          <button
            onClick={() => setTool('hand')}
            className={`p-2 rounded transition-colors ${
              tool === 'hand' ? 'bg-blue-600 text-white' : 'bg-dark-bg text-gray-400 hover:text-white'
            }`}
            title="Arrastar tela (Pan)"
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-dark-border"></div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-300 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="px-2 py-1 bg-dark-bg rounded text-gray-400 hover:text-white transition-colors text-xs"
            title="Resetar visualização"
          >
            Reset
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
            onClick={manualSave}
            className="p-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
            title="Salvar desenho manualmente"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-2 bg-dark-bg rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Refazer (Ctrl+Y)"
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
          className={`border border-dark-border rounded ${
            tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
