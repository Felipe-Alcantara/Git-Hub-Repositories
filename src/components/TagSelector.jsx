import { useState, useRef, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { getAllTags, addCustomTag, searchTags, isValidTag } from '../utils/tags';

export default function TagSelector({ selectedTags = [], onChange }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Atualiza sugestões quando input muda
    if (input.trim()) {
      const filtered = searchTags(input)
        .filter(tag => !selectedTags.includes(tag))
        .slice(0, 10); // Limita a 10 sugestões
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, selectedTags]);

  useEffect(() => {
    // Fecha sugestões ao clicar fora
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag) => {
    if (!tag || selectedTags.includes(tag)) return;
    
    onChange([...selectedTags, tag]);
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      
      const trimmedInput = input.trim();
      
      // Se já existe nas sugestões, adiciona
      if (suggestions.includes(trimmedInput)) {
        addTag(trimmedInput);
        return;
      }
      
      // Senão, cria nova tag customizada
      if (isValidTag(trimmedInput)) {
        addCustomTag(trimmedInput);
        addTag(trimmedInput);
      }
    } else if (e.key === 'Backspace' && !input && selectedTags.length > 0) {
      // Remove última tag se input vazio
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleSelectSuggestion = (tag) => {
    addTag(tag);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Tags selecionadas + Input */}
      <div className="flex flex-wrap gap-2 p-3 bg-dark-bg border border-dark-border rounded-lg min-h-[42px] focus-within:border-blue-500 transition-colors">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm border border-blue-600/30"
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-300 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input && setShowSuggestions(true)}
          className="flex-1 min-w-[200px] bg-transparent outline-none text-white placeholder-gray-500"
          placeholder={selectedTags.length === 0 ? "Digite para buscar ou criar tags..." : "Adicionar mais..."}
        />
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelectSuggestion(tag)}
              className="w-full px-4 py-2 text-left text-white hover:bg-dark-bg transition-colors flex items-center gap-2"
            >
              <Tag className="w-4 h-4 text-gray-400" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Hint de criar nova tag */}
      {showSuggestions && input.trim() && !suggestions.some(s => s.toLowerCase() === input.trim().toLowerCase()) && (
        <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl">
          <button
            type="button"
            onClick={() => {
              const trimmed = input.trim();
              if (isValidTag(trimmed)) {
                addCustomTag(trimmed);
                addTag(trimmed);
              }
            }}
            className="w-full px-4 py-2 text-left text-green-400 hover:bg-dark-bg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar nova tag: <strong>{input.trim()}</strong>
          </button>
        </div>
      )}

      {/* Dica */}
      <p className="text-xs text-gray-500 mt-2">
        Digite para buscar tags existentes ou pressione <kbd className="px-1 bg-dark-surface border border-dark-border rounded">Enter</kbd> para criar uma nova
      </p>
    </div>
  );
}
