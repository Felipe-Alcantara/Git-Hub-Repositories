import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import ImportProfileModal from '../ImportProfileModal';
import * as githubUtils from '../../utils/github';
import * as storageUtils from '../../utils/storage';

// Mock das dependências
vi.mock('../../utils/github');
vi.mock('../../utils/storage');

describe('ImportProfileModal - Detecção de Atualizações', () => {
  const mockOnClose = vi.fn();
  const mockOnImport = vi.fn();
  const mockOnOpenToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock do getProjects retornando projetos existentes
    storageUtils.getProjects.mockResolvedValue([
      {
        id: '1',
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
        repoUpdatedAt: '2024-01-01T00:00:00Z',
        complexity: 'medium',
        isCompleted: false,
        group: 'backlog',
      },
      {
        id: '2',
        name: 'repo2',
        repoUrl: 'https://github.com/testuser/repo2',
        repoUpdatedAt: '2024-01-01T00:00:00Z',
        complexity: 'complex',
        isCompleted: true,
        group: 'completed',
      },
    ]);
  });

  it('deve exibir badge "Atualizado" em repositórios com atualizações', async () => {
    const mockRepos = [
      {
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
        updatedAt: '2024-01-15T00:00:00Z', // Atualizado
        owner: 'testuser',
        description: 'Test repo 1',
        language: 'JavaScript',
        stars: 10,
        forks: 5,
      },
      {
        name: 'repo2',
        repoUrl: 'https://github.com/testuser/repo2',
        updatedAt: '2024-01-01T00:00:00Z', // Não atualizado
        owner: 'testuser',
        description: 'Test repo 2',
        language: 'TypeScript',
        stars: 20,
        forks: 10,
      },
    ];

    githubUtils.fetchUserRepositories.mockResolvedValue(mockRepos);

    await act(async () => {
      render(
        <ImportProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          onOpenToken={mockOnOpenToken}
        />
      );
    });

    const input = screen.getByPlaceholderText(/Ex: Felipe-Alcantara/i);
    
    await act(async () => {
      await userEvent.type(input, 'testuser');
    });

    const searchButton = screen.getByRole('button', { name: /Buscar/i });
    
    await act(async () => {
      await userEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText('repo1')).toBeInTheDocument();
    });

    // Verifica se o badge "Atualizado" aparece apenas no repo1
    expect(screen.getByText('✨ Atualizado')).toBeInTheDocument();
    
    // Verifica que há apenas 1 badge de atualizado
    const updatedBadges = screen.getAllByText('✨ Atualizado');
    expect(updatedBadges).toHaveLength(1);
  });

  it('deve selecionar automaticamente apenas repositórios novos e atualizados', async () => {
    const mockRepos = [
      {
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
        updatedAt: '2024-01-15T00:00:00Z', // Atualizado
        owner: 'testuser',
        description: 'Test repo 1',
        language: 'JavaScript',
        stars: 10,
        forks: 5,
      },
      {
        name: 'repo2',
        repoUrl: 'https://github.com/testuser/repo2',
        updatedAt: '2024-01-01T00:00:00Z', // Não atualizado
        owner: 'testuser',
        description: 'Test repo 2',
        language: 'TypeScript',
        stars: 20,
        forks: 10,
      },
      {
        name: 'repo3',
        repoUrl: 'https://github.com/testuser/repo3',
        updatedAt: '2024-01-10T00:00:00Z', // Novo
        owner: 'testuser',
        description: 'Test repo 3',
        language: 'Python',
        stars: 5,
        forks: 2,
      },
    ];

    githubUtils.fetchUserRepositories.mockResolvedValue(mockRepos);

    await act(async () => {
      render(
        <ImportProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          onOpenToken={mockOnOpenToken}
        />
      );
    });

    const input = screen.getByPlaceholderText(/Ex: Felipe-Alcantara/i);
    
    await act(async () => {
      await userEvent.type(input, 'testuser');
    });

    const searchButton = screen.getByRole('button', { name: /Buscar/i });
    
    await act(async () => {
      await userEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText('repo1')).toBeInTheDocument();
    });

    // Verifica que o botão de importar mostra "Importar 2" (repo1 atualizado + repo3 novo)
    const importButton = screen.getByRole('button', { name: /Importar 2/i });
    expect(importButton).toBeInTheDocument();
  });

  it('deve preservar dados locais ao atualizar repositório', async () => {
    const mockRepos = [
      {
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
        updatedAt: '2024-01-15T00:00:00Z',
        owner: 'testuser',
        description: 'Nova descrição',
        language: 'JavaScript',
        stars: 10,
        forks: 5,
        defaultBranch: 'main',
      },
    ];

    githubUtils.fetchUserRepositories.mockResolvedValue(mockRepos);
    githubUtils.fetchGitHubLanguages.mockResolvedValue({ JavaScript: 50000 });
    githubUtils.fetchGitHubReadme.mockResolvedValue('# README atualizado');

    await act(async () => {
      render(
        <ImportProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          onOpenToken={mockOnOpenToken}
        />
      );
    });

    const input = screen.getByPlaceholderText(/Ex: Felipe-Alcantara/i);
    
    await act(async () => {
      await userEvent.type(input, 'testuser');
    });

    const searchButton = screen.getByRole('button', { name: /Buscar/i });
    
    await act(async () => {
      await userEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText('repo1')).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: /Importar/i });
    
    await act(async () => {
      await userEvent.click(importButton);
    });

    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalled();
    });

    // Verifica que onImport foi chamado com dados preservados
    const importedData = mockOnImport.mock.calls[0][0];
    expect(importedData.complexity).toBe('medium'); // Preservado
    expect(importedData.isCompleted).toBe(false); // Preservado
    expect(importedData.group).toBe('backlog'); // Preservado
    expect(importedData.description).toBe('Nova descrição'); // Atualizado
  });

  it('deve exibir mensagem informando quantidade de atualizações detectadas', async () => {
    const mockRepos = [
      {
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
        updatedAt: '2024-01-15T00:00:00Z', // Atualizado
        owner: 'testuser',
        description: 'Test repo 1',
        language: 'JavaScript',
        stars: 10,
        forks: 5,
      },
      {
        name: 'repo2',
        repoUrl: 'https://github.com/testuser/repo2',
        updatedAt: '2024-01-20T00:00:00Z', // Atualizado
        owner: 'testuser',
        description: 'Test repo 2',
        language: 'TypeScript',
        stars: 20,
        forks: 10,
      },
    ];

    githubUtils.fetchUserRepositories.mockResolvedValue(mockRepos);

    await act(async () => {
      render(
        <ImportProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          onOpenToken={mockOnOpenToken}
        />
      );
    });

    const input = screen.getByPlaceholderText(/Ex: Felipe-Alcantara/i);
    
    await act(async () => {
      await userEvent.type(input, 'testuser');
    });

    const searchButton = screen.getByRole('button', { name: /Buscar/i });
    
    await act(async () => {
      await userEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/2 repositório\(s\) com atualizações detectadas/i)).toBeInTheDocument();
    });
  });

  it('deve chamar onImport com ID existente para atualização', async () => {
    const mockRepos = [
      {
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
        updatedAt: '2024-01-15T00:00:00Z',
        owner: 'testuser',
        description: 'Test repo 1',
        language: 'JavaScript',
        stars: 10,
        forks: 5,
        defaultBranch: 'main',
      },
    ];

    githubUtils.fetchUserRepositories.mockResolvedValue(mockRepos);
    githubUtils.fetchGitHubLanguages.mockResolvedValue({ JavaScript: 50000 });
    githubUtils.fetchGitHubReadme.mockResolvedValue('# README');

    await act(async () => {
      render(
        <ImportProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          onOpenToken={mockOnOpenToken}
        />
      );
    });

    const input = screen.getByPlaceholderText(/Ex: Felipe-Alcantara/i);
    
    await act(async () => {
      await userEvent.type(input, 'testuser');
    });

    const searchButton = screen.getByRole('button', { name: /Buscar/i });
    
    await act(async () => {
      await userEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText('repo1')).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: /Importar/i });
    
    await act(async () => {
      await userEvent.click(importButton);
    });

    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalled();
    });

    // Verifica que foi chamado com o ID do projeto existente
    expect(mockOnImport).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'repo1',
        repoUrl: 'https://github.com/testuser/repo1',
      }),
      '1' // ID do projeto existente
    );
  });
});
