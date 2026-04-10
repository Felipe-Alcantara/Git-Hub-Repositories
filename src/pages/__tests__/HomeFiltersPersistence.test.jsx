import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import Home from '../Home';

const mockProjects = [
  {
    id: '1',
    name: 'Projeto API',
    description: 'Descricao de API',
    languages: ['JavaScript', 'TypeScript'],
    owner: 'tester',
    isCompleted: false,
    complexity: 'complex',
    createdAt: '2025-01-01T00:00:00Z',
    repoCreatedAt: '2025-01-01T00:00:00Z',
    linesOfCode: { js: 1200 },
    group: 'backlog',
    details: { readme: 'README content' },
  },
];

vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => ({
    projects: mockProjects,
    loading: false,
    addProject: vi.fn(),
    deleteProject: vi.fn(),
    updateProject: vi.fn(),
    reorderProjects: vi.fn(),
  }),
}));

vi.mock('../../components/TutorialModal', () => ({ default: () => null }));
vi.mock('../../components/NewProjectModal', () => ({ default: () => null }));
vi.mock('../../components/ImportExportButtons', () => ({ default: () => null }));
vi.mock('../../components/ImportProfileModal', () => ({ default: () => null }));
vi.mock('../../components/GitHubTokenModal', () => ({ default: () => null }));
vi.mock('../../components/GistSyncModal', () => ({ default: () => null }));
vi.mock('../../components/ProjectCard', () => ({
  default: ({ project }) => <div>{project.name}</div>,
}));

vi.mock('../../utils/storage', () => ({
  saveProjects: vi.fn(),
  getCustomOrder: vi.fn().mockResolvedValue([]),
  saveCustomOrder: vi.fn(),
  getCustomGroups: vi.fn().mockResolvedValue(['backlog', 'in-progress', 'completed']),
  addCustomGroup: vi.fn(),
  saveGroupsOrder: vi.fn(),
  deleteCustomGroup: vi.fn(),
}));

describe('Home filter persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'homeFilters') {
        return JSON.stringify({
          searchTerm: 'api',
          filterComplexity: 'complex',
          filterStatus: 'in-progress',
          filterTags: ['JavaScript'],
          filterOwners: ['tester'],
          filterReadme: 'with',
          sortBy: 'name',
        });
      }
      if (key === 'homeViewMode') return 'list';
      if (key === 'homeScrollPosition') return '420';
      if (key === 'seenHelpBalloon') return 'true';
      return null;
    });
  });

  it('restores filters from localStorage on mount', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByPlaceholderText('Buscar projetos...')).toHaveValue('api');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Filtros/i }));
    });

    expect(screen.getByDisplayValue('Nome (A-Z)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Complexo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Em andamento')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Com README')).toBeInTheDocument();
    expect(screen.getByText('Limpar filtros de tecnologias')).toBeInTheDocument();
    expect(screen.getByText('Limpar filtros de autores')).toBeInTheDocument();
  });

  it('restores the saved scroll position after rendering', async () => {
    window.scrollTo = vi.fn();

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 420, behavior: 'auto' });
    });
  });
});
