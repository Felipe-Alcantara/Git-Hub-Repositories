import { Upload, Download, FileJson } from 'lucide-react';
import { exportProjects, importProjects } from '../utils/storage';
import { useState } from 'react';

export default function ImportExportButtons({ onImportComplete }) {
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    exportProjects();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importProjects(file);
      alert(`✅ ${result.imported} projeto(s) importado(s) com sucesso!`);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      alert(`❌ Erro ao importar: ${error.message}`);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="flex gap-3">
      {/* Exportar */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Exportar Projetos</span>
      </button>

      {/* Importar */}
      <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
        {importing ? (
          <>
            <FileJson className="w-4 h-4 animate-pulse" />
            <span>Importando...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Importar Projetos</span>
          </>
        )}
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          disabled={importing}
        />
      </label>
    </div>
  );
}
