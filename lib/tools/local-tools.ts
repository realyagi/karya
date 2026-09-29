import { KaryaNote, KaryaTask, TaskPriority } from '@/types/karya';
import { getCurrentDateTime } from '@/lib/time/current-time';
import { ToolRegistry, ToolResult } from '@/lib/tools';
import { KaryaMemory } from '@/types/memory';

export interface LocalToolOperations {
  addTask(task: KaryaTask): void;
  updateTask(id: string, patch: Partial<KaryaTask>): void;
  deleteTask(id: string): void;
  deleteAllTasks(): void;
  addNote(note: KaryaNote): void;
  updateNote(id: string, content: string): void;
  getTimezone?(): string | undefined;
  addMemory?(memory: KaryaMemory): void;
  getMemories?(): KaryaMemory[];
}

interface TaskParams { task: KaryaTask }
interface TaskMatchParams { task: KaryaTask; patch: Partial<KaryaTask> }
interface DeleteParams { taskId: string }
interface NoteParams { note: KaryaNote }
interface NoteAppendParams { note: KaryaNote; content: string }

function calculateExpression(expression: string): number {
  const tokens = expression.replace(/\s+/g, '').match(/\d+(?:\.\d+)?|[()+\-*/%]/g);
  if (!tokens || tokens.join('') !== expression.replace(/\s+/g, '')) throw new Error('Only basic arithmetic is supported.');
  const values: number[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };
  const apply = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (!operator || left === undefined || right === undefined) throw new Error('Invalid arithmetic expression.');
    if (operator === '+') values.push(left + right);
    if (operator === '-') values.push(left - right);
    if (operator === '*') values.push(left * right);
    if (operator === '/') values.push(left / right);
    if (operator === '%') values.push(left % right);
  };
  for (const token of tokens) {
    if (/^\d/.test(token)) values.push(Number(token));
    else if (token === '(') operators.push(token);
    else if (token === ')') {
      while (operators.at(-1) && operators.at(-1) !== '(') apply();
      if (operators.pop() !== '(') throw new Error('Invalid arithmetic expression.');
    } else {
      while (true) {
        const topOperator = operators.at(-1);
        if (!topOperator || topOperator === '(' || precedence[topOperator] < precedence[token]) break;
        apply();
      }
      operators.push(token);
    }
  }
  while (operators.length) {
    if (operators.at(-1) === '(') throw new Error('Invalid arithmetic expression.');
    apply();
  }
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error('Invalid arithmetic result.');
  return values[0];
}

function result<T>(tool: string, message: string, data?: T): ToolResult<T> {
  return { success: true, tool, message, data };
}

export function createLocalToolRegistry(
  operations: LocalToolOperations,
  getTasks: () => KaryaTask[],
  getNotes: () => KaryaNote[]
): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register({
    name: 'tasks.create',
    displayName: 'Create task',
    description: 'Create a task in local KARYA storage.',
    category: 'tasks',
    parametersSchema: { task: 'KaryaTask' },
    execute: async (params) => {
      const { task } = params as unknown as TaskParams;
      operations.addTask(task);
      return result('tasks.create', `Created task: ${task.title}.`, task);
    },
  });

  registry.register({
    name: 'memory.store',
    displayName: 'Remember',
    description: 'Store an explicit, non-sensitive user memory locally.',
    category: 'system',
    parametersSchema: { memory: 'KaryaMemory' },
    execute: async (params) => {
      const memory = (params as { memory: KaryaMemory }).memory;
      operations.addMemory?.(memory);
      return result('memory.store', 'I will remember that.', memory);
    },
  });

  registry.register({
    name: 'memory.search',
    displayName: 'Search memory',
    description: 'Search explicit local memories.',
    category: 'system',
    parametersSchema: { query: 'string' },
    execute: async (params) => {
      const query = (params as { query: string }).query.toLowerCase();
      const matches = (operations.getMemories?.() || []).filter((memory) => memory.content.toLowerCase().includes(query));
      return result('memory.search', matches.length ? matches.map((memory) => memory.content).join('; ') : 'I do not have a matching memory.', matches);
    },
  });

  registry.register({
    name: 'tasks.complete',
    displayName: 'Complete task',
    description: 'Mark a local task as completed.',
    category: 'tasks',
    parametersSchema: { task: 'KaryaTask' },
    execute: async (params) => {
      const { task } = params as unknown as TaskParams;
      operations.updateTask(task.id, { status: 'completed' });
      return result('tasks.complete', `Completed task: ${task.title}.`, task);
    },
  });

  registry.register({
    name: 'tasks.update',
    displayName: 'Update task',
    description: 'Update a local task.',
    category: 'tasks',
    parametersSchema: { task: 'KaryaTask', patch: 'TaskPatch' },
    execute: async (params) => {
      const { task, patch } = params as unknown as TaskMatchParams;
      operations.updateTask(task.id, patch);
      return result('tasks.update', `Updated task: ${task.title}.`, { task, patch });
    },
  });

  registry.register({
    name: 'tasks.delete',
    displayName: 'Delete task',
    description: 'Delete a local task after confirmation.',
    category: 'tasks',
    parametersSchema: { taskId: 'string' },
    requiresConfirmation: true,
    execute: async (params) => {
      const { taskId } = params as unknown as DeleteParams;
      const task = getTasks().find((item) => item.id === taskId);
      if (!task) return { success: false, tool: 'tasks.delete', message: 'Task was not found.', error: 'TASK_NOT_FOUND' };
      operations.deleteTask(taskId);
      return result('tasks.delete', `Deleted task: ${task.title}.`, task);
    },
  });

  registry.register({
    name: 'tasks.delete_all',
    displayName: 'Delete all tasks',
    description: 'Delete every local task after confirmation.',
    category: 'tasks',
    parametersSchema: {},
    requiresConfirmation: true,
    execute: async () => {
      operations.deleteAllTasks();
      return result('tasks.delete_all', 'Deleted all local tasks.');
    },
  });

  registry.register({
    name: 'notes.create',
    displayName: 'Create note',
    description: 'Create a note in local KARYA storage.',
    category: 'notes',
    parametersSchema: { note: 'KaryaNote' },
    execute: async (params) => {
      const { note } = params as unknown as NoteParams;
      operations.addNote(note);
      return result('notes.create', `Created note: ${note.title}.`, note);
    },
  });

  registry.register({
    name: 'notes.append',
    displayName: 'Append note',
    description: 'Append content to a local note.',
    category: 'notes',
    parametersSchema: { note: 'KaryaNote', content: 'string' },
    execute: async (params) => {
      const { note, content } = params as unknown as NoteAppendParams;
      const existing = getNotes().find((item) => item.id === note.id);
      if (existing) operations.updateNote(existing.id, `${existing.content}${existing.content ? '\n' : ''}${content}`);
      else operations.addNote({ ...note, content });
      return result('notes.append', `Updated note: ${note.title}.`, note);
    },
  });

  registry.register({
    name: 'notes.find',
    displayName: 'Search notes',
    description: 'Search local note titles and content.',
    category: 'notes',
    parametersSchema: { query: 'string' },
    execute: async (params) => {
      const { query } = params as { query: string };
      const matches = getNotes().filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query.toLowerCase()));
      return result('notes.find', matches.length ? `Found ${matches.length} matching note${matches.length === 1 ? '' : 's'}.` : 'No matching notes found.', matches);
    },
  });

  registry.register({
    name: 'time.current',
    displayName: 'Current date and time',
    description: 'Read the current runtime date, time, day, and timezone.',
    category: 'system',
    parametersSchema: {},
    execute: async () => result('time.current', 'Current date and time retrieved.', getCurrentDateTime(new Date(), operations.getTimezone?.())),
  });

  registry.register({
    name: 'calculator.calculate',
    displayName: 'Calculate',
    description: 'Evaluate basic arithmetic without executing arbitrary code.',
    category: 'system',
    parametersSchema: { expression: 'string' },
    execute: async (params) => {
      try {
        const expression = (params as { expression: string }).expression;
        const value = calculateExpression(expression);
        return result('calculator.calculate', `${expression} equals ${value}.`, value);
      } catch (error) {
        return { success: false, tool: 'calculator.calculate', message: 'I could not calculate that safely.', error: error instanceof Error ? error.message : 'CALCULATION_FAILED' };
      }
    },
  });

  return registry;
}

export function createTaskFromInput(title: string, priority: TaskPriority = 'medium', dueDate?: string): KaryaTask {
  const now = new Date().toISOString();
  return {
    id: `task-${crypto.randomUUID()}`,
    title,
    description: `Created from voice input: ${title}`,
    status: 'todo',
    priority,
    dueDate,
    createdAt: now,
    updatedAt: now,
  };
}