import { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';

export default function TutorialModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    // Não verificar ou usar localStorage para ocultar o tutorial — sempre permitir a abertura
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-surface z-10">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Como funciona — Guia rápido</h2>
              <p className="text-sm text-gray-400 mt-1">Pequeno tour com as principais funcionalidades do site</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* checkbox 'Não mostrar novamente' removido por solicitação */}
            <button onClick={handleClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-sm text-gray-300">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">📋 Painel Principal</h3>
            <p>Visualize seus projetos em Grid, Lista ou Kanban. Use os filtros, busca e tags no topo para encontrar projetos rapidamente.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">➕ Adicionar projeto</h3>
            <p>Clique em <strong>Novo Projeto</strong> para criar manualmente ou cole a URL do GitHub para importar automaticamente o repositório (inclui README se disponível). Você pode importar repositórios de qualquer perfil ou organização, não precisa ser o seu próprio repositório.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">🧠 Explicações com IA</h3>
            <p>Abra o painel lateral de IA para gerar ou interagir com explicações do projeto. O chat salva o histórico e lembra a aba ativa do projeto.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">⚙️ Configurações</h3>
            <p>Configure tokens do GitHub e a chave do Google Gemini em <strong>Configurações de API</strong>, acesso seguro salvo no navegador.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">🔁 Import/Export</h3>
            <p>Use o botão <strong>Sincronizar</strong> para salvar em Gist, e as opções de exportar/importar para backup.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">✨ Dicas rápidas</h3>
            <ul className="list-disc list-inside ml-4 text-gray-300">
              <li>Arraste os projetos para reordenar ou mover entre colunas no Kanban</li>
              <li>Clique no ícone do README no card para ver rapidamente se há documentação</li>
              <li>Use o botão de ajuda (canto inferior direito) para abrir este tutorial a qualquer momento</li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-dark-border flex items-center justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 bg-dark-hover rounded-lg text-white hover:bg-dark-border">Fechar</button>
        </div>
      </div>
    </div>
  );
}
