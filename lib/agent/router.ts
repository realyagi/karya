import { ToolCall } from '@/types/karya';
import { getRelativeDate } from '@/lib/time/current-time';

export type ExternalRoute =
  | 'weather.current'
  | 'calendar.list'
  | 'calendar.create'
  | 'research.search'
  | 'image.generate'
  | 'github.repositories'
  | 'github.issues'
  | 'github.pull_requests'
  | 'github.issue.create'
  // Browser tools
  | 'browser.get_active_tab'
  | 'browser.open_url'
  | 'browser.create_tab'
  | 'browser.get_page_text'
  | 'browser.get_selected_text'
  | 'browser.scroll'
  | 'browser.find_text'
  // Desktop tools
  | 'desktop.open_application'
  | 'desktop.open_url'
  | 'desktop.open_folder'
  | 'desktop.create_local_file'
  | 'desktop.read_selected_file'
  | 'desktop.take_screenshot'
  | 'desktop.get_system_info'
  // UI Voice Control
  | 'karya.ui.open_home'
  | 'karya.ui.open_settings'
  | 'karya.ui.open_integrations'
  | 'karya.ui.open_account'
  | 'karya.ui.open_memory'
  | 'karya.ui.open_notifications'
  | 'karya.ui.open_privacy'
  | 'karya.ui.open_permissions'
  | 'karya.ui.open_mcp'
  | 'karya.ui.open_calendar'
  | 'karya.ui.open_tasks'
  | 'karya.ui.open_notes'
  | 'karya.ui.open_plans'
  | 'karya.ui.open_browser_companion'
  | 'karya.ui.open_desktop_companion'
  | 'karya.ui.open_appearance'
  | 'karya.ui.change_appearance'
  | 'karya.ui.open_voice'
  | 'karya.ui.change_voice'
  | 'karya.ui.toggle_setting'
  | 'karya.ui.open_settings_section'
  // Plans
  | 'karya.plan.create'
  | 'karya.plan.mark_item_done'
  | 'karya.plan.status'
  // MCP
  | 'mcp.execute';

export interface RoutedIntent {
  kind: 'local' | 'external' | 'clarification';
  toolName?: ExternalRoute;
  parameters?: Record<string, string>;
  toolCall?: ToolCall;
  response?: string;
}

function call(toolName: ExternalRoute, parameters: Record<string, string>): ToolCall {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return {
    id: `call-${uuid}`,
    toolName,
    displayName: toolName,
    parameters,
    status: 'pending',
    calledAt: new Date().toISOString(),
  };
}

export function routeVoiceIntent(input: string): RoutedIntent {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Browser extension commands
  if (/(?:what(?:'s| is) (?:my |the )?(?:current )?tab|what tab am i (?:on|looking at|viewing)|what page am i on|what is the title of (?:the current|this) tab)/i.test(lower)) {
    return { kind: 'external', toolName: 'browser.get_active_tab', parameters: {}, toolCall: call('browser.get_active_tab', {}) };
  }

  if (/(?:read (?:this|the) page|read page text|what does this page say)/i.test(lower)) {
    return { kind: 'external', toolName: 'browser.get_page_text', parameters: {}, toolCall: call('browser.get_page_text', {}) };
  }

  if (/(?:read (?:the |my )?selected text|what (?:text )?(?:did i select|is selected))/i.test(lower)) {
    return { kind: 'external', toolName: 'browser.get_selected_text', parameters: {}, toolCall: call('browser.get_selected_text', {}) };
  }

  if (/^scroll\s+(up|down)\b/i.test(lower)) {
    const direction = lower.includes('up') ? 'up' : 'down';
    return { kind: 'external', toolName: 'browser.scroll', parameters: { direction }, toolCall: call('browser.scroll', { direction }) };
  }

  const findMatch = text.match(/(?:find|search for)\s+(?:the word\s+|text\s+)?['"]?([^'"]+?)['"]?\s+on (?:this|the) page/i) ||
                    text.match(/find\s+(?:the word\s+|text\s+)?([A-Za-z0-9_-]+)\b/i);
  if (findMatch && (lower.includes('page') || lower.startsWith('find '))) {
    const targetText = findMatch[1].trim();
    if (targetText && !['my', 'a', 'the', 'task', 'note'].includes(targetText.toLowerCase())) {
      return { kind: 'external', toolName: 'browser.find_text', parameters: { text: targetText }, toolCall: call('browser.find_text', { text: targetText }) };
    }
  }

  // 2. Desktop bridge commands
  if (/(?:open (?:my )?computer|on (?:my )?computer|on (?:my )?desktop|system info|system information|system specs|specs of my computer|what are my system specs|take (?:a )?screenshot|take screenshot)/i.test(lower)) {
    if (/(?:screenshot)/i.test(lower)) {
      return { kind: 'external', toolName: 'desktop.take_screenshot', parameters: {}, toolCall: call('desktop.take_screenshot', {}) };
    }
    if (/(?:system (?:info|information|specs)|computer specs|specs of my computer)/i.test(lower)) {
      return { kind: 'external', toolName: 'desktop.get_system_info', parameters: {}, toolCall: call('desktop.get_system_info', {}) };
    }
  }

  if (/(?:downloads|documents|desktop|pictures|music|videos)\s+folder/i.test(lower) || /open (?:my )?(downloads|documents|desktop|pictures|music|videos)/i.test(lower)) {
    const folderMatch = lower.match(/(downloads|documents|desktop|pictures|music|videos)/i);
    const folder = folderMatch ? folderMatch[1] : 'downloads';
    return { kind: 'external', toolName: 'desktop.open_folder', parameters: { folder }, toolCall: call('desktop.open_folder', { folder }) };
  }

  if (/(?:create|make|write)\s+(?:a\s+)?file\s+([a-zA-Z0-9_.-]+)(?:\s+with\s+(.+))?/i.test(lower)) {
    const fileMatch = text.match(/(?:create|make|write)\s+(?:a\s+)?file\s+([a-zA-Z0-9_.-]+)(?:\s+with\s+(.+))?/i);
    const filename = fileMatch?.[1] || 'untitled.txt';
    const content = fileMatch?.[2] || '';
    return { kind: 'external', toolName: 'desktop.create_local_file', parameters: { filename, content }, toolCall: call('desktop.create_local_file', { filename, content }) };
  }

  if (/(?:read (?:a |the )?selected file|pick (?:a )?file to read|open file dialog)/i.test(lower)) {
    return { kind: 'external', toolName: 'desktop.read_selected_file', parameters: {}, toolCall: call('desktop.read_selected_file', {}) };
  }

  if (/(?:open|launch)\s+(?:the )?(?:app|application)?\s*(notepad|calculator|calc|chrome|paint|wordpad|explorer)\b/i.test(lower) ||
      /(?:open|launch)\s+(?:the )?(?:app|application)\s+([a-zA-Z0-9]+)/i.test(lower)) {
    const appMatch = lower.match(/(?:open|launch)\s+(?:the )?(?:app|application)?\s*(notepad|calculator|calc|chrome|paint|wordpad|explorer)\b/i) ||
                     lower.match(/(?:open|launch)\s+(?:the )?(?:app|application)\s+([a-zA-Z0-9]+)/i);
    let app = appMatch?.[1] || '';
    if (app === 'calculator') app = 'calc';
    if (app) {
      return { kind: 'external', toolName: 'desktop.open_application', parameters: { app }, toolCall: call('desktop.open_application', { app }) };
    }
  }

  // 3. Opening URLs (Default browser open / Extension open)
  const openUrlMatch = text.match(/^open\s+(https?:\/\/[^\s]+|youtube\.com|google\.com|github\.com|youtube|google|github)\b/i);
  if (openUrlMatch) {
    let rawTarget = openUrlMatch[1].trim();
    if (!rawTarget.startsWith('http://') && !rawTarget.startsWith('https://')) {
      if (rawTarget.toLowerCase() === 'youtube') rawTarget = 'https://www.youtube.com';
      else if (rawTarget.toLowerCase() === 'google') rawTarget = 'https://www.google.com';
      else if (rawTarget.toLowerCase() === 'github') rawTarget = 'https://www.github.com';
      else rawTarget = `https://${rawTarget}`;
    }
    return {
      kind: 'external',
      toolName: 'browser.open_url',
      parameters: { url: rawTarget },
      toolCall: call('browser.open_url', { url: rawTarget }),
    };
  }

  // 4. Weather
  const location = text.match(/(?:weather|raining|rain|temperature|hot|cold)\s+(?:in|at|for)\s+([^?.]+)/i)?.[1]?.trim();
  if (/(?:weather|raining|rain|temperature|how hot|how cold)/i.test(lower)) {
    return location
      ? { kind: 'external', toolName: 'weather.current', parameters: { location }, toolCall: call('weather.current', { location }) }
      : { kind: 'clarification', response: 'Which city should I check the weather for?' };
  }

  // 5. Calendar
  if (/(?:calendar|scheduled|event|meeting|do i have anything)/i.test(lower)) {
    const relative = getRelativeDate(lower) || (lower.includes('today') ? getRelativeDate('today') : undefined);
    if (/(?:schedule|add|create|book)/i.test(lower)) {
      const summary = text.replace(/^(?:schedule|add|create|book)\s+(?:a|an)?\s*/i, '').replace(/\s+(?:tomorrow|today|next week|next \w+)(?:\s+at\s+.+)?$/i, '').trim();
      const time = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      return { kind: 'external', toolName: 'calendar.create', parameters: { summary, date: relative || '', hour: time?.[1] || '', minute: time?.[2] || '00', meridiem: time?.[3] || '' }, toolCall: call('calendar.create', { summary, date: relative || '', hour: time?.[1] || '', minute: time?.[2] || '00', meridiem: time?.[3] || '' }) };
    }
    return { kind: 'external', toolName: 'calendar.list', parameters: { date: relative || '' }, toolCall: call('calendar.list', { date: relative || '' }) };
  }

  // 6. GitHub Integrations
  if (/(?:github|repo|repositories)/i.test(lower) && /(?:list|show|get|my repos|my repositories)/i.test(lower)) {
    return { kind: 'external', toolName: 'github.repositories', parameters: {}, toolCall: call('github.repositories', {}) };
  }

  // 7. Web Research
  if (/(?:search the web|research|look up|latest|what happened today|news)/i.test(lower)) {
    const query = text.replace(/^(?:search the web|research|look up)\s*(?:for|about)?\s*/i, '').trim() || text;
    return { kind: 'external', toolName: 'research.search', parameters: { query }, toolCall: call('research.search', { query }) };
  }

  // 8. UI Voice Control & Plans
  if (/(?:show me my memory|open memory|show memory)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_memory', parameters: {}, toolCall: call('karya.ui.open_memory', {}) };
  }
  if (/(?:show me my plans?|open plans?|open my plans?|show plans?|today's plan)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_plans', parameters: {}, toolCall: call('karya.ui.open_plans', {}) };
  }
  if (/(?:create a plan for today|create a plan for (.+)|create a plan|plan my day)/i.test(lower)) {
    const topicMatch = text.match(/(?:create a plan for (.+)|plan for (.+))/i);
    const topic = topicMatch ? (topicMatch[1] || topicMatch[2]).trim() : 'Today';
    return { kind: 'external', toolName: 'karya.plan.create', parameters: { topic }, toolCall: call('karya.plan.create', { topic }) };
  }
  if (/(?:mark (.+?) (?:as )?done|mark (.+?) complete)/i.test(lower)) {
    const match = text.match(/(?:mark (.+?) (?:as )?done|mark (.+?) complete)/i);
    const item = (match?.[1] || match?.[2] || '').trim();
    if (item) {
      return { kind: 'external', toolName: 'karya.plan.mark_item_done', parameters: { item }, toolCall: call('karya.plan.mark_item_done', { item }) };
    }
  }
  if (/(?:what(?:'s| is) left in my plan|what is left today|what's left today)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.plan.status', parameters: {}, toolCall: call('karya.plan.status', {}) };
  }
  if (/(?:show me my tasks|open tasks|show tasks)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_tasks', parameters: {}, toolCall: call('karya.ui.open_tasks', {}) };
  }
  if (/(?:show me my notes|open notes|show notes)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_notes', parameters: {}, toolCall: call('karya.ui.open_notes', {}) };
  }
  if (/(?:show me my calendar|open calendar|show calendar)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_calendar', parameters: {}, toolCall: call('karya.ui.open_calendar', {}) };
  }
  if (/(?:access my browser|show me browser companion|open browser settings|connect my browser|open browser)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_browser_companion', parameters: {}, toolCall: call('karya.ui.open_browser_companion', {}) };
  }
  if (/(?:show me desktop companion|open desktop settings|connect my desktop)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_desktop_companion', parameters: {}, toolCall: call('karya.ui.open_desktop_companion', {}) };
  }
  if (/(?:open settings and integrations|go to settings and open integrations)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_integrations', parameters: {}, toolCall: call('karya.ui.open_integrations', {}) };
  }
  if (/(?:show me your settings|open settings|show settings|go to settings)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_settings', parameters: {}, toolCall: call('karya.ui.open_settings', {}) };
  }
  if (/(?:show me integrations|open integrations|show integrations)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_integrations', parameters: {}, toolCall: call('karya.ui.open_integrations', {}) };
  }
  if (/(?:show me my account|open account)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_account', parameters: {}, toolCall: call('karya.ui.open_account', {}) };
  }
  if (/(?:open privacy|show privacy|privacy settings)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_privacy', parameters: {}, toolCall: call('karya.ui.open_privacy', {}) };
  }
  if (/(?:show me your mcp tools|open mcp|show mcp)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_mcp', parameters: {}, toolCall: call('karya.ui.open_mcp', {}) };
  }
  if (/(?:open appearance settings|open appearance|show appearance)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_appearance', parameters: {}, toolCall: call('karya.ui.open_appearance', {}) };
  }
  if (/(?:change theme|change the theme|switch theme|toggle theme)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.change_appearance', parameters: {}, toolCall: call('karya.ui.change_appearance', {}) };
  }
  if (/(?:make it dark|dark mode)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.change_appearance', parameters: { theme: 'dark' }, toolCall: call('karya.ui.change_appearance', { theme: 'dark' }) };
  }
  if (/(?:make it light|light mode)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.change_appearance', parameters: { theme: 'light' }, toolCall: call('karya.ui.change_appearance', { theme: 'light' }) };
  }
  if (/(?:open voice settings|show voice settings)/i.test(lower)) {
    return { kind: 'external', toolName: 'karya.ui.open_voice', parameters: {}, toolCall: call('karya.ui.open_voice', {}) };
  }
  if (/(?:can you change your voice|change your voice|change voice to|use a (?:girl|soft|softer|sweet|deep|deeper) voice|use another voice)/i.test(lower)) {
    const voiceMatch = lower.match(/voice to ([a-z]+)/i);
    const requestedVoice = voiceMatch ? voiceMatch[1] : '';
    return { kind: 'external', toolName: 'karya.ui.change_voice', parameters: { voice: requestedVoice }, toolCall: call('karya.ui.change_voice', { voice: requestedVoice }) };
  }

  // Conversational Gemini Image Generation
  // 1. Without description -> Ask for details
  if (/(?:(?:hey karya[, ]*)?(?:can you |please )?(?:create|generate|make|draw) (?:an? image|a picture) for me|(?:hey karya[, ]*)?(?:create|generate|make|draw) (?:an? image|a picture)$)/i.test(lower)) {
    return { kind: 'clarification', response: "Sure! What would you like me to create?" };
  }

  // 2. With prompt description
  const imageMatch = text.match(/(?:hey karya[, ]*)?(?:can you |please )?(?:create|generate|make|draw|visualize)\s+(?:an? image|a picture|a visual)\s+(?:of|depicting|showing|for)?\s*(.+)/i) ||
    text.match(/(?:create an image|generate an image)\s*:\s*(.+)/i);

  if (imageMatch && imageMatch[1]) {
    const prompt = imageMatch[1].trim();
    if (prompt && !/^(?:for me|now|please)$/i.test(prompt)) {
      return {
        kind: 'external',
        toolName: 'image.generate',
        parameters: { prompt },
        toolCall: call('image.generate', { prompt }),
      };
    }
  }

  return { kind: 'local' };
}