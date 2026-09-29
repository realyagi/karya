'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { VoiceWorkspace } from '@/components/voice/VoiceWorkspace';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { LiveActivityPanel } from '@/components/activity/LiveActivityPanel';
import { ConversationMessage, ActivityEvent, ToolCall, VoiceState } from '@/types/karya';
import { MessageSquare, Activity } from 'lucide-react';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { NavbarAuthControls } from '@/components/layout/Navbar';
import { TaskManager } from '@/components/tasks/TaskManager';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { ResearchPanel } from '@/components/research/ResearchPanel';
import { CalendarPanel } from '@/components/calendar/CalendarPanel';
import { isSupportedVoice, SUPPORTED_VOICES } from '@/lib/voice/voice-settings';
import { KaryaNote, KaryaTask, TaskPriority } from '@/types/karya';
import { loadNotes, loadTasks, saveNotes, saveTasks } from '@/lib/storage/local-data';
import { loadMemories, saveMemories } from '@/lib/storage/memory-data';
import { KaryaMemory } from '@/types/memory';
import { parseVoiceIntent } from '@/lib/agent';
import { routeVoiceIntent } from '@/lib/agent/router';
import { createLocalToolRegistry } from '@/lib/tools/local-tools';
import { ToolRegistry } from '@/lib/tools';
import {
  DEFAULT_KARYA_SETTINGS,
  KaryaSettings,
  loadKaryaSettings,
  saveKaryaSettings,
  SETTINGS_STORAGE_KEY_PREFIX,
} from '@/lib/settings/karya-settings';
import { OnboardingTutorial, shouldShowOnboarding } from '@/components/onboarding/OnboardingTutorial';
import { useUser } from '@clerk/nextjs';
import { MemoryManager } from '@/components/memory/MemoryManager';
import { PlansManager } from '@/components/plans/PlansManager';

export default function Home() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('Voice');
  const [mobilePanelTab, setMobilePanelTab] = useState<'conversation' | 'activity'>('conversation');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<'account' | 'appearance' | 'voice' | 'language' | 'handsFree' | 'permissions' | 'integrations' | 'mcp' | 'desktopBridge' | 'privacy' | 'notifications' | 'about'>('appearance');

  useEffect(() => {
    if (shouldShowOnboarding()) {
      setShowTutorial(true);
    }
  }, []);
  const [settings, setSettings] = useState<KaryaSettings>(DEFAULT_KARYA_SETTINGS);
  const [tasks, setTasks] = useState<KaryaTask[]>([]);
  const [notes, setNotes] = useState<KaryaNote[]>([]);
  const [memories, setMemories] = useState<KaryaMemory[]>([]);
  const [plans, setPlans] = useState<any[]>([]); // Import KaryaPlan later if needed
  const tasksRef = useRef<KaryaTask[]>([]);
  const notesRef = useRef<KaryaNote[]>([]);
  const memoriesRef = useRef<KaryaMemory[]>([]);
  const plansRef = useRef<any[]>([]);
  const localDataLoadedRef = useRef(false);
  const settingsRef = useRef(settings);
  const localToolRegistryRef = useRef<ToolRegistry>(new ToolRegistry());
  const [pendingConfirmation, setPendingConfirmation] = useState<ToolCall | null>(null);
  const [browserAuthToken, setBrowserAuthToken] = useState<string | null>(null);
  const [desktopAuthToken, setDesktopAuthToken] = useState<string | null>(null);
  const lastReferencedItemRef = useRef<{ type: 'task' | 'note' | 'calendar_event'; id?: string; title?: string; time?: string } | null>(null);
  const browserAuthTokenRef = useRef<string | null>(null);
  const desktopAuthTokenRef = useRef<string | null>(null);

  useEffect(() => {
    tasksRef.current = tasks;
    notesRef.current = notes;
    memoriesRef.current = memories;
    plansRef.current = plans;
  }, [tasks, notes, memories, plans]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [pendingGeneratedImage, setPendingGeneratedImage] = useState<{ imageUrl: string; prompt: string } | null>(null);
  const pendingGeneratedImageRef = useRef<{ imageUrl: string; prompt: string } | null>(null);
  const [awaitingImagePrompt, setAwaitingImagePrompt] = useState<boolean>(false);
  const awaitingImagePromptRef = useRef<boolean>(false);

  useEffect(() => {
    pendingGeneratedImageRef.current = pendingGeneratedImage;
  }, [pendingGeneratedImage]);

  useEffect(() => {
    awaitingImagePromptRef.current = awaitingImagePrompt;
  }, [awaitingImagePrompt]);

  const pendingConfirmationRef = useRef<ToolCall | null>(null);

  useEffect(() => {
    browserAuthTokenRef.current = browserAuthToken;
  }, [browserAuthToken]);

  useEffect(() => {
    desktopAuthTokenRef.current = desktopAuthToken;
  }, [desktopAuthToken]);

  useEffect(() => {
    pendingConfirmationRef.current = pendingConfirmation;
  }, [pendingConfirmation]);

  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback silently if speech synthesis is restricted
      }
    }
  }, []);

  const getCurrentTasks = useCallback(() => tasksRef.current, []);
  const getCurrentNotes = useCallback(() => notesRef.current, []);
  const getCurrentTimezone = useCallback(() => settingsRef.current.language.timezone === 'system'
    ? undefined
    : settingsRef.current.language.timezone, []);

  useEffect(() => {
    localToolRegistryRef.current = createLocalToolRegistry(
      {
        addTask: (task) => setTasks((previous) => [...previous, task]),
        updateTask: (id, patch) => setTasks((previous) => previous.map((task) => task.id === id
          ? { ...task, ...patch, updatedAt: new Date().toISOString() }
          : task)),
        deleteTask: (id) => setTasks((previous) => previous.filter((task) => task.id !== id)),
        deleteAllTasks: () => setTasks([]),
        addNote: (note) => setNotes((previous) => [...previous, note]),
        updateNote: (id, content) => setNotes((previous) => previous.map((note) => note.id === id
          ? { ...note, content, updatedAt: new Date().toISOString() }
          : note)),
        getTimezone: getCurrentTimezone,
        addMemory: (memory) => setMemories((previous) => [...previous, memory]),
        getMemories: () => memoriesRef.current,
      },
      getCurrentTasks,
      getCurrentNotes
    );
  }, [getCurrentNotes, getCurrentTasks, getCurrentTimezone]);

  useEffect(() => {
    if (!isLoaded) return;
    const timeoutId = window.setTimeout(() => {
      const userId = user?.id || null;
      const loadedSettings = loadKaryaSettings(userId);
      setSettings(
        isSupportedVoice(loadedSettings.voice.voiceId)
          ? loadedSettings
          : DEFAULT_KARYA_SETTINGS
      );
      setTasks(loadTasks(userId));
      setNotes(loadNotes(userId));
      setMemories(loadMemories(userId));
      const loadPlansData = require('@/lib/storage/plan-data').loadPlans;
      setPlans(loadPlansData(userId));
      const savedBrowserToken = window.localStorage.getItem('karya.browser.token');
      if (savedBrowserToken) setBrowserAuthToken(savedBrowserToken);
      const savedDesktopToken = window.localStorage.getItem('karya.desktop.token');
      if (savedDesktopToken) setDesktopAuthToken(savedDesktopToken);
      localDataLoadedRef.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localDataLoadedRef.current) saveTasks(tasks, user?.id || null);
  }, [tasks, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localDataLoadedRef.current) saveNotes(notes, user?.id || null);
  }, [notes, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localDataLoadedRef.current) saveMemories(memories, user?.id || null);
  }, [memories, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localDataLoadedRef.current) {
      const savePlansData = require('@/lib/storage/plan-data').savePlans;
      savePlansData(plans, user?.id || null);
    }
  }, [plans, user?.id]);

  const handleSettingsChange = useCallback((nextSettings: KaryaSettings) => {
    if (!isSupportedVoice(nextSettings.voice.voiceId)) return;
    setSettings(nextSettings);
    saveKaryaSettings(nextSettings, user?.id || null);
  }, [user?.id]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resolvedTheme = settings.appearance.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : settings.appearance.theme;
    const resolvedAnimations = settings.appearance.animations === 'full' && prefersReducedMotion
      ? 'reduced'
      : settings.appearance.animations;

    root.dataset.theme = resolvedTheme;
    root.dataset.accent = settings.appearance.accent;
    root.dataset.density = settings.appearance.density;
    root.dataset.animations = resolvedAnimations;
    root.dataset.glass = settings.appearance.glassEffects ? 'on' : 'off';
    root.dataset.backgroundEffects = settings.appearance.backgroundEffects ? 'on' : 'off';
    root.style.colorScheme = resolvedTheme;
  }, [settings.appearance]);

  const handleClearLocalData = useCallback(() => {
    const userId = user?.id || null;
    const suffix = userId ? `.${userId}` : '';
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY_PREFIX + suffix);
    setSettings(DEFAULT_KARYA_SETTINGS);
    setMessages([]);
    setActivityEvents([]);
    setTasks([]);
    setNotes([]);
    setMemories([]);
    window.localStorage.removeItem('karya.tasks.v1' + suffix);
    window.localStorage.removeItem('karya.notes.v1' + suffix);
    window.localStorage.removeItem('karya.memory.v1' + suffix);
  }, [user?.id]);

  const handleAddTask = useCallback((title: string, description: string, priority: TaskPriority, dueDate?: string) => {
    const now = new Date().toISOString();
    setTasks((previous) => [
      ...previous,
      {
        id: `task-${crypto.randomUUID()}`,
        title,
        description,
        status: 'todo',
        priority,
        dueDate,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }, []);

  const handleUpdateTask = useCallback((id: string, patch: Partial<KaryaTask>) => {
    setTasks((previous) => previous.map((task) => task.id === id
      ? { ...task, ...patch, updatedAt: new Date().toISOString() }
      : task));
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }, []);

  const handleDeleteAllTasks = useCallback(() => setTasks([]), []);

  const handleAddNote = useCallback((title: string, content: string) => {
    const now = new Date().toISOString();
    setNotes((previous) => [
      ...previous,
      { id: `note-${crypto.randomUUID()}`, title, content, createdAt: now, updatedAt: now },
    ]);
  }, []);

  const handleUpdateNote = useCallback((id: string, content: string) => {
    setNotes((previous) => previous.map((note) => note.id === id
      ? { ...note, content, updatedAt: new Date().toISOString() }
      : note));
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((previous) => previous.filter((note) => note.id !== id));
  }, []);

  const handleVoiceTranscript = useCallback(async (text: string) => {
    const normalized = text.trim().toLowerCase();
    const activityEvent = (title: string, description: string, status: ActivityEvent['status'] = 'completed') => {
      setActivityEvents((previous) => [{
        id: `act-${crypto.randomUUID()}`,
        type: 'tool_completed',
        title,
        description,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status,
      }, ...previous]);
    };
    // 1. Check for Pending Generated Image response ("Hey, your image is ready. Did you want to see it?")
    const pendingImg = pendingGeneratedImageRef.current;
    if (pendingImg) {
      const isAffirmative = /^(yes|yeah|yep|sure|show me|open it|let me see|display it|show it|please show me|ok|okay)$/i.test(normalized) ||
        normalized.includes('show') || normalized.includes('see') || normalized.includes('open') || normalized.includes('view') || normalized.includes('look');
      const isNegative = /^(no|nope|not now|no thanks|cancel|never mind|later|stop)$/i.test(normalized) ||
        normalized.includes('not now') || normalized.includes('later') || normalized.includes("don't");

      if (isAffirmative) {
        const currentPrompt = pendingImg.prompt;
        const currentUrl = pendingImg.imageUrl;
        setPendingGeneratedImage(null);
        pendingGeneratedImageRef.current = null;
        setMessages((previous) => [
          ...previous,
          {
            id: `msg-${crypto.randomUUID()}`,
            role: 'karya',
            content: `Here is the image I created for: "${currentPrompt}"`,
            imageUrl: currentUrl,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        speakText('Here it is!');
        activityEvent('Image Displayed', `Displayed image for "${currentPrompt}"`, 'completed');
        return;
      }

      if (isNegative) {
        setPendingGeneratedImage(null);
        pendingGeneratedImageRef.current = null;
        setMessages((previous) => [
          ...previous,
          {
            id: `msg-${crypto.randomUUID()}`,
            role: 'karya',
            content: 'No problem.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        speakText('No problem.');
        activityEvent('Image Dismissed', 'Image not displayed', 'completed');
        return;
      }
    }

    const pendingCall = pendingConfirmationRef.current;
    if (pendingCall && /^(yes|yeah|yep|confirm|do it|okay|ok)$/.test(normalized)) {
      const call = pendingCall;
      setPendingConfirmation(null);
      const confirmedResult = await localToolRegistryRef.current.executeToolCall(call);
      if (confirmedResult && typeof confirmedResult === 'object' && 'message' in confirmedResult) {
        const result = confirmedResult as { message: string; success: boolean };
        setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: result.message, timestamp: new Date().toLocaleTimeString() }]);
        activityEvent(result.success ? 'Action completed' : 'Action failed', result.message, result.success ? 'completed' : 'failed');
      }
      return;
    }

    if (pendingCall && /^(no|cancel|never mind|stop)$/.test(normalized)) {
      setPendingConfirmation(null);
      setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: 'Okay, I cancelled that action.', timestamp: new Date().toLocaleTimeString() }]);
      return;
    }

    // Helper for executing Gemini Image Generation
    const executeImageGeneration = async (prompt: string) => {
      activityEvent('Image Generation', `Generating image for "${prompt}"...`, 'in_progress');
      setMessages((previous) => [
        ...previous,
        {
          id: `msg-${crypto.randomUUID()}`,
          role: 'karya',
          content: "Got it. I'm creating that now.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      speakText("Got it. I'm creating that now.");

      try {
        const response = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        if (response.ok && data.success && data.imageUrl) {
          const item = { imageUrl: data.imageUrl, prompt };
          setPendingGeneratedImage(item);
          pendingGeneratedImageRef.current = item;
          activityEvent('Image Ready', 'Image generated successfully', 'completed');
          const readyMsg = 'Hey, your image is ready. Did you want to see it?';
          setMessages((previous) => [
            ...previous,
            {
              id: `msg-${crypto.randomUUID()}`,
              role: 'karya',
              content: readyMsg,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          speakText(readyMsg);
        } else {
          const errMsg = data.error || 'Failed to generate image.';
          activityEvent('Generation Failed', errMsg, 'failed');
          const failMsg = `I couldn't create that image: ${errMsg}`;
          setMessages((previous) => [
            ...previous,
            {
              id: `msg-${crypto.randomUUID()}`,
              role: 'karya',
              content: failMsg,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          speakText(failMsg);
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Network error occurred during image generation.';
        activityEvent('Generation Failed', errMsg, 'failed');
        const failMsg = `I couldn't create that image: ${errMsg}`;
        setMessages((previous) => [
          ...previous,
          {
            id: `msg-${crypto.randomUUID()}`,
            role: 'karya',
            content: failMsg,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        speakText(failMsg);
      }
    };

    // 2. Awaiting image prompt response from previous turn
    if (awaitingImagePromptRef.current && text.trim()) {
      setAwaitingImagePrompt(false);
      awaitingImagePromptRef.current = false;
      let prompt = text.trim();
      if (/^(?:create|generate|make|draw)\s+(?:an?\s+image\s+(?:of\s+)?)?/i.test(prompt)) {
        prompt = prompt.replace(/^(?:create|generate|make|draw)\s+(?:an?\s+image\s+(?:of\s+)?)?/i, '').trim();
      }
      if (prompt) {
        await executeImageGeneration(prompt);
        return;
      }
    }

    const routed = routeVoiceIntent(text);
    if (routed.kind === 'clarification' && routed.response) {
      if (routed.response.includes('What would you like me to create?')) {
        setAwaitingImagePrompt(true);
        awaitingImagePromptRef.current = true;
      }
      setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: routed.response!, timestamp: new Date().toLocaleTimeString() }]);
      speakText(routed.response);
      return;
    }

    if (routed.toolName === 'image.generate' && routed.parameters?.prompt) {
      await executeImageGeneration(routed.parameters.prompt);
      return;
    }
    if (routed.kind === 'external' && routed.toolCall && routed.toolName) {
      activityEvent('Using tool', routed.toolName);
      let responseText = '';
      let succeeded = false;
      const now = new Date().toISOString();
      try {
        if (routed.toolName === 'weather.current') {
          const response = await fetch(`/api/weather?q=${encodeURIComponent(routed.parameters?.location || '')}`);
          const data = await response.json() as { error?: string; location?: { name?: string }; weather?: { current?: { temperature_2m?: number; apparent_temperature?: number; weather_code?: number } } };
          if (!response.ok) throw new Error(data.error || 'Weather lookup failed.');
          const current = data.weather?.current;
          responseText = `${data.location?.name || routed.parameters?.location} is ${current?.temperature_2m ?? 'unavailable'} degrees right now.`;
          succeeded = true;
        } else if (routed.toolName === 'research.search') {
          const response = await fetch(`/api/research/search?q=${encodeURIComponent(routed.parameters?.query || '')}`);
          const data = await response.json() as { error?: string; results?: Array<{ title: string; source: string; date: string | null }> };
          if (!response.ok) throw new Error(data.error || 'Web research failed.');
          responseText = data.results?.length ? `I found ${data.results.length} current sources. ${data.results.slice(0, 3).map((item) => `${item.title} from ${item.source}`).join('; ')}.` : 'I found no current sources for that search.';
          succeeded = true;
        } else if (routed.toolName.startsWith('github.')) {
          const action = routed.toolName.replace('github.', '').replace('pull_requests', 'pulls');
          const response = await fetch(`/api/integrations/github/api?action=${encodeURIComponent(action)}`);
          const data = await response.json() as { error?: string; data?: unknown[] };
          if (!response.ok) throw new Error(data.error || 'GitHub request failed.');
          responseText = `GitHub returned ${data.data?.length || 0} ${action.replace('_', ' ')}.`;
          succeeded = true;
        } else if (routed.toolName === 'calendar.list') {
          const response = await fetch(`/api/integrations/google/calendar?timeMin=${encodeURIComponent(new Date().toISOString())}`);
          const data = await response.json() as { error?: string; data?: { items?: Array<{ summary?: string }> } };
          if (!response.ok) throw new Error(data.error || 'Calendar request failed.');
          const items = data.data?.items || [];
          responseText = items.length ? `You have ${items.length} events: ${items.slice(0, 4).map((item) => item.summary || 'Untitled event').join(', ')}.` : 'You have no events in that calendar range.';
          succeeded = true;
        } else if (routed.toolName.startsWith('browser.')) {
          const action = routed.toolName.replace('browser.', '');
          const token = browserAuthTokenRef.current;
          if (!token) {
            responseText = "Your KARYA browser extension isn't connected.";
          } else {
            // Send command via extension messaging if available in window, or short-poll/proxy
            let commandType = '';
            if (action === 'get_active_tab') commandType = 'GET_ACTIVE_TAB';
            else if (action === 'open_url') commandType = 'OPEN_URL';
            else if (action === 'create_tab') commandType = 'CREATE_TAB';
            else if (action === 'get_page_text') commandType = 'GET_PAGE_TEXT';
            else if (action === 'get_selected_text') commandType = 'GET_SELECTED_TEXT';
            else if (action === 'scroll') commandType = 'SCROLL';
            else if (action === 'find_text') commandType = 'FIND_TEXT';

            // Check if extension is accessible via chrome.runtime
            const chromeGlobal = typeof window !== 'undefined' ? (window as unknown as { chrome?: { runtime?: { sendMessage?: Function } } }).chrome : undefined;
            if (chromeGlobal?.runtime?.sendMessage) {
              const res = await new Promise<{ success: boolean; data?: unknown; error?: string }>((resolve) => {
                try {
                  chromeGlobal.runtime!.sendMessage!(
                    {
                      type: commandType,
                      requestId: `req-${Date.now()}`,
                      url: routed.parameters?.url,
                      direction: routed.parameters?.direction,
                      text: routed.parameters?.text,
                      authToken: token,
                    },
                    (response: unknown) => {
                      resolve((response as { success: boolean; data?: unknown; error?: string }) || { success: false, error: 'No response from extension' });
                    }
                  );
                } catch (e: unknown) {
                  resolve({ success: false, error: e instanceof Error ? e.message : 'Extension disconnected' });
                }
              });

              if (res.success && res.data) {
                succeeded = true;
                if (action === 'get_active_tab') {
                  const tab = res.data as { title?: string; url?: string };
                  responseText = `You are currently on "${tab.title || 'Untitled'}" at ${tab.url || 'current page'}.`;
                } else if (action === 'get_page_text') {
                  const page = res.data as { text?: string; title?: string };
                  responseText = page.text ? `Page title is "${page.title}". The page reads: ${page.text.slice(0, 300)}...` : 'The page has no readable text.';
                } else if (action === 'get_selected_text') {
                  const sel = res.data as { selectedText?: string };
                  responseText = sel.selectedText ? `Selected text: "${sel.selectedText}".` : 'No text is currently selected.';
                } else if (action === 'scroll') {
                  responseText = `Scrolled ${routed.parameters?.direction || 'down'} on the active page.`;
                } else if (action === 'find_text') {
                  const findData = res.data as { found?: boolean; count?: number; query?: string };
                  responseText = findData.found ? `Found "${findData.query}" on the page (${findData.count} matches).` : `Could not find "${findData.query}" on the page.`;
                } else if (action === 'open_url') {
                  const isYouTube = (routed.parameters?.url || '').toLowerCase().includes('youtube');
                  responseText = isYouTube ? 'Done — YouTube is open.' : `Opened ${routed.parameters?.url} in browser.`;
                } else {
                  responseText = 'Browser action completed successfully.';
                }
              } else {
                setSettingsCategory('integrations');
                setIsSettingsOpen(true);
                const isYouTube = (routed.parameters?.url || '').toLowerCase().includes('youtube');
                responseText = isYouTube
                  ? "I can open YouTube once Browser Control is connected. I've opened the Browser Companion setup for you."
                  : (res.error || "Your KARYA browser extension isn't connected. I've opened the Browser Companion setup for you.");
              }
            } else {
              setSettingsCategory('integrations');
              setIsSettingsOpen(true);
              const isYouTube = (routed.parameters?.url || '').toLowerCase().includes('youtube');
              responseText = isYouTube
                ? "I can open YouTube once Browser Control is connected. I've opened the Browser Companion setup for you."
                : "I don't currently have access to your browser. I've opened the Browser Companion setup for you. Download the extension, add it to Chrome, sign in with your KARYA account, and turn Browser Control on.";
            }
          }
        } else if (routed.toolName.startsWith('desktop.')) {
          const action = routed.toolName;
          const token = desktopAuthTokenRef.current;
          if (!token) {
            responseText = "Desktop Companion is currently under construction. This KARYA project is made by GGCART for the AssemblyAI hackathon, so some capabilities have limitations.";
          } else {
            try {
              const response = await fetch('/api/integrations/desktop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'command',
                  command: action,
                  arguments: routed.parameters || {},
                  authToken: token,
                }),
              });
              const data = await response.json() as { success?: boolean; result?: unknown; error?: string };
              if (!response.ok || !data.success) {
                responseText = "Desktop Companion is currently under construction. This KARYA project is made by GGCART for the AssemblyAI hackathon, so some capabilities have limitations.";
              } else {
                succeeded = true;
                if (action === 'desktop.get_system_info') {
                  const info = data.result as { message?: string };
                  responseText = info?.message || 'Retrieved system information successfully.';
                } else if (action === 'desktop.take_screenshot') {
                  const shot = data.result as { message?: string };
                  responseText = shot?.message || 'Screenshot captured on your computer.';
                } else if (action === 'desktop.open_folder') {
                  const fld = data.result as { message?: string };
                  responseText = fld?.message || `Opened folder ${routed.parameters?.folder}.`;
                } else if (action === 'desktop.open_application') {
                  const app = data.result as { message?: string };
                  responseText = app?.message || `Launched application ${routed.parameters?.app}.`;
                } else if (action === 'desktop.open_url') {
                  const urlRes = data.result as { message?: string };
                  responseText = urlRes?.message || `Opened ${routed.parameters?.url}.`;
                } else {
                  responseText = 'Desktop action completed successfully.';
                }
              }
            } catch {
              responseText = "Desktop Companion is currently under construction. This KARYA project is made by GGCART for the AssemblyAI hackathon, so some capabilities have limitations.";
            }
          }
        } else if (routed.toolName.startsWith('karya.ui.')) {
          succeeded = true;
          const uiTool = routed.toolName;
          
          if (uiTool === 'karya.ui.open_home') {
            setIsSettingsOpen(false);
            setActiveTab('Voice');
            responseText = 'Opened Home.';
          } else if (uiTool === 'karya.ui.open_settings') {
            setSettingsCategory('appearance');
            setIsSettingsOpen(true);
            responseText = 'Opened Settings.';
          } else if (uiTool === 'karya.ui.open_integrations') {
            setSettingsCategory('integrations');
            setIsSettingsOpen(true);
            responseText = 'Opened Integrations.';
          } else if (uiTool === 'karya.ui.open_account') {
            setSettingsCategory('account');
            setIsSettingsOpen(true);
            responseText = 'Opened Account Settings.';
          } else if (uiTool === 'karya.ui.open_memory') {
            setActiveTab('Memory');
            setIsSettingsOpen(false);
            responseText = 'Opened Memory.';
          } else if (uiTool === 'karya.ui.open_notifications') {
            setSettingsCategory('notifications');
            setIsSettingsOpen(true);
            responseText = 'Opened Notifications.';
          } else if (uiTool === 'karya.ui.open_privacy') {
            setSettingsCategory('privacy');
            setIsSettingsOpen(true);
            responseText = 'Opened Privacy Settings.';
          } else if (uiTool === 'karya.ui.open_permissions') {
            setSettingsCategory('permissions');
            setIsSettingsOpen(true);
            responseText = 'Opened Permissions.';
          } else if (uiTool === 'karya.ui.open_mcp') {
            setSettingsCategory('mcp');
            setIsSettingsOpen(true);
            responseText = 'Opened MCP Tools.';
          } else if (uiTool === 'karya.ui.open_calendar') {
            setIsSettingsOpen(false);
            setActiveTab('Calendar');
            responseText = 'Opened Calendar.';
          } else if (uiTool === 'karya.ui.open_tasks') {
            setIsSettingsOpen(false);
            setActiveTab('Tasks');
            responseText = 'Opened Tasks.';
          } else if (uiTool === 'karya.ui.open_notes') {
            setIsSettingsOpen(false);
            setActiveTab('Notes');
            responseText = 'Opened Notes.';
          } else if (uiTool === 'karya.ui.open_plans') {
            setIsSettingsOpen(false);
            setActiveTab('Plans');
            responseText = 'Opened Plans.';
          } else if (uiTool === 'karya.ui.open_browser_companion') {
            setSettingsCategory('integrations');
            setIsSettingsOpen(true);
            responseText = "I don't currently have access to your browser. I've opened the Browser Companion setup for you. Download the extension, add it to Chrome, sign in with your KARYA account, and turn Browser Control on.";
          } else if (uiTool === 'karya.ui.open_desktop_companion') {
            setSettingsCategory('desktopBridge');
            setIsSettingsOpen(true);
            responseText = 'Opened Desktop Companion Settings.';
          } else if (uiTool === 'karya.ui.open_appearance') {
            setSettingsCategory('appearance');
            setIsSettingsOpen(true);
            responseText = 'Opened Appearance Settings.';
          } else if (uiTool === 'karya.ui.change_appearance') {
            const currentTheme = settingsRef.current.appearance.theme;
            const requestedTheme = routed.parameters?.theme;
            const theme: 'dark' | 'light' | 'system' = (requestedTheme === 'dark' || requestedTheme === 'light' || requestedTheme === 'system') ? requestedTheme : (currentTheme === 'dark' ? 'light' : 'dark');
            handleSettingsChange({ ...settingsRef.current, appearance: { ...settingsRef.current.appearance, theme } });
            responseText = `Changed theme to ${theme}.`;
          } else if (uiTool === 'karya.ui.open_voice') {
            setSettingsCategory('voice');
            setIsSettingsOpen(true);
            responseText = 'Opened Voice Settings.';
          } else if (uiTool === 'karya.ui.change_voice') {
            const reqVoice = routed.parameters?.voice;
            if (reqVoice) {
              const matched = SUPPORTED_VOICES.find((v) => v.name.toLowerCase().includes(reqVoice) || v.id.toLowerCase().includes(reqVoice));
              if (matched) {
                handleSettingsChange({ ...settingsRef.current, voice: { ...settingsRef.current.voice, voiceId: matched.id } });
                responseText = `I've changed my voice to ${matched.name}.`;
              } else {
                responseText = `I couldn't find a voice matching "${reqVoice}".`;
              }
            } else {
              responseText = 'Sure! What kind of voice would you like?';
            }
          } else {
             responseText = 'Executed UI action.';
          }
        } else if (routed.toolName === 'karya.plan.create') {
          succeeded = true;
          const topic = routed.parameters?.topic || 'Today';
          const isExam = topic.toLowerCase().includes('exam');
          const newPlan = {
            id: `plan-${crypto.randomUUID()}`,
            date: new Date().toISOString().split('T')[0],
            title: isExam ? 'Exam Day' : `${topic} Plan`,
            objectives: isExam
              ? ['Revise chemistry', 'Finish math homework', 'Practice English']
              : ['Revise chemistry', 'Finish math homework', 'Practice English'],
            items: isExam
              ? [
                  { id: `item-1`, title: 'Revise chemistry', status: 'not_started' as const },
                  { id: `item-2`, title: 'Finish math homework', status: 'not_started' as const },
                  { id: `item-3`, title: 'Practice English', status: 'not_started' as const },
                ]
              : [
                  { id: `item-1`, title: 'Revise chemistry', status: 'not_started' as const },
                  { id: `item-2`, title: 'Finish math homework', status: 'not_started' as const },
                  { id: `item-3`, title: 'Practice English', status: 'not_started' as const },
                ],
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setPlans((prev) => [newPlan, ...prev]);
          setActiveTab('Plans');
          setIsSettingsOpen(false);
          responseText = `Created plan "${newPlan.title}" with 3 items: ${newPlan.items.map((i: any) => i.title).join(', ')}.`;
        } else if (routed.toolName === 'karya.plan.mark_item_done') {
          succeeded = true;
          const target = (routed.parameters?.item || '').toLowerCase();
          let itemFound = false;
          let matchedPlanTitle = '';
          setPlans((prev) => prev.map((p) => {
            const items = p.items || [];
            const updatedItems = items.map((it: any) => {
              if (it.title.toLowerCase().includes(target)) {
                itemFound = true;
                matchedPlanTitle = p.title;
                return { ...it, status: 'done' as const };
              }
              return it;
            });
            const allDone = updatedItems.length > 0 && updatedItems.every((i: any) => i.status === 'done');
            return { ...p, items: updatedItems, isCompleted: allDone };
          }));
          if (itemFound) {
            responseText = `Marked "${routed.parameters?.item}" done in your ${matchedPlanTitle || ''} plan.`;
          } else {
            const match = tasksRef.current.find((t) => t.title.toLowerCase().includes(target));
            if (match) {
              await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.complete', displayName: 'Complete task', parameters: { task: match }, status: 'pending', calledAt: now });
              responseText = `Marked task "${match.title}" as complete.`;
            } else {
              responseText = `Could not find "${routed.parameters?.item}" in your plans.`;
            }
          }
        } else if (routed.toolName === 'karya.plan.status') {
          succeeded = true;
          const currentPlan = plansRef.current[0];
          if (!currentPlan) {
            responseText = "You don't have any active plans right now. Say 'Create a plan for today' to create one.";
          } else {
            const items = currentPlan.items || [];
            const remaining = items.filter((it: any) => it.status !== 'done');
            if (remaining.length === 0) {
              responseText = `All items in your "${currentPlan.title}" plan are completed!`;
            } else {
              responseText = `Left in your plan "${currentPlan.title}": ${remaining.map((it: any) => it.title).join(', ')}.`;
            }
          }
        } else {
          const date = routed.parameters?.date;
          const hourValue = Number(routed.parameters?.hour);
          if (!date || !hourValue) throw new Error('Tell me which day and time to schedule.');
          const meridiem = routed.parameters?.meridiem?.toLowerCase();
          const hour = meridiem === 'pm' && hourValue < 12 ? hourValue + 12 : meridiem === 'am' && hourValue === 12 ? 0 : hourValue;
          const start = new Date(`${date}T${String(hour).padStart(2, '0')}:${routed.parameters?.minute || '00'}:00`);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          const response = await fetch('/api/integrations/google/calendar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ summary: routed.parameters?.summary, start: start.toISOString(), end: end.toISOString(), timeZone: settingsRef.current.language.timezone === 'system' ? Intl.DateTimeFormat().resolvedOptions().timeZone : settingsRef.current.language.timezone }) });
          const data = await response.json() as { error?: string; data?: { summary?: string } };
          if (!response.ok) throw new Error(data.error || 'Calendar event creation failed.');
          responseText = `Calendar confirmed ${data.data?.summary || routed.parameters?.summary || 'the event'}.`;
          succeeded = true;
        }
      } catch (error) {
        responseText = error instanceof Error ? error.message : 'I could not complete that request.';
      }
      setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: responseText, timestamp: new Date().toLocaleTimeString() }]);
      activityEvent(succeeded ? 'Tool verified' : 'Tool failed', responseText, succeeded ? 'completed' : 'failed');
      return;
    }

    const intent = parseVoiceIntent(text, tasksRef.current, notesRef.current, {
      sessionId: 'karya-session',
      history: messages,
      availableTools: ['tasks', 'notes', 'calendar', 'weather', 'research', 'github', 'browser', 'desktop', 'memory'],
      lastReferencedItem: lastReferencedItemRef.current || undefined,
    });
    const now = new Date().toISOString();
    const activity = (title: string, description: string, status: ActivityEvent['status'] = 'completed') => activityEvent(title, description, status);

    if (intent.action === 'followup_due_date' && intent.dueDate && intent.taskTitle) {
      const match = tasksRef.current.find((t) => t.title.toLowerCase().includes(intent.taskTitle!.toLowerCase()));
      if (match) {
        await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.update', displayName: 'Update task', parameters: { task: match, patch: { dueDate: intent.dueDate } }, status: 'pending', calledAt: now });
        setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: `Updated ${match.title} due date to ${intent.dueDate}.`, timestamp: new Date().toLocaleTimeString() }]);
        activity('Task updated', `Set due date to ${intent.dueDate}`);
        lastReferencedItemRef.current = null;
        return;
      }
    }

    if (intent.action === 'create' && intent.task) {
      lastReferencedItemRef.current = { type: 'task', title: intent.task.title, id: intent.task.id };
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.create', displayName: 'Create task', parameters: { task: intent.task }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) activity('Task created', result.message as string);
      return;
    }

    if (intent.action === 'note_create' && intent.note) {
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'notes.create', displayName: 'Create note', parameters: { note: intent.note }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) activity('Note created', result.message as string);
      return;
    }

    if (intent.action === 'note_append' && intent.note) {
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'notes.append', displayName: 'Append note', parameters: { note: intent.note, content: intent.note.content }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) activity('Note updated', result.message as string);
      return;
    }

    if (intent.action === 'note_find' && intent.noteTitle) {
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'notes.find', displayName: 'Search notes', parameters: { query: intent.noteTitle }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) {
        const response = result as { message: string; data?: KaryaNote[] };
        const titles = response.data?.map((note) => note.title).join(', ');
        setMessages((previous) => [...previous, {
          id: `msg-${crypto.randomUUID()}`,
          role: 'karya',
          content: titles ? `${response.message} ${titles}.` : response.message,
          timestamp: new Date().toLocaleTimeString(),
        }]);
        activity('Notes searched', response.message);
      }
      return;
    }

    if (intent.action === 'time_current') {
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'time.current', displayName: 'Current date and time', parameters: {}, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) {
        const response = result as { data?: { date: string; time: string; dayOfWeek: string; timezone: string } };
        const data = response.data;
        if (data) {
          setMessages((previous) => [...previous, {
            id: `msg-${crypto.randomUUID()}`,
            role: 'karya',
            content: `It is ${data.dayOfWeek}, ${data.date} at ${data.time} (${data.timezone}).`,
            timestamp: new Date().toLocaleTimeString(),
          }]);
          activity('Time checked', `Runtime time read in ${data.timezone}.`);
        }
      }
      return;
    }

    if (intent.action === 'calculate' && intent.message) {
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'calculator.calculate', displayName: 'Calculate', parameters: { expression: intent.message }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) {
        const response = result as { message: string; success: boolean };
        setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: response.message, timestamp: new Date().toLocaleTimeString() }]);
        activity(response.success ? 'Calculation complete' : 'Calculation failed', response.message, response.success ? 'completed' : 'failed');
      }
      return;
    }

    if (intent.action === 'memory_store' && intent.message && settingsRef.current.privacy.memoryEnabled) {
      const memory: KaryaMemory = { id: `memory-${crypto.randomUUID()}`, content: intent.message, createdAt: now, updatedAt: now };
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'memory.store', displayName: 'Remember', parameters: { memory }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) {
        const response = result as { message: string };
        setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: response.message, timestamp: new Date().toLocaleTimeString() }]);
        activity('Memory stored', response.message);
      }
      return;
    }

    if (intent.action === 'memory_search' && intent.message && settingsRef.current.privacy.memoryEnabled) {
      const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'memory.search', displayName: 'Search memory', parameters: { query: intent.message }, status: 'pending', calledAt: now });
      if (result && typeof result === 'object' && 'message' in result) {
        const response = result as { message: string };
        setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: response.message, timestamp: new Date().toLocaleTimeString() }]);
        activity('Memory searched', response.message);
      }
      return;
    }

    if (intent.action === 'plan_day') {
      const openTasks = tasksRef.current.filter((task) => task.status !== 'completed');
      let calendarInfo = '';
      try {
        const calRes = await fetch(`/api/integrations/google/calendar?timeMin=${encodeURIComponent(new Date().toISOString())}`);
        if (calRes.ok) {
          const calData = await calRes.json();
          const items = calData?.data?.items || [];
          if (items.length) {
            calendarInfo = ` You have ${items.length} calendar event${items.length === 1 ? '' : 's'} scheduled (${items.slice(0, 3).map((e: { summary?: string }) => e.summary || 'Event').join(', ')}).`;
          }
        }
      } catch {
        // Calendar not configured or connected
      }

      let summary = '';
      if (openTasks.length) {
        summary = `Day Plan: You have ${openTasks.length} task${openTasks.length === 1 ? '' : 's'} to focus on.${calendarInfo} Priority item: "${openTasks[0].title}".`;
      } else {
        summary = `Day Plan: You have no pending tasks.${calendarInfo || ' Your schedule is completely open.'}`;
      }
      setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: summary, timestamp: new Date().toLocaleTimeString() }]);
      activity('Day plan prepared', summary);
      return;
    }

    if (intent.action === 'complete' && intent.taskTitle) {
      const match = tasksRef.current.find((task) => task.title.toLowerCase().includes(intent.taskTitle!.toLowerCase()));
      if (match) {
        const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.complete', displayName: 'Complete task', parameters: { task: match }, status: 'pending', calledAt: now });
        if (result && typeof result === 'object' && 'message' in result) activity('Task completed', result.message as string);
      }
    }
    if (intent.action === 'show') {
      const taskSummary = tasksRef.current.length
        ? tasksRef.current.map((task) => `${task.title}${task.dueDate ? ` due ${task.dueDate}` : ''}`).join('; ')
        : 'You have no tasks yet.';
      setMessages((previous) => [...previous, { id: `msg-${crypto.randomUUID()}`, role: 'karya', content: taskSummary, timestamp: new Date().toLocaleTimeString() }]);
      activity('Tasks checked', `Found ${tasksRef.current.length} local task${tasksRef.current.length === 1 ? '' : 's'}.`);
    }
    if ((intent.action === 'move' || intent.action === 'priority') && intent.taskTitle) {
      const match = tasksRef.current.find((task) => task.title.toLowerCase().includes(intent.taskTitle!.toLowerCase()));
      const patch = intent.action === 'move'
        ? { dueDate: intent.dueDate }
        : { priority: intent.priority };
      if (match && Object.values(patch)[0] !== undefined) {
        const result = await localToolRegistryRef.current.executeToolCall({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.update', displayName: 'Update task', parameters: { task: match, patch }, status: 'pending', calledAt: now });
        if (result && typeof result === 'object' && 'message' in result) activity('Task updated', result.message as string);
      }
    }
    if (intent.action === 'delete' && intent.taskTitle) {
      const match = tasksRef.current.find((task) => task.title.toLowerCase().includes(intent.taskTitle!.toLowerCase()));
      if (match) {
        setPendingConfirmation({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.delete', displayName: 'Delete task', parameters: { taskId: match.id }, status: 'pending', calledAt: now });
        activity('Confirmation needed', `Delete "${match.title}"? Say yes or no.`, 'in_progress');
      }
    }
    if (intent.action === 'delete_all') {
      setPendingConfirmation({ id: `call-${crypto.randomUUID()}`, toolName: 'tasks.delete_all', displayName: 'Delete all tasks', parameters: {}, status: 'pending', calledAt: now });
      activity('Confirmation needed', 'Delete all tasks? Say yes or no.', 'in_progress');
    }
  }, []);

  const handleRequestMicrophone = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const handleAddMessage = useCallback((msg: ConversationMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleAddActivityEvent = useCallback((event: ActivityEvent) => {
    setActivityEvents((prev) => [event, ...prev]);
  }, []);

  const handleUpdatePlanItemStatus = useCallback((planId: string, itemId: string, status: any) => {
    setPlans((prev) => prev.map((p) => {
      if (p.id !== planId) return p;
      const items = (p.items || []).map((it: any) => it.id === itemId ? { ...it, status } : it);
      const allDone = items.length > 0 && items.every((i: any) => i.status === 'done');
      return { ...p, items, isCompleted: allDone, updatedAt: new Date().toISOString() };
    }));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Subtle futuristic background atmospheric ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute top-[30%] -right-[10%] h-[550px] w-[550px] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute -bottom-[10%] left-[10%] h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        voiceState={voiceState}
        onTabSelect={setActiveTab}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="relative z-10 flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between">
        {activeTab === 'Tasks' && (
          <div className="mx-auto max-w-4xl py-6 px-4">
            <TaskManager tasks={tasks} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onDeleteAllTasks={handleDeleteAllTasks} />
          </div>
        )}
        {activeTab === 'Notes' && (
          <div className="mx-auto max-w-4xl py-6 px-4">
            <NotesPanel notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />
          </div>
        )}
        {activeTab === 'Research' && (
          <div className="mx-auto max-w-4xl py-6 px-4"><ResearchPanel /></div>
        )}
        {activeTab === 'Calendar' && (
          <div className="mx-auto max-w-4xl py-6 px-4"><CalendarPanel /></div>
        )}
        {activeTab === 'Plans' && (
          <div className="mx-auto max-w-4xl py-6 px-4"><PlansManager plans={plans} onUpdatePlanItemStatus={handleUpdatePlanItemStatus} /></div>
        )}
        {activeTab === 'Memory' && (
          <div className="mx-auto max-w-4xl py-6 px-4"><MemoryManager memories={memories} /></div>
        )}
        {activeTab === 'Voice' && (
          <>
            {/* Desktop View: 3-Column Layout with Voice in Center matching media_1790683009128.png */}
            <div className="hidden xl:grid xl:grid-cols-12 gap-6 items-start flex-1 min-h-[calc(100vh-130px)]">
              {/* Left Panel: Conversation */}
              <aside className="xl:col-span-3 h-[calc(100vh-120px)] sticky top-20">
                <ConversationPanel messages={messages} />
              </aside>

              {/* Center: Voice Workspace (The Visual Focus) */}
              <section className="xl:col-span-6 flex items-center justify-center min-h-[calc(100vh-150px)] py-4">
                <VoiceWorkspace
                  onAddMessage={handleAddMessage}
                  onAddActivityEvent={handleAddActivityEvent}
                  onUserTranscript={handleVoiceTranscript}
                  onVoiceStateChange={setVoiceState}
                  selectedVoice={settings.voice.voiceId}
                  handsFree={settings.handsFree}
                />
              </section>

              {/* Right Panel: Live Activity */}
              <aside className="xl:col-span-3 h-[calc(100vh-120px)] sticky top-20">
                <LiveActivityPanel events={activityEvents} />
              </aside>
            </div>

            {/* Tablet & Mid-Sized Desktop (2-Column / Stacked Panels) */}
            <div className="hidden md:flex xl:hidden flex-col gap-8 py-6">
              <section className="flex items-center justify-center py-4">
                <VoiceWorkspace
                  onAddMessage={handleAddMessage}
                  onAddActivityEvent={handleAddActivityEvent}
                  onUserTranscript={handleVoiceTranscript}
                  onVoiceStateChange={setVoiceState}
                  selectedVoice={settings.voice.voiceId}
                  handsFree={settings.handsFree}
                />
              </section>
              <div className="grid grid-cols-2 gap-6 min-h-[420px]">
                <div className="h-[480px]">
                  <ConversationPanel messages={messages} />
                </div>
                <div className="h-[480px]">
                  <LiveActivityPanel events={activityEvents} />
                </div>
              </div>
            </div>

            {/* Mobile View: Prominent Voice Orb & Stacked Panels */}
            <div className="flex md:hidden flex-col gap-6 py-2">
              <section className="py-2">
                <VoiceWorkspace
                  onAddMessage={handleAddMessage}
                  onAddActivityEvent={handleAddActivityEvent}
                  onUserTranscript={handleVoiceTranscript}
                  onVoiceStateChange={setVoiceState}
                  selectedVoice={settings.voice.voiceId}
                  handsFree={settings.handsFree}
                />
              </section>
              <div className="h-[360px]">
                <ConversationPanel messages={messages} />
              </div>
              <div className="h-[360px]">
                <LiveActivityPanel events={activityEvents} />
              </div>
            </div>
          </>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          initialCategory={settingsCategory}
          onChange={handleSettingsChange}
          onClearLocalData={handleClearLocalData}
          onRequestMicrophone={handleRequestMicrophone}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      {showTutorial && <OnboardingTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
