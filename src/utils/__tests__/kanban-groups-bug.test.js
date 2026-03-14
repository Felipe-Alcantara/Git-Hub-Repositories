import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getCustomGroups, 
  addCustomGroup, 
  saveGroupsOrder,
  updateProject,
  addProject,
  getProjects 
} from '../storage';

describe('Bug: Grupo Kanban criado em ProjectPage não aparece na Home', () => {
  beforeEach(async () => {
    // Limpa o storage antes de cada teste
    vi.clearAllMocks();
  });

  it('deve adicionar novo grupo ao storage quando criado em ProjectPage', async () => {
    // Simula criação de um novo grupo na página de detalhes
    const newGroupName = 'testing-phase';
    
    // Adiciona o grupo
    const added = await addCustomGroup(newGroupName);
    expect(added).toBe(true);
    
    // Verifica se o grupo foi adicionado
    const groups = await getCustomGroups();
    expect(groups).toContain(newGroupName);
  });

  it('deve manter o grupo após atualizar o projeto com o novo grupo', async () => {
    // Cria um projeto
    const project = await addProject({
      name: 'Test Project',
      group: 'backlog',
    });

    // Cria um novo grupo
    const newGroupName = 'custom-group';
    await addCustomGroup(newGroupName);

    // Atualiza o projeto para o novo grupo
    await updateProject(project.id, { group: newGroupName });

    // Verifica se o grupo ainda existe
    const groups = await getCustomGroups();
    expect(groups).toContain(newGroupName);

    // Verifica se o projeto foi atualizado
    const projects = await getProjects();
    const updatedProject = projects.find(p => p.id === project.id);
    expect(updatedProject.group).toBe(newGroupName);
  });

  it('deve carregar grupos customizados na Home após serem criados em ProjectPage', async () => {
    // Simula o fluxo completo:
    // 1. Usuário está na Home e vê grupos padrão
    const initialGroups = await getCustomGroups();
    expect(initialGroups).toEqual(['backlog', 'in-progress', 'completed']);

    // 2. Usuário vai para ProjectPage e cria um novo grupo
    const newGroup = 'review';
    await addCustomGroup(newGroup);

    // 3. Usuário volta para Home e deve ver o novo grupo
    const updatedGroups = await getCustomGroups();
    expect(updatedGroups).toContain(newGroup);
    expect(updatedGroups).toContain('backlog');
    expect(updatedGroups).toContain('in-progress');
    expect(updatedGroups).toContain('completed');
  });

  it('deve detectar grupos de projetos que não estão na lista de grupos customizados', async () => {
    // Simula um projeto com um grupo que não está na lista
    const orphanGroup = 'orphan-group';
    await addProject({
      name: 'Orphan Project',
      group: orphanGroup,
    });

    // Busca todos os projetos
    const projects = await getProjects();
    const projectGroups = [...new Set(projects.map(p => p.group || ''))].filter(Boolean);

    // Busca grupos customizados
    const customGroups = await getCustomGroups();

    // Identifica grupos órfãos
    const orphanGroups = projectGroups.filter(pg => !customGroups.includes(pg));

    // Deve encontrar o grupo órfão
    expect(orphanGroups).toContain(orphanGroup);

    // Simula o que a Home deveria fazer: adicionar grupos órfãos
    if (orphanGroups.length > 0) {
      const updatedGroups = [...customGroups, ...orphanGroups];
      await saveGroupsOrder(updatedGroups);
    }

    // Verifica se o grupo órfão foi adicionado
    const finalGroups = await getCustomGroups();
    expect(finalGroups).toContain(orphanGroup);
  });

  it('deve normalizar nomes de grupos corretamente', async () => {
    // Testa normalização de nomes
    const testCases = [
      { input: 'Test Group', expected: 'test-group' },
      { input: 'UPPERCASE', expected: 'uppercase' },
      { input: '  spaces  ', expected: 'spaces' },
      { input: 'Multiple   Spaces', expected: 'multiple-spaces' },
    ];

    for (const { input, expected } of testCases) {
      await addCustomGroup(input);
      const groups = await getCustomGroups();
      expect(groups).toContain(expected);
    }
  });

  it('não deve adicionar grupos duplicados', async () => {
    const groupName = 'duplicate-test';
    
    // Adiciona o grupo pela primeira vez
    const firstAdd = await addCustomGroup(groupName);
    expect(firstAdd).toBe(true);

    // Tenta adicionar novamente
    const secondAdd = await addCustomGroup(groupName);
    expect(secondAdd).toBe(false);

    // Verifica que há apenas uma ocorrência
    const groups = await getCustomGroups();
    const occurrences = groups.filter(g => g === groupName).length;
    expect(occurrences).toBe(1);
  });
});
