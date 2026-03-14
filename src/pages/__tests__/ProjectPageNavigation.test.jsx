import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProjectPage from '../ProjectPage';
import ProjectCard from '../../components/ProjectCard';
import * as storageUtils from '../../utils/storage';
import * as githubUtils from '../../utils/github';

vi.mock('../../utils/storage');
vi.mock('../../utils/github');
vi.mock('../../components/DrawingCanvas', () => ({
  default: () => <div data-testid="drawing-canvas" />
}));
vi.mock('../../components/ProjectStructureTree', () => ({
  default: () => <div data-testid="project-structure-tree" />
}));
vi.mock('../../components/AIExplanationPanel', () => ({
  default: () => null
}));

const baseProject = {
  id: '1',
  name: 'Projeto de Teste',
  createdAt: '2025-01-01T00:00:00Z',
  repoCreatedAt: '2025-01-01T00:00:00Z',
  description: 'Descricao do projeto',
  owner: 'testuser',
  complexity: 'simple',
  isCompleted: false,
  group: 'backlog',
  languages: ['JavaScript'],
  linesOfCode: { js: 1200 },
  details: {
    readme: '',
    ideas: '',
    improvements: '',
    problems: '',
    purpose: '',
    users: '',
    mvp: '',
    stack: '',
    upgrades: '',
    structure: '',
    sketches: ''
  }
};

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location-display">
      {location.pathname}
      {location.search}
    </div>
  );
}

function HomeStub({ project }) {
  return (
    <div>
      <h1>Home</h1>
      <ProjectCard
        project={project}
        onDelete={() => {}}
        viewMode="list"
      />
    </div>
  );
}

function renderWithRouter(initialEntries) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationDisplay />
      <Routes>
        <Route path="/" element={<HomeStub project={baseProject} />} />
        <Route path="/project/:id" element={<ProjectPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectPage navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageUtils.getProjectById.mockResolvedValue(baseProject);
    storageUtils.updateProject.mockResolvedValue(true);
    storageUtils.getCustomGroups.mockResolvedValue(['backlog', 'in-progress', 'completed']);
    storageUtils.addCustomGroup.mockResolvedValue(true);
    githubUtils.parseGitHubUrl.mockReturnValue(null);
    githubUtils.getGitHubToken.mockReturnValue('');
  });

  it('returns to the previous list route when leaving project details', async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(['/?view=list']);
    });

    expect(screen.getByTestId('location-display')).toHaveTextContent('/?view=list');

    await act(async () => {
      await user.click(screen.getByText('Projeto de Teste'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/project/1');
    });

    const backButton = await screen.findByRole('button', { name: /voltar/i });
    await act(async () => {
      await user.click(backButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/?view=list');
    });
  });

  it('falls back to home when no origin is provided', async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(['/project/1']);
    });

    const backButton = await screen.findByRole('button', { name: /voltar/i });
    await act(async () => {
      await user.click(backButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/');
    });
  });
});
