import { useEffect, useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { getStorageHealth, exportProjects, importProjects, clearAllProjects, getProjects, saveProjects } from '../utils/storage';
import { Loader2, Database, Download, Upload, Trash2, ShieldCheck } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(2)} ${units[i]}`;
}

export default function StoragePanel({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const h = await getStorageHealth();
      setHealth(h);
      console.log('[StoragePanel] health', h);
      setMessage('');
    } catch (err) {
      console.error('[StoragePanel] Falha ao obter informações de storage', err);
      setMessage('Erro ao obter status do storage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const requestPersistence = async () => {
    if (!('storage' in navigator) || !navigator.storage.persist) {
      setMessage('Persistência não suportada neste navegador');
      return;
    }

    setLoading(true);
    try {
      const ok = await navigator.storage.persist();
      setMessage(ok ? 'Persistência concedida ✅' : 'Persistência NÃO concedida ⚠️');
      await load();
    } catch (err) {
      console.error('[StoragePanel] requestPersistence erro', err);
      setMessage('Erro ao pedir persistência');
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    try {
      await exportProjects();
      setMessage('Exportação iniciada — verifique seu download');
    } catch (err) {
      console.error('[StoragePanel] export erro', err);
      setMessage('Erro ao exportar projetos');
    }
  };

  const onImportClick = () => inputRef.current?.click();

  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    try {
      const res = await importProjects(f);
      console.log('[StoragePanel] import result', res);
      setMessage(`Importados: ${res.imported}`);
      await load();
    } catch (err) {
      console.error('[StoragePanel] import erro', err);
      setMessage('Erro ao importar — verifique o arquivo');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const onClear = async () => {
    if (!confirm('Limpar todos os dados do app? Esta ação é irreversível — faça export antes.')) return;
    setLoading(true);
    try {
      await clearAllProjects();
      // garante que a visualização de projetos seja atualizada ao limpar
      await saveProjects([]);
      setMessage('Storage limpo com sucesso');
      await load();
    } catch (err) {
      console.error('[StoragePanel] clear erro', err);
      setMessage('Erro ao limpar storage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} containerClassName="max-w-3xl bg-dark-700 rounded-md shadow-lg">
      <div className="w-[820px] bg-dark-900 rounded-md overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Database size={18} />
            <div>
              <div className="font-semibold">Storage — diagnóstico e ações</div>
              <div className="text-xs text-gray-400">Informações sobre IndexedDB / quota e ações de manutenção</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded bg-dark-hover text-white">Fechar</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-300"><Loader2 className="animate-spin" /> Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-dark-800 rounded">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="mt-2 font-medium">{health?.supported ? 'Suportado' : 'Não suportado'}</div>
                  <div className="text-xs text-gray-400 mt-2">Persistência: {health?.persisted ? 'Concedida' : 'Não concedida'}</div>
                </div>

                <div className="p-4 bg-dark-800 rounded">
                  <div className="text-xs text-gray-400">Quota</div>
                  <div className="mt-2 font-medium">{formatBytes(health?.usage)} / {formatBytes(health?.quota)}</div>
                  <div className="text-xs text-gray-400 mt-2">Tamanho comprimido estimado (app): {formatBytes(health?.compressedSizeEstimate)}</div>
                </div>

                <div className="p-4 bg-dark-800 rounded">
                  <div className="text-xs text-gray-400">Projetos salvos</div>
                  <div className="mt-2 font-medium">{health?.projectsCount ?? '—'}</div>
                  <div className="text-xs text-gray-400 mt-2">(Número de projetos registrados no storage)</div>
                </div>

                <div className="p-4 bg-dark-800 rounded">
                  <div className="text-xs text-gray-400">Ações</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={onExport} className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Download size={14}/> Exportar</button>
                    <button onClick={onImportClick} className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2"><Upload size={14}/> Importar</button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={requestPersistence} className="px-3 py-2 bg-purple-600 text-white rounded flex items-center gap-2"><ShieldCheck size={14}/> Pedir persistência</button>
                    <button onClick={onClear} className="px-3 py-2 bg-red-700 text-white rounded flex items-center gap-2"><Trash2 size={14}/> Limpar</button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-300">{message}</div>

              <input ref={inputRef} type="file" accept="application/json" onChange={onFileChange} className="hidden" />

            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
