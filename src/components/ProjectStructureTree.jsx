import { useState } from 'react';
import { Folder, FolderOpen, File, Plus, Trash2, ChevronRight, ChevronDown, Edit2, Check, X } from 'lucide-react';

// Ícones por tipo de arquivo (estilo VSCode)
const getFileIcon = (name) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const colors = {
    js: 'text-yellow-400',
    jsx: 'text-blue-400',
    ts: 'text-blue-500',
    tsx: 'text-blue-400',
    json: 'text-yellow-300',
    html: 'text-orange-500',
    css: 'text-blue-400',
    scss: 'text-pink-400',
    md: 'text-blue-300',
    py: 'text-blue-400',
    java: 'text-red-500',
    cpp: 'text-blue-500',
    c: 'text-blue-600',
    go: 'text-cyan-400',
    rs: 'text-orange-600',
    vue: 'text-green-500',
    php: 'text-purple-400',
    rb: 'text-red-400',
    sh: 'text-green-400',
    yml: 'text-red-300',
    yaml: 'text-red-300',
    xml: 'text-orange-400',
    svg: 'text-yellow-500',
    png: 'text-purple-300',
    jpg: 'text-purple-300',
    gif: 'text-purple-300',
  };
  
  return colors[ext] || 'text-gray-400';
};

export default function ProjectStructureTree({ initialData, onSave }) {
  const [tree, setTree] = useState(initialData || [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      expanded: true,
      children: [
        { id: '2', name: 'index.js', type: 'file' },
        { id: '3', name: 'App.jsx', type: 'file' },
      ]
    },
    {
      id: '4',
      name: 'public',
      type: 'folder',
      expanded: false,
      children: []
    },
    { id: '5', name: 'package.json', type: 'file' },
    { id: '6', name: 'README.md', type: 'file' },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [creatingType, setCreatingType] = useState(null); // 'file' ou 'folder'
  const [creatingParentId, setCreatingParentId] = useState(null);

  // Salva automaticamente quando a árvore muda
  const updateTree = (newTree) => {
    setTree(newTree);
    onSave(newTree);
    console.log('[ProjectStructureTree] Árvore atualizada e salva');
  };

  // Toggle expand/collapse de pasta
  const toggleFolder = (id) => {
    const updateNode = (nodes) => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    updateTree(updateNode(tree));
  };

  // Adicionar novo item
  const startCreating = (type, parentId = null) => {
    setCreatingType(type);
    setCreatingParentId(parentId);
    setEditingName('');
  };

  const confirmCreate = () => {
    if (!editingName.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      name: editingName.trim(),
      type: creatingType,
      expanded: false,
      ...(creatingType === 'folder' && { children: [] })
    };

    if (creatingParentId) {
      // Adicionar dentro de uma pasta
      const addToParent = (nodes) => {
        return nodes.map(node => {
          if (node.id === creatingParentId) {
            return {
              ...node,
              expanded: true,
              children: [...(node.children || []), newItem]
            };
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) };
          }
          return node;
        });
      };
      updateTree(addToParent(tree));
    } else {
      // Adicionar na raiz
      updateTree([...tree, newItem]);
    }

    cancelCreate();
  };

  const cancelCreate = () => {
    setCreatingType(null);
    setCreatingParentId(null);
    setEditingName('');
  };

  // Renomear item
  const startRename = (id, currentName) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const confirmRename = () => {
    if (!editingName.trim()) return;

    const renameNode = (nodes) => {
      return nodes.map(node => {
        if (node.id === editingId) {
          return { ...node, name: editingName.trim() };
        }
        if (node.children) {
          return { ...node, children: renameNode(node.children) };
        }
        return node;
      });
    };

    updateTree(renameNode(tree));
    setEditingId(null);
    setEditingName('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Deletar item
  const deleteItem = (id) => {
    const deleteNode = (nodes) => {
      return nodes.filter(node => {
        if (node.id === id) return false;
        if (node.children) {
          node.children = deleteNode(node.children);
        }
        return true;
      });
    };

    updateTree(deleteNode(tree));
  };

  // Renderizar um nó da árvore
  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = node.expanded;
    const isEditing = editingId === node.id;
    const paddingLeft = depth * 16;

    return (
      <div key={node.id}>
        {/* Linha do item */}
        <div
          className="group flex items-center gap-2 px-2 py-1 hover:bg-dark-hover cursor-pointer transition-colors"
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
        >
          {/* Ícone de expandir/colapsar (só para pastas) */}
          {isFolder && (
            <button
              onClick={() => toggleFolder(node.id)}
              className="p-0.5 hover:bg-dark-border rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          {!isFolder && <div className="w-4" />}

          {/* Ícone do item */}
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
            )
          ) : (
            <File className={`w-4 h-4 flex-shrink-0 ${getFileIcon(node.name)}`} />
          )}

          {/* Nome do item (editável) */}
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="flex-1 px-1 py-0.5 bg-dark-bg border border-blue-500 rounded text-white text-sm focus:outline-none"
                autoFocus
              />
              <button
                onClick={confirmRename}
                className="p-0.5 hover:bg-green-600 rounded text-green-400"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={cancelRename}
                className="p-0.5 hover:bg-red-600 rounded text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-300 flex-1">{node.name}</span>
              
              {/* Ações (visíveis no hover) */}
              <div className="hidden group-hover:flex items-center gap-1">
                {isFolder && (
                  <>
                    <button
                      onClick={() => startCreating('file', node.id)}
                      className="p-1 hover:bg-dark-border rounded transition-colors"
                      title="Novo arquivo"
                    >
                      <Plus className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={() => startCreating('folder', node.id)}
                      className="p-1 hover:bg-dark-border rounded transition-colors"
                      title="Nova pasta"
                    >
                      <Folder className="w-3 h-3 text-gray-400" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => startRename(node.id, node.name)}
                  className="p-1 hover:bg-dark-border rounded transition-colors"
                  title="Renomear"
                >
                  <Edit2 className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={() => deleteItem(node.id)}
                  className="p-1 hover:bg-red-900/30 rounded transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Filhos (se for pasta expandida) */}
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
            
            {/* Input de criação dentro da pasta */}
            {creatingParentId === node.id && (
              <div
                className="flex items-center gap-2 px-2 py-1 bg-dark-hover"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                <div className="w-4" />
                {creatingType === 'folder' ? (
                  <Folder className="w-4 h-4 text-blue-400" />
                ) : (
                  <File className="w-4 h-4 text-gray-400" />
                )}
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCreate();
                    if (e.key === 'Escape') cancelCreate();
                  }}
                  placeholder={creatingType === 'folder' ? 'Nome da pasta' : 'Nome do arquivo'}
                  className="flex-1 px-1 py-0.5 bg-dark-bg border border-blue-500 rounded text-white text-sm focus:outline-none placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={confirmCreate}
                  className="p-0.5 hover:bg-green-600 rounded text-green-400"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelCreate}
                  className="p-0.5 hover:bg-red-600 rounded text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-dark-border">
        <span className="text-sm text-gray-400 font-semibold">EXPLORADOR</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startCreating('file')}
            className="p-1.5 hover:bg-dark-hover rounded transition-colors"
            title="Novo arquivo na raiz"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => startCreating('folder')}
            className="p-1.5 hover:bg-dark-hover rounded transition-colors"
            title="Nova pasta na raiz"
          >
            <Folder className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Árvore de arquivos */}
      <div className="flex-1 overflow-y-auto">
        {tree.map(node => renderNode(node))}
        
        {/* Input de criação na raiz */}
        {creatingParentId === null && creatingType && (
          <div className="flex items-center gap-2 px-2 py-1 bg-dark-hover">
            <div className="w-4" />
            {creatingType === 'folder' ? (
              <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <File className="w-4 h-4 text-gray-400" />
            )}
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreate();
                if (e.key === 'Escape') cancelCreate();
              }}
              placeholder={creatingType === 'folder' ? 'Nome da pasta' : 'Nome do arquivo'}
              className="flex-1 px-1 py-0.5 bg-dark-bg border border-blue-500 rounded text-white text-sm focus:outline-none placeholder-gray-500"
              autoFocus
            />
            <button
              onClick={confirmCreate}
              className="p-0.5 hover:bg-green-600 rounded text-green-400"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={cancelCreate}
              className="p-0.5 hover:bg-red-600 rounded text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
