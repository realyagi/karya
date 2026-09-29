import { ConversationMessage, ActivityEvent, ToolCall, KaryaTask, KaryaNote, TaskPriority } from '@/types/karya';
import { getRelativeDate } from '@/lib/time/current-time';

export interface AgentContext {
  sessionId: string;
  history: ConversationMessage[];
  availableTools: string[];
  lastReferencedItem?: {
    type: 'task' | 'note' | 'calendar_event';
    id?: string;
    title?: string;
    time?: string;
  };
}

export interface AgentDecision {
  thought: string;
  action: 'respond' | 'call_tool' | 'ask_clarification';
  selectedTool?: ToolCall;
  responseDraft?: string;
}

export interface ParsedTaskIntent {
  action:
    | 'none'
    | 'create'
    | 'complete'
    | 'delete'
    | 'delete_all'
    | 'show'
    | 'urgent'
    | 'move'
    | 'priority'
    | 'note_create'
    | 'note_append'
    | 'note_find'
    | 'time_current'
    | 'calculate'
    | 'memory_store'
    | 'memory_search'
    | 'plan_day'
    // Contextual follow-ups
    | 'followup_time'
    | 'followup_due_date';
  taskTitle?: string;
  noteTitle?: string;
  noteContent?: string;
  dueDate?: string;
  priority?: TaskPriority;
  message?: string;
  task?: KaryaTask;
  tasks?: KaryaTask[];
  note?: KaryaNote;
  notes?: KaryaNote[];
}

export function parseVoiceIntent(
  input: string,
  tasks: KaryaTask[],
  notes: KaryaNote[],
  context?: AgentContext
): ParsedTaskIntent {
  const text = input.trim();
  if (!text) return { action: 'none' };
  const lower = text.toLowerCase();

  // Short-term conversational context / follow-up resolution
  // Example 1: User previously asked "What's on my calendar tomorrow?" -> "Move it to 5"
  const moveItMatch = text.match(/^move (?:it|that|the meeting|the event)\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (moveItMatch && context?.lastReferencedItem?.type === 'calendar_event') {
    return {
      action: 'followup_time',
      message: `${moveItMatch[1]}:${moveItMatch[2] || '00'} ${moveItMatch[3] || ''}`.trim(),
    };
  }

  // Example 2: KARYA asked "When is it due?" -> User responds "Friday" or "tomorrow"
  if (
    context?.lastReferencedItem?.type === 'task' &&
    context.lastReferencedItem.title &&
    !context.lastReferencedItem.id
  ) {
    const relative = getRelativeDate(lower);
    if (relative) {
      return {
        action: 'followup_due_date',
        taskTitle: context.lastReferencedItem.title,
        dueDate: relative,
        message: `Set due date to ${relative} for ${context.lastReferencedItem.title}.`,
      };
    }
  }

  // Date and Time
  if (/\b(what(?:'s| is) the date|what date is it|what time is it|what(?:'s| is) the time|right now)\b/i.test(lower)) {
    return { action: 'time_current' };
  }

  // Calculator
  const calculation = text.match(/^(?:calculate|what is)\s+([\d\s()+\-*/%.]+)\??$/i) ||
                      text.match(/^(?:calculate|what is)\s+(?:(\d+)\s+percent\s+of\s+(\d+))\??$/i);
  if (calculation) {
    if (calculation[2] !== undefined) {
      // 25 percent of 840 -> (25/100)*840
      const expr = `(${calculation[1]}/100)*${calculation[2]}`;
      return { action: 'calculate', message: expr };
    }
    return { action: 'calculate', message: calculation[1] };
  }

  // Memory
  const memoryStore = text.match(/^(?:remember that|remember)\s+(.+)/i);
  if (memoryStore) return { action: 'memory_store', message: memoryStore[1].replace(/[.]$/, '').trim() };
  if (/(?:what do you remember|search my memory|my preferences|what do you know about me)/i.test(lower)) {
    return { action: 'memory_search', message: lower.replace(/.*(?:about|for)\s+/i, '').trim() || 'preferences' };
  }

  // Day Planner
  if (/^plan my day(?: tomorrow| today| next week)?[.!?]*$/i.test(text) || lower.includes('plan my day')) {
    return { action: 'plan_day' };
  }

  // Notes: create, append, find
  const createNoteMatch = text.match(/(?:create a note|make a note|take a note)\s*(?:called |named |about |that )?['"]?([^'".]+?)['"]?(?:\.|$)/i);
  if (createNoteMatch) {
    const title = createNoteMatch[1].trim();
    return {
      action: 'note_create',
      noteTitle: title,
      note: {
        id: `note-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()}`,
        title,
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: `Created note: ${title}.`,
    };
  }

  const noteAppendMatch = text.match(/add this to my ([^\.]+?) note/i);
  if (noteAppendMatch) {
    const title = noteAppendMatch[1].trim();
    const existing = notes.find((note) => note.title.toLowerCase() === title.toLowerCase());
    const content = text.replace(/.*add this to my .*? note\s*/i, '').trim() || 'Added from voice input.';
    return {
      action: 'note_append',
      noteTitle: title,
      noteContent: content,
      note: existing ?? {
        id: `note-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()}`,
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: existing ? `Added to your ${title} note.` : `Created and added to ${title}.`,
    };
  }

  const noteFindMatch = text.match(/(?:find|search) (?:my )?([^\.]+?) notes?/i);
  if (noteFindMatch) {
    const title = noteFindMatch[1].trim();
    const match = notes.filter((note) => note.title.toLowerCase().includes(title.toLowerCase()));
    return {
      action: 'note_find',
      noteTitle: title,
      notes: match,
      message: match.length ? `I found ${match.length} note${match.length > 1 ? 's' : ''} matching ${title}.` : `I did not find a note matching ${title}.`,
    };
  }

  // Tasks: create
  const createMatch = text.match(/(?:create|add) a task (?:to|for) (.+)/i) || text.match(/(?:create|add) task (?:to|for) (.+)/i);
  if (createMatch) {
    let title = createMatch[1].replace(/\.$/, '').trim();
    const priorityMatch = text.match(/priority (?:to )?(low|medium|high)/i);
    const dueDate = getRelativeDate(text) ?? (text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1]);
    
    // Clean relative date phrases out of title
    title = title.replace(/\b(tomorrow|today|next week|next \w+|this \w+)\b/gi, '').trim();

    const task: KaryaTask = {
      id: `task-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()}`,
      title: title || 'New task',
      description: `Created from voice input: ${text}`,
      status: 'todo',
      priority: priorityMatch ? (priorityMatch[1].toLowerCase() as TaskPriority) : 'medium',
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      action: 'create',
      taskTitle: task.title,
      dueDate,
      priority: task.priority,
      task,
      message: `Created task: ${task.title}${dueDate ? ` due ${dueDate}` : ''}.`,
    };
  }

  if (lower.includes('delete all my tasks')) {
    return { action: 'delete_all', message: 'This will delete all tasks. Continue?' };
  }

  const deleteMatch = text.match(/delete (?:my )?([^\.]+?) task/i) || text.match(/remove (?:my )?([^\.]+?) task/i);
  if (deleteMatch) {
    const title = deleteMatch[1].trim();
    return { action: 'delete', taskTitle: title, message: `Delete the task named "${title}"?` };
  }

  const completeMatch = text.match(/complete (?:my )?([^\.]+?) task/i) ||
                        text.match(/mark (?:my )?([^\.]+?) task as complete/i) ||
                        text.match(/finish (?:my )?([^\.]+?) task/i);
  if (completeMatch) {
    const title = completeMatch[1].trim();
    return { action: 'complete', taskTitle: title, message: `Mark ${title} as completed?` };
  }

  const moveMatch = text.match(/move (?:my )?task to (.+)/i) || text.match(/move .*? to (.+)/i);
  if (moveMatch) {
    const dueDate = getRelativeDate(moveMatch[1]);
    const taskTitle = text.match(/move (?:my )?([^.]+?) task to/i)?.[1]?.trim();
    return { action: 'move', taskTitle, dueDate, message: dueDate ? 'Task due date updated.' : 'I can move it to a supported date.' };
  }

  const priorityMatch = text.match(/change (?:my )?(.+?) task priority to (low|medium|high)/i) ||
                        text.match(/set (?:my )?(.+?) task priority to (low|medium|high)/i) ||
                        text.match(/set (?:this|the) task to (low|medium|high) priority/i);
  if (priorityMatch) {
    const level = priorityMatch[priorityMatch.length - 1].toLowerCase() as TaskPriority;
    const taskTitle = priorityMatch.length > 2 ? priorityMatch[1].trim() : undefined;
    return { action: 'priority', taskTitle, priority: level, message: `Task priority set to ${level}.` };
  }

  const urgentMatch = /what['’]s my most urgent task|show my tasks|list my tasks|what are my tasks/i.test(lower);
  if (urgentMatch) {
    return { action: tasks.length ? 'show' : 'none', tasks, message: tasks.length ? `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''}.` : 'You have no tasks yet.' };
  }

  return { action: 'none' };
}
