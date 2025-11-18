import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder, FolderOpen, File, Plus, Trash2, ChevronRight, ChevronDown, Edit2, Check, X, ExternalLink, FileText } from 'lucide-react';
import ModalShell from './ModalShell';
import { getGitHubToken } from '../utils/github';

// Componente de zona de drop para a raiz
function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] mt-2 mx-2 border-2 border-dashed rounded transition-all ${
        isOver 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-gray-600 bg-transparent'
      }`}
    >
      <div className="flex items-center justify-center h-full text-gray-500 text-xs">
        {isOver ? 'Solte aqui para mover para a raiz' : 'Arraste aqui para mover para a raiz'}
      </div>
    </div>
  );
}

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

// Componente de nó arrastável
function TreeNode({ 
  node, 
  depth, 
  onToggle, 
  onRename, 
  onDelete, 
  onCreateInside,
  editingId,
  editingName,
  onEditNameChange,
  onConfirmRename,
  onCancelRename,
  onStartRename,
  selectable = false,
  selectedSet = new Set(),
  onSelectChange,
  readOnly = false,
  onOpenFile
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: node.id,
    data: {
      type: node.type,
      name: node.name,
      node: node
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isFolder = node.type === 'folder';
  const isExpanded = node.expanded;
  const isEditing = editingId === node.id;
  const paddingLeft = depth * 16;

  return (
    <div ref={setNodeRef} style={style}>
      {/* Linha do item */}
      <div
        className={`group flex items-center gap-2 px-2 py-1 hover:bg-dark-hover cursor-grab active:cursor-grabbing transition-colors ${
          isDragging ? 'bg-blue-500/20 border border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        {...attributes}
        {...listeners}
        onDoubleClick={() => {
          if (!isFolder && typeof onOpenFile === 'function') onOpenFile(node);
        }}
      >
        {/* Ícone de expandir/colapsar (só para pastas) */}
        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
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

        {/* Checkbox para seleção */}
        {selectable && (
          <input
            type="checkbox"
            checked={selectedSet.has(node.id)}
            onChange={(e) => onSelectChange(node.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="w-3 h-3 text-blue-500 bg-dark-bg border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
            disabled={readOnly}
          />
        )}

        {/* Nome do item (editável) */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') onConfirmRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              className="flex-1 px-1 py-0.5 bg-dark-bg border border-blue-500 rounded text-white text-sm focus:outline-none"
              autoFocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirmRename();
              }}
              className="p-0.5 hover:bg-green-600 rounded text-green-400"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelRename();
              }}
              className="p-0.5 hover:bg-red-600 rounded text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm text-gray-300 flex-1 select-none">{node.name}</span>
            
            {/* Ações (visíveis no hover) */}
            <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {isFolder && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateInside('file', node.id);
                    }}
                    className="p-1 hover:bg-dark-border rounded transition-colors"
                    title="Novo arquivo"
                  >
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateInside('folder', node.id);
                    }}
                    className="p-1 hover:bg-dark-border rounded transition-colors"
                    title="Nova pasta"
                  >
                    <Folder className="w-3 h-3 text-gray-400" />
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename(node.id, node.name);
                }}
                className="p-1 hover:bg-dark-border rounded transition-colors"
                title="Renomear"
              >
                <Edit2 className="w-3 h-3 text-gray-400" />
              </button>
              {!isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    typeof onOpenFile === 'function' && onOpenFile(node);
                  }}
                  className="p-1 hover:bg-dark-border rounded transition-colors"
                  title="Abrir arquivo"
                >
                  <FileText className="w-3 h-3 text-gray-400" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
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
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onCreateInside={onCreateInside}
              editingId={editingId}
              editingName={editingName}
              onEditNameChange={onEditNameChange}
              onConfirmRename={onConfirmRename}
              onCancelRename={onCancelRename}
              onStartRename={onStartRename}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectStructureTree({ initialData, onSave, selectable = false, selectedIds, onSelectChange, repo }) {
  // Função para ordenar a árvore: pastas primeiro, depois alfabeticamente
  const sortTree = (nodes) => {
    if (!nodes || nodes.length === 0) return nodes;
    
    const sorted = [...nodes].sort((a, b) => {
      // Pastas primeiro
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      // Depois alfabeticamente (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    
    // Ordena recursivamente os filhos de cada pasta
    return sorted.map(node => {
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: sortTree(node.children)
        };
      }
      return node;
    });
  };

  const [tree, setTree] = useState(sortTree(initialData || [
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
  ]));

  const [activeId, setActiveId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [creatingType, setCreatingType] = useState(null);
  const [creatingParentId, setCreatingParentId] = useState(null);
  const [selectedSet, setSelectedSet] = useState(new Set(selectedIds || []));
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [currentFile, setCurrentFile] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Salva automaticamente quando a árvore muda
  const updateTree = (newTree) => {
    const sortedTree = sortTree(newTree);
    setTree(sortedTree);
    onSave(sortedTree);
    console.log('[ProjectStructureTree] Árvore atualizada, ordenada e salva');
  };

  // Sincroniza selectedIds externos com o set interno
  useEffect(() => {
    setSelectedSet(new Set(selectedIds || []));
  }, [selectedIds]);

  // Converte a resposta "git tree" do GitHub em formato de árvore aninhada usado pelo componente
  const buildTreeFromGitPaths = (treeItems) => {
    const root = [];
    const nodeByPath = new Map();

    const ensureFolder = (pathSegments) => {
      let path = '';
      let parentArray = root;
      for (let i = 0; i < pathSegments.length; i++) {
        const seg = pathSegments[i];
        path = path ? `${path}/${seg}` : seg;
        if (!nodeByPath.has(path)) {
          // Sempre criar como pasta quando garantimos a estrutura
          const newNode = {
            id: path,
            name: seg,
            type: 'folder',
            expanded: false,
            children: []
          };
          nodeByPath.set(path, newNode);
          parentArray.push(newNode);
        }
        const node = nodeByPath.get(path);
        parentArray = node.children || [];
      }
    };

    for (const item of treeItems) {
      const parts = item.path.split('/');
      // se for um blob (arquivo), crie folhas; se for tree, crie pastas
      if (item.type === 'tree') {
        // garante que a pasta existe
        ensureFolder(parts);
      } else if (item.type === 'blob') {
        // cria a estrutura de pastas e o arquivo final
        const dirParts = parts.slice(0, -1);
        if (dirParts.length > 0) ensureFolder(dirParts);
        // file path
        const parentPath = dirParts.join('/');
        const filePath = parts.join('/');
        const fileNode = {
          id: filePath,
          name: parts[parts.length - 1],
          type: 'file'
          , sha: item.sha
        };
        // Proteções: se não achou parent (inconsistência do tree), usar root
        const parent = parentPath ? nodeByPath.get(parentPath) : null;
        const parentArray = parent ? (parent.children || root) : root;
        // evita duplicata
        if (!parentArray.find(n => n.id === fileNode.id)) parentArray.push(fileNode);
      }
    }

    // normaliza: pastas sem children -> children: []
    const normalize = (nodes) => nodes.map(n => n.type === 'folder' ? ({ ...n, children: normalize(n.children || []) }) : n);
    return sortTree(normalize(root));
  };

  const fetchGithubTree = async ({ owner, name, branch, token }) => {
    try {
      setLoadingRepo(true);
      setRepoError(null);
      // GET /repos/:owner/:repo/git/trees/:branch?recursive=1  (branch funciona)
      const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${encodeURIComponent(branch || 'HEAD')}?recursive=1`;
      const headers = token ? { Authorization: `token ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Erro ao buscar árvore: ${res.status}`);
      }
      const data = await res.json();
      // data.tree -> array com tipo 'blob' (arquivo) e 'tree' (pasta)
      const newTree = buildTreeFromGitPaths(data.tree || []);
      setTree(newTree);
      setLoadingRepo(false);
      // opcional: salvar automático
      onSave?.(newTree);
    } catch (error) {
      setRepoError(error.message);
      setLoadingRepo(false);
      console.error('[ProjectStructureTree] erro ao carregar repo:', error);
    }
  };

  // Ler conteúdo do arquivo do GitHub (via endpoint contents)
  const fetchFileContent = async (node) => {
    if (!repo || !repo.owner || !repo.name) {
      setFileError('Repositório não configurado');
      setFileModalOpen(true);
      return;
    }

    setFileError(null);
    setFileContent('');
    setFileLoading(true);
    setCurrentFile(node);
    try {
      const owner = repo.owner;
      const name = repo.name;
      const branch = repo.branch || 'HEAD';
      const token = repo.token || getGitHubToken();

      const url = `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(node.id)}?ref=${encodeURIComponent(branch)}`;
      const headers = token ? { Authorization: `token ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ao buscar arquivo (${res.status})`);
      }

      const data = await res.json();
      if (!data.content) throw new Error('Conteúdo não disponível');

      // GitHub retorna base64, geralmente UTF-8; decodificação simples
      const decoded = atob(data.content.replace(/\n/g, ''));
      let finalContent = decoded;
      try {
        // mantém caracteres UTF-8 corretamente
        finalContent = decodeURIComponent(escape(decoded));
      } catch (e) {
        // fallback: usar decoded simples
      }
      setFileContent(finalContent);

      // Atualiza o nó na árvore com o conteúdo do arquivo para que outras partes da app (IA) possam usar
      const updateNodeContent = (nodes) => {
        return nodes.map(n => {
              if (n.id === node.id) return { ...n, content: finalContent };
          if (n.children) return { ...n, children: updateNodeContent(n.children) };
          return n;
        });
      };

      const updatedTree = updateNodeContent(tree);
      setTree(sortTree(updatedTree));
      // chama onSave para persistir na estrutura do projeto
      onSave?.(sortTree(updatedTree));

      setFileModalOpen(true);
      setFileLoading(false);
    } catch (error) {
      setFileError(error.message);
      setFileLoading(false);
      setFileModalOpen(true);
      console.error('[ProjectStructureTree] erro ao ler arquivo:', error);
    }
  };

  useEffect(() => {
    if (repo?.owner && repo?.name) {
      fetchGithubTree(repo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo?.owner, repo?.name, repo?.branch]);

  // Função para encontrar um nó por ID
  const findNode = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Função para remover um nó da árvore
  const removeNode = (nodes, id) => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      if (node.children) {
        node.children = removeNode(node.children, id);
      }
      return true;
    });
  };

  // Função para adicionar um nó em uma posição específica
  const addNodeToParent = (nodes, parentId, newNode) => {
    if (!parentId) {
      return [...nodes, newNode];
    }

    return nodes.map(node => {
      if (node.id === parentId && node.type === 'folder') {
        return {
          ...node,
          expanded: true,
          children: [...(node.children || []), newNode]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: addNodeToParent(node.children, parentId, newNode)
        };
      }
      return node;
    });
  };

  // Função para encontrar o nó pai de um item
  const findParentNode = (nodes, childId) => {
    for (const node of nodes) {
      if (node.children?.some(child => child.id === childId)) {
        return node;
      }
      if (node.children) {
        const found = findParentNode(node.children, childId);
        if (found) return found;
      }
    }
    return null; // Retorna null se estiver na raiz
  };

  // Handler de drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    console.log('[DragDrop] Iniciou arrasto:', event.active.id);
  };

  // Handler de drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) {
      console.log('[DragDrop] Arrasto cancelado');
      return;
    }

    const draggedNode = findNode(tree, active.id);

    if (!draggedNode) {
      console.log('[DragDrop] Nó arrastado não encontrado');
      return;
    }

    // Remove o nó arrastado da posição original
    let newTree = removeNode(JSON.parse(JSON.stringify(tree)), active.id);

    // Se soltou na zona de drop da raiz
    if (over.id === 'root-drop-zone') {
      console.log('[DragDrop] Movendo para a raiz');
      newTree = [...newTree, draggedNode];
      updateTree(newTree);
      return;
    }

    // Caso contrário, processa normalmente
    const targetNode = findNode(tree, over.id);

    if (!targetNode) {
      console.log('[DragDrop] Nó alvo não encontrado');
      return;
    }
    
    // Previne que uma pasta seja movida para dentro de um de seus filhos
    if (draggedNode.type === 'folder') {
      let parent = findParentNode(tree, targetNode.id);
      while (parent) {
        if (parent.id === draggedNode.id) {
          console.log('[DragDrop] Ação ilegal: mover pasta para um de seus descendentes.');
          return;
        }
        parent = findParentNode(tree, parent.id);
      }
    }

    console.log('[DragDrop] Movendo:', {
      from: draggedNode.name,
      to: targetNode.name,
      targetType: targetNode.type
    });

    // Determina o destino
    let destinationParentId = null;
    if (targetNode.type === 'folder') {
      // Se o alvo é uma pasta, o destino é a própria pasta
      destinationParentId = targetNode.id;
      console.log(`[DragDrop] Alvo é a pasta '${targetNode.name}'.`);
    } else {
      // Se o alvo é um arquivo, o destino é o pai desse arquivo
      const parent = findParentNode(newTree, targetNode.id);
      destinationParentId = parent ? parent.id : null;
      console.log(`[DragDrop] Alvo é o arquivo '${targetNode.name}'. Movendo para o pai: ${parent ? `'${parent.name}'` : 'raiz'}.`);
    }

    newTree = addNodeToParent(newTree, destinationParentId, draggedNode);

    updateTree(newTree);
  };

  // Selection helpers - seleciona recursivamente os filhos
  const collectChildIds = (node) => {
    const ids = [node.id];
    if (node.children) {
      for (const c of node.children) ids.push(...collectChildIds(c));
    }
    return ids;
  };

  const handleSelectChange = (id, checked) => {
    const newSet = new Set(selectedSet);
    const node = findNode(tree, id);
    if (!node) return;
    const ids = collectChildIds(node);
    if (checked) ids.forEach(i => newSet.add(i));
    else ids.forEach(i => newSet.delete(i));
    setSelectedSet(newSet);
    onSelectChange?.(Array.from(newSet));
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

    const newTree = addNodeToParent(tree, creatingParentId, newItem);
    updateTree(newTree);
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
    updateTree(removeNode(JSON.parse(JSON.stringify(tree)), id));
  };

  // Função para coletar todos os IDs da árvore (para o SortableContext)
  const getAllIds = (nodes) => {
    let ids = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        ids = [...ids, ...getAllIds(node.children)];
      }
    });
    return ids;
  };

  const activeNode = activeId ? findNode(tree, activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col bg-dark-bg relative">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-semibold">EXPLORADOR</span>
            {loadingRepo && <span className="text-xs text-blue-400">Carregando...</span>}
            {repoError && <span className="text-xs text-red-400">Erro: {repoError}</span>}
          </div>
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
          {tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              onToggle={toggleFolder}
              onRename={confirmRename}
              onDelete={deleteItem}
              onCreateInside={startCreating}
              editingId={editingId}
              editingName={editingName}
              onEditNameChange={setEditingName}
              onConfirmRename={confirmRename}
              onCancelRename={cancelRename}
              onStartRename={startRename}
              selectable={selectable}
              selectedSet={selectedSet}
              onSelectChange={handleSelectChange}
              readOnly={loadingRepo || !!repoError}
              onOpenFile={fetchFileContent}
            />
          ))}
          
          {/* Zona de drop para a raiz - só aparece durante o drag */}
          {activeId && <RootDropZone />}
          
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

        {/* Input de criação dentro de pastas */}
        {creatingParentId && creatingType && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-dark-surface border-t border-dark-border">
            <div className="flex items-center gap-2">
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
                className="flex-1 px-2 py-1 bg-dark-bg border border-blue-500 rounded text-white text-sm focus:outline-none placeholder-gray-500"
                autoFocus
              />
              <button
                onClick={confirmCreate}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
              >
                Criar
              </button>
              <button
                onClick={cancelCreate}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualização de arquivo */}
      <ModalShell isOpen={fileModalOpen} onClose={() => setFileModalOpen(false)} overlayClassName="bg-black/60">
        <div className="w-[80vw] max-w-4xl h-[80vh] overflow-hidden bg-dark-surface border border-dark-border rounded-lg flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm text-white">{currentFile?.name || 'Arquivo'}</div>
                <div className="text-xs text-gray-400">{currentFile?.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(fileContent || '').then(() => {
                    // opcional: feedback
                  });
                }}
                className="px-3 py-1 bg-dark-border rounded text-white text-sm"
              >
                Copiar
              </button>
              <button onClick={() => setFileModalOpen(false)} className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-white text-sm">Fechar</button>
            </div>
          </div>

          <div className="p-4 overflow-auto flex-1">
            {fileLoading ? (
              <div className="text-gray-400 text-sm">Carregando...</div>
            ) : fileError ? (
              <div className="text-red-400 text-sm">Erro: {fileError}</div>
            ) : (
              <pre className="text-xs text-white whitespace-pre-wrap">{fileContent}</pre>
            )}
          </div>
        </div>
      </ModalShell>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeNode ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-surface border-2 border-blue-500 rounded shadow-2xl">
            {activeNode.type === 'folder' ? (
              <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <File className={`w-4 h-4 ${getFileIcon(activeNode.name)}`} />
            )}
            <span className="text-sm text-white font-medium">{activeNode.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
