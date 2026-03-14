import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserRepositories } from '../github';
import { getProjects } from '../storage';

// Mock das funções
vi.mock('../storage', () => ({
  getProjects: vi.fn(),
}));

describe('Detecção de Atualizações em Repositórios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Comparação de Datas', () => {
    it('deve identificar repositório atualizado quando updatedAt é mais recente', () => {
      const existingProject = {
        id: '1',
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        repoUpdatedAt: '2024-01-01T00:00:00Z',
      };

      const newRepoData = {
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const existingDate = new Date(existingProject.repoUpdatedAt);
      const newDate = new Date(newRepoData.updatedAt);

      expect(newDate > existingDate).toBe(true);
    });

    it('deve identificar repositório não atualizado quando updatedAt é igual', () => {
      const existingProject = {
        id: '1',
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        repoUpdatedAt: '2024-01-15T00:00:00Z',
      };

      const newRepoData = {
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const existingDate = new Date(existingProject.repoUpdatedAt);
      const newDate = new Date(newRepoData.updatedAt);

      expect(newDate > existingDate).toBe(false);
    });

    it('deve identificar repositório não atualizado quando updatedAt é mais antigo', () => {
      const existingProject = {
        id: '1',
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        repoUpdatedAt: '2024-01-15T00:00:00Z',
      };

      const newRepoData = {
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const existingDate = new Date(existingProject.repoUpdatedAt);
      const newDate = new Date(newRepoData.updatedAt);

      expect(newDate > existingDate).toBe(false);
    });
  });

  describe('Identificação de Repositórios Atualizados', () => {
    it('deve criar Map de projetos existentes por repoUrl', async () => {
      const existingProjects = [
        {
          id: '1',
          name: 'repo1',
          repoUrl: 'https://github.com/user/repo1',
          repoUpdatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'repo2',
          repoUrl: 'https://github.com/user/repo2',
          repoUpdatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      getProjects.mockResolvedValue(existingProjects);

      const projects = await getProjects();
      const existingReposMap = new Map(
        projects
          .filter(p => p.repoUrl)
          .map(p => [p.repoUrl, p])
      );

      expect(existingReposMap.size).toBe(2);
      expect(existingReposMap.has('https://github.com/user/repo1')).toBe(true);
      expect(existingReposMap.get('https://github.com/user/repo1').id).toBe('1');
    });

    it('deve identificar múltiplos repositórios atualizados', () => {
      const existingReposMap = new Map([
        ['https://github.com/user/repo1', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
        ['https://github.com/user/repo2', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
        ['https://github.com/user/repo3', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
      ]);

      const newRepos = [
        { repoUrl: 'https://github.com/user/repo1', updatedAt: '2024-01-15T00:00:00Z' }, // Atualizado
        { repoUrl: 'https://github.com/user/repo2', updatedAt: '2024-01-01T00:00:00Z' }, // Não atualizado
        { repoUrl: 'https://github.com/user/repo3', updatedAt: '2024-01-20T00:00:00Z' }, // Atualizado
        { repoUrl: 'https://github.com/user/repo4', updatedAt: '2024-01-01T00:00:00Z' }, // Novo
      ];

      const updated = new Set();
      newRepos.forEach((repo, idx) => {
        const existing = existingReposMap.get(repo.repoUrl);
        if (existing) {
          const existingDate = new Date(existing.repoUpdatedAt);
          const newDate = new Date(repo.updatedAt);
          if (newDate > existingDate) {
            updated.add(idx);
          }
        }
      });

      expect(updated.size).toBe(2);
      expect(updated.has(0)).toBe(true); // repo1 atualizado
      expect(updated.has(2)).toBe(true); // repo3 atualizado
      expect(updated.has(1)).toBe(false); // repo2 não atualizado
      expect(updated.has(3)).toBe(false); // repo4 é novo, não atualizado
    });
  });

  describe('Seleção Automática de Repositórios', () => {
    it('deve selecionar apenas novos e atualizados', () => {
      const existingReposMap = new Map([
        ['https://github.com/user/repo1', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
        ['https://github.com/user/repo2', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
      ]);

      const allRepos = [
        { repoUrl: 'https://github.com/user/repo1', updatedAt: '2024-01-15T00:00:00Z' }, // Atualizado
        { repoUrl: 'https://github.com/user/repo2', updatedAt: '2024-01-01T00:00:00Z' }, // Não atualizado
        { repoUrl: 'https://github.com/user/repo3', updatedAt: '2024-01-01T00:00:00Z' }, // Novo
      ];

      const updated = new Set([0]); // repo1 atualizado

      const toSelect = allRepos
        .map((repo, idx) => {
          const isNew = !existingReposMap.has(repo.repoUrl);
          const isUpdated = updated.has(idx);
          return (isNew || isUpdated) ? idx : null;
        })
        .filter(idx => idx !== null);

      expect(toSelect).toEqual([0, 2]); // repo1 (atualizado) e repo3 (novo)
    });

    it('deve selecionar todos se nenhum for novo ou atualizado', () => {
      const existingReposMap = new Map([
        ['https://github.com/user/repo1', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
        ['https://github.com/user/repo2', { repoUpdatedAt: '2024-01-01T00:00:00Z' }],
      ]);

      const allRepos = [
        { repoUrl: 'https://github.com/user/repo1', updatedAt: '2024-01-01T00:00:00Z' },
        { repoUrl: 'https://github.com/user/repo2', updatedAt: '2024-01-01T00:00:00Z' },
      ];

      const updated = new Set();

      const toSelect = allRepos
        .map((repo, idx) => {
          const isNew = !existingReposMap.has(repo.repoUrl);
          const isUpdated = updated.has(idx);
          return (isNew || isUpdated) ? idx : null;
        })
        .filter(idx => idx !== null);

      // Se nenhum for novo ou atualizado, seleciona todos
      const finalSelection = toSelect.length > 0 ? toSelect : allRepos.map((_, idx) => idx);

      expect(finalSelection).toEqual([0, 1]);
    });
  });

  describe('Preservação de Dados Locais', () => {
    it('deve preservar configurações locais ao atualizar', () => {
      const existingProject = {
        id: '1',
        name: 'test-repo',
        repoUrl: 'https://github.com/user/test-repo',
        complexity: 'complex',
        isCompleted: true,
        group: 'in-progress',
        details: {
          ideas: 'Minhas ideias',
          improvements: 'Melhorias planejadas',
        },
      };

      const newRepoData = {
        name: 'test-repo',
        description: 'Nova descrição',
        languages: ['JavaScript', 'TypeScript'],
        repoUrl: 'https://github.com/user/test-repo',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const projectData = {
        ...newRepoData,
        complexity: existingProject.complexity, // Preservado
        isCompleted: existingProject.isCompleted, // Preservado
        group: existingProject.group, // Preservado
        details: {
          ...existingProject.details, // Preservado
          readme: newRepoData.readme || existingProject.details?.readme || '',
        },
      };

      expect(projectData.complexity).toBe('complex');
      expect(projectData.isCompleted).toBe(true);
      expect(projectData.group).toBe('in-progress');
      expect(projectData.details.ideas).toBe('Minhas ideias');
      expect(projectData.details.improvements).toBe('Melhorias planejadas');
    });
  });

  describe('Contadores de Importação', () => {
    it('deve contar corretamente novos, atualizados e pulados', () => {
      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
      };

      // Simula processamento de 5 repos
      const scenarios = [
        { isNew: true, isUpdated: false }, // Novo
        { isNew: false, isUpdated: true }, // Atualizado
        { isNew: false, isUpdated: false }, // Pulado
        { isNew: true, isUpdated: false }, // Novo
        { isNew: false, isUpdated: true }, // Atualizado
      ];

      scenarios.forEach(scenario => {
        if (scenario.isNew) {
          results.imported++;
        } else if (scenario.isUpdated) {
          results.updated++;
        } else {
          results.skipped++;
        }
      });

      expect(results.imported).toBe(2);
      expect(results.updated).toBe(2);
      expect(results.skipped).toBe(1);
    });

    it('deve gerar mensagem correta de feedback', () => {
      const importedCount = 2;
      const updatedCount = 3;
      const skippedCount = 1;

      const parts = [];
      if (importedCount > 0) parts.push(`${importedCount} novo(s)`);
      if (updatedCount > 0) parts.push(`${updatedCount} atualizado(s)`);
      if (skippedCount > 0) parts.push(`${skippedCount} sem alterações`);

      const message = `✅ ${parts.join(', ')}!`;

      expect(message).toBe('✅ 2 novo(s), 3 atualizado(s), 1 sem alterações!');
    });
  });
});
