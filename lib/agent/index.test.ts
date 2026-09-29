import { describe, expect, it } from 'vitest';
import { parseVoiceIntent } from './index';

describe('voice intent parsing', () => {
  it('recognizes deterministic time requests', () => {
    expect(parseVoiceIntent("What's the time?", [], []).action).toBe('time_current');
  });

  it('resolves task priority and move targets', () => {
    const tasks = [{
      id: 'task-1',
      title: 'Study maths',
      description: '',
      status: 'todo' as const,
      priority: 'medium' as const,
      createdAt: '',
      updatedAt: '',
    }];
    expect(parseVoiceIntent('set my Study maths task priority to high', tasks, []).taskTitle).toBe('Study maths');
    expect(parseVoiceIntent('move my Study maths task to tomorrow', tasks, []).action).toBe('move');
  });

  it('handles contextual follow-up requests', () => {
    const context = {
      sessionId: 'test',
      history: [],
      availableTools: [],
      lastReferencedItem: {
        type: 'task' as const,
        title: 'Study chemistry',
      },
    };
    expect(parseVoiceIntent('make it due tomorrow', [], [], context).action).toBe('followup_due_date');

    const calendarContext = {
      sessionId: 'test',
      history: [],
      availableTools: [],
      lastReferencedItem: {
        type: 'calendar_event' as const,
        title: 'Team sync',
      },
    };
    expect(parseVoiceIntent('move it to 4pm', [], [], calendarContext).action).toBe('followup_time');
  });

  it('evaluates math and percentage queries deterministically', () => {
    expect(parseVoiceIntent('what is 15 percent of 80', [], []).action).toBe('calculate');
    expect(parseVoiceIntent('calculate 25 * 4', [], []).action).toBe('calculate');
  });
});