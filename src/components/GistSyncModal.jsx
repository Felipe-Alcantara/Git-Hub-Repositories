import { useState, useEffect } from 'react';
import { X, Upload, Download, Cloud, Check, AlertCircle, Copy } from 'lucide-react';
import { syncToGist, loadFromGist, saveGistId, loadGistId, clearGistId } from '../utils/gist';
import { getGitHubToken } from '../utils/github';

export default function GistSyncModal({ isOpen, onClose, projects, onProjectsImported }) {
  const [mode, setMode] = useState('menu'); // 'menu', 'upload', 'download'
  const [gistId, setGistId] = useState('');
  const [savedGistId, setSavedGistId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gistUrl, setGistUrl] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedId = loadGistId();
      setSavedGistId(savedId || '');
      setGistId(savedId || '');
      setMode('menu');
      setError('');
      setSuccess('');
      setGistUrl('');
      setPreviewData(null);
    }
  }, [isOpen]);

  const handleUpload = async () => {
    const token = getGitHubToken();
    if (!token) {
      setError('Configure um token do GitHub antes de sincronizar');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await syncToGist(projects, token, savedGistId || null);
      saveGistId(result.id);
      setSavedGistId(result.id);
      setGistId(result.id);
      setGistUrl(result.url);
      setSuccess(`✅ ${projects.length} projeto(s) sincronizado(s) com sucesso!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPreview = async () => {
    if (!gistId.trim()) {
      setError('Digite um ID de Gist válido');
      return;
    }

    setLoading(true);
    setError('');
    setPreviewData(null);

    try {
      const token = getGitHubToken();
      const data = await loadFromGist(gistId.trim(), token);
      setPreviewData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDownload = () => {
    if (!previewData) return;

    const confirmMsg = `Você vai importar ${previewData.projects.length} projeto(s).\n\n` +
                       `Isso vai substituir TODOS os projetos atuais.\n\n` +
                       `Deseja continuar?`;
    
    if (window.confirm(confirmMsg)) {
      onProjectsImported(previewData.projects);
      saveGistId(gistId.trim());
      setSavedGistId(gistId.trim());
      setSuccess(`✅ ${previewData.projects.length} projeto(s) importado(s) com sucesso!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleCopyGistId = () => {
    navigator.clipboard.writeText(savedGistId || gistId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearGist = () => {
    if (window.confirm('Tem certeza que deseja desconectar este Gist?\n\nSeus projetos locais não serão afetados.')) {
      clearGistId();
      setSavedGistId('');
      setGistId('');
      setSuccess('Gist desconectado');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Cloud className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">
              {mode === 'menu' && 'Sincronização via Gist'}
              {mode === 'upload' && 'Backup para Nuvem'}
              {mode === 'download' && 'Restaurar do Gist'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Menu Principal */}
          {mode === 'menu' && (
            <div className="space-y-4">
              {savedGistId && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud className="text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Gist Conectado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-300 bg-gray-900 px-2 py-1 rounded">
                          {savedGistId}
                        </code>
                        <button
                          onClick={handleCopyGistId}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Copiar ID"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleClearGist}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload/Backup */}
                <button
                  onClick={() => setMode('upload')}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                      <Upload className="text-green-400" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Fazer Backup</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Enviar seus projetos para a nuvem e criar um backup seguro
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    {projects.length} projeto(s) local
                  </div>
                </button>

                {/* Download/Restore */}
                <button
                  onClick={() => setMode('download')}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Download className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Restaurar</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Baixar projetos de um Gist existente e sincronizar
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    Importar de outro dispositivo
                  </div>
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
                <h4 className="font-medium text-white mb-2">ℹ️ Como funciona:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Seus projetos são salvos como Gist secreto no GitHub</li>
                  <li>Use o mesmo Gist ID em vários dispositivos para sincronizar</li>
                  <li>É necessário um token do GitHub configurado</li>
                  <li>O backup substitui todos os projetos ao restaurar</li>
                </ul>
              </div>
            </div>
          )}

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Projetos a enviar:</span>
                  <span className="text-lg font-bold text-white">{projects.length}</span>
                </div>
                {savedGistId && (
                  <div className="text-xs text-gray-500 mt-2">
                    Será atualizado o Gist: <code className="text-gray-400">{savedGistId}</code>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-sm text-green-400 mb-3">{success}</p>
                  {gistUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-300 bg-gray-900 px-2 py-1 rounded flex-1">
                          {savedGistId || gistId}
                        </code>
                        <button
                          onClick={handleCopyGistId}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                        >
                          {copied ? 'Copiado!' : 'Copiar ID'}
                        </button>
                      </div>
                      <a
                        href={gistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Ver Gist no GitHub →
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('menu')}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload />
                      {savedGistId ? 'Atualizar Backup' : 'Criar Backup'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Download Mode */}
          {mode === 'download' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID do Gist:
                </label>
                <input
                  type="text"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  placeholder="Ex: 1234567890abcdef1234567890abcdef"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole o ID do Gist que contém seus projetos
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-sm text-green-400">{success}</p>
                </div>
              )}

              {previewData && (
                <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Check className="text-green-400" />
                    Dados Encontrados
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Projetos:</span>
                      <span className="font-bold text-white">{previewData.projects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Último Backup:</span>
                      <span className="text-white">
                        {new Date(previewData.lastSync).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-xs text-yellow-400">
                    ⚠️ Isso vai substituir TODOS os seus {projects.length} projeto(s) atual!
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMode('menu');
                    setPreviewData(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  disabled={loading}
                >
                  Voltar
                </button>
                {!previewData ? (
                  <button
                    onClick={handleDownloadPreview}
                    disabled={loading || !gistId.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Download />
                        Visualizar
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmDownload}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check />
                    Confirmar Importação
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
