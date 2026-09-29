'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Database,
  Globe2,
  Info,
  KeyRound,
  Monitor,
  Palette,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Unplug,
  UserRound,
  Volume2,
  X,
} from 'lucide-react';
import {
  DEFAULT_VOICE_ID,
  SUPPORTED_VOICES,
  SupportedVoice,
} from '@/lib/voice/voice-settings';
import { KaryaSettings } from '@/lib/settings/karya-settings';
import { KaryaSwitch } from '@/components/ui/KaryaSwitch';
import { useKaryaAuth } from '@/lib/auth/user-context';

type SettingsCategory =
  | 'account'
  | 'appearance'
  | 'voice'
  | 'language'
  | 'handsFree'
  | 'permissions'
  | 'integrations'
  | 'mcp'
  | 'desktopBridge'
  | 'privacy'
  | 'notifications'
  | 'about';

interface SettingsModalProps {
  settings: KaryaSettings;
  initialCategory?: SettingsCategory;
  onChange: (settings: KaryaSettings) => void;
  onClose: () => void;
  onClearLocalData: () => void;
  onRequestMicrophone: () => Promise<void>;
}

const categories: Array<{ id: SettingsCategory; label: string; icon: React.ElementType; keywords: string }> = [
  { id: 'account', label: 'Account', icon: UserRound, keywords: 'user account sign in sign out profile clerk google' },
  { id: 'appearance', label: 'Appearance', icon: Palette, keywords: 'theme accent density animation background glass' },
  { id: 'voice', label: 'Voice', icon: Volume2, keywords: 'voice preview assistant' },
  { id: 'language', label: 'Language', icon: Globe2, keywords: 'language recognition spoken output' },
  { id: 'handsFree', label: 'Hands-Free', icon: SlidersHorizontal, keywords: 'hands free wake phrase microphone listening' },
  { id: 'permissions', label: 'Permissions', icon: KeyRound, keywords: 'microphone notifications desktop bridge permission' },
  { id: 'integrations', label: 'Integrations', icon: Unplug, keywords: 'calendar tasks github drive discord notion connected services' },
  { id: 'mcp', label: 'MCP', icon: Database, keywords: 'model context protocol server tools' },
  { id: 'desktopBridge', label: 'Desktop Bridge', icon: Monitor, keywords: 'pc control computer local application' },
  { id: 'privacy', label: 'Privacy', icon: Shield, keywords: 'conversation transcripts activity local data' },
  { id: 'notifications', label: 'Notifications', icon: Bell, keywords: 'browser reminders voice session' },
  { id: 'about', label: 'About', icon: CircleHelp, keywords: 'version documentation github hackathon' },
];

const inputLanguages = [
  'English', 'Spanish', 'German', 'French', 'Portuguese', 'Italian', 'Turkish',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Hindi', 'Vietnamese',
  'Arabic', 'Hebrew', 'Japanese', 'Chinese',
];
const outputLanguages = ['English', 'Italian', 'Spanish', 'German', 'Portuguese', 'French'];
const timezones = ['system', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'];
const accentPalette: Record<string, string> = {
  default: '#8b5cf6',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#22d3ee',
  green: '#34d399',
  amber: '#fbbf24',
};

function updateSection<K extends keyof KaryaSettings>(
  settings: KaryaSettings,
  section: K,
  values: Partial<KaryaSettings[K]>
): KaryaSettings {
  return { ...settings, [section]: { ...settings[section], ...values } };
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

function OptionPicker({ value, options, onChange, label }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('[data-option-picker-root]') === null) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div className="relative min-w-[145px]" data-option-picker-root>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0c101a] px-3 py-2 text-xs text-slate-200 outline-none hover:border-indigo-400/50 focus-visible:ring-2 focus-visible:ring-indigo-400/60">
        <span>{selected.label}</span><ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute right-0 z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#0c101a] p-1 shadow-2xl">
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs ${option.value === value ? 'bg-indigo-500/20 text-white' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>
              {option.label}{option.value === value && <Check className="h-3.5 w-3.5 text-cyan-300" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, initialCategory = 'appearance', onChange, onClose, onClearLocalData, onRequestMicrophone }) => {
  const [category, setCategory] = useState<SettingsCategory>(initialCategory);
  const [search, setSearch] = useState('');
  const [mobileDetail, setMobileDetail] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<PermissionState | 'unsupported'>('prompt');
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, 'not-configured' | 'not-connected' | 'connected' | 'error'>>({});
  const [desktopStatus, setDesktopStatus] = useState<{ connected: boolean; bridgeRunning?: boolean }>({ connected: false });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Check desktop bridge status
    const token = typeof window !== 'undefined' ? localStorage.getItem('karya.desktop.token') : null;
    const url = token ? `/api/integrations/desktop?action=status&token=${encodeURIComponent(token)}` : '/api/integrations/desktop?action=status';
    fetch(url, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setDesktopStatus({ connected: Boolean(data.connected), bridgeRunning: Boolean(data.bridgeRunning) });
      })
      .catch(() => {
        setDesktopStatus({ connected: false, bridgeRunning: false });
      });
  }, [category]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (navigator.permissions?.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
          setMicrophoneStatus(status.state);
          status.onchange = () => setMicrophoneStatus(status.state);
        }).catch(() => setMicrophoneStatus('unsupported'));
      } else {
        setMicrophoneStatus('unsupported');
      }
      setNotificationStatus(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (category !== 'integrations') return;
    Promise.all(['google-calendar', 'github'].map(async (provider) => {
      try {
        const response = await fetch(`/api/integrations/${provider === 'google-calendar' ? 'google' : 'github'}/status`, { cache: 'no-store' });
        const data = await response.json() as { status?: 'not-configured' | 'not-connected' | 'connected' | 'error' };
        return [provider, data.status || 'error'] as const;
      } catch {
        return [provider, 'error'] as const;
      }
    })).then((entries) => setIntegrationStatus(Object.fromEntries(entries)));
  }, [category]);

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? categories.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(query)) : categories;
  }, [search]);
  const selectedVoice = SUPPORTED_VOICES.find((voice) => voice.id === settings.voice.voiceId) || SUPPORTED_VOICES.find((voice) => voice.id === DEFAULT_VOICE_ID)!;
  const selectedCategory = categories.find((item) => item.id === category)!;
  const set = (next: KaryaSettings) => onChange(next);
  const showNotice = (message: string) => setNotice(message);

  const renderContent = () => {
    switch (category) {
      case 'account':
        return <AccountSection onNotice={showNotice} />;
      case 'appearance':
        return <Section title="Appearance" subtitle="Shape the KARYA workspace to match your focus.">
          <SettingRow title="Theme" description="Choose how KARYA surfaces appear."><OptionPicker label="Theme" value={settings.appearance.theme} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }]} onChange={(value) => set(updateSection(settings, 'appearance', { theme: value as KaryaSettings['appearance']['theme'] }))} /></SettingRow>
          <SettingRow title="Accent color" description="Use a color accent across supported controls."><div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10" style={{ background: accentPalette[settings.appearance.accent] || accentPalette.default }}><span className="h-3 w-3 rounded-full border border-white/50 bg-white/80" /></div>
            <OptionPicker label="Accent color" value={settings.appearance.accent} options={['default', 'blue', 'purple', 'cyan', 'green', 'amber'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} onChange={(value) => set(updateSection(settings, 'appearance', { accent: value as KaryaSettings['appearance']['accent'] }))} />
          </div></SettingRow>
          <SettingRow title="Interface density" description="Adjust spacing for a comfortable or compact workspace."><OptionPicker label="Interface density" value={settings.appearance.density} options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} onChange={(value) => set(updateSection(settings, 'appearance', { density: value as KaryaSettings['appearance']['density'] }))} /></SettingRow>
          <SettingRow title="Animations" description="Reduce motion if you prefer a calmer interface."><OptionPicker label="Animation intensity" value={settings.appearance.animations} options={[{ value: 'full', label: 'Full' }, { value: 'reduced', label: 'Reduced' }, { value: 'off', label: 'Off' }]} onChange={(value) => set(updateSection(settings, 'appearance', { animations: value as KaryaSettings['appearance']['animations'] }))} /></SettingRow>
          <SettingRow title="Background effects" description="Control ambient workspace glows."><KaryaSwitch label="Background effects" checked={settings.appearance.backgroundEffects} onChange={(value) => set(updateSection(settings, 'appearance', { backgroundEffects: value }))} /></SettingRow>
          <SettingRow title="Glass effects" description="Control blur and translucent panel treatments."><KaryaSwitch label="Glass effects" checked={settings.appearance.glassEffects} onChange={(value) => set(updateSection(settings, 'appearance', { glassEffects: value }))} /></SettingRow>
        </Section>;
      case 'voice':
        return <Section title="Voice" subtitle="Only voices documented by AssemblyAI are listed. Changes apply to new sessions.">
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 text-xs leading-relaxed text-slate-300"><Info className="mr-2 inline h-4 w-4 text-cyan-300" />Active sessions keep their current voice because AssemblyAI binds voice at session start.</div>
          <div className="grid gap-3 sm:grid-cols-2">{SUPPORTED_VOICES.map((voice) => <VoiceCard key={voice.id} voice={voice} selected={voice.id === selectedVoice.id} onSelect={() => set(updateSection(settings, 'voice', { voiceId: voice.id }))} />)}</div>
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] p-4"><div><p className="text-sm font-medium text-slate-200">Voice preview</p><p className="mt-1 text-xs text-slate-500">Standalone preview is unavailable in the current temporary-token WebSocket architecture.</p></div><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500">Preview unavailable</span></div>
        </Section>;
      case 'language':
        return <Section title="Language" subtitle="Recognition and spoken output use different AssemblyAI capability sets.">
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3 text-xs leading-relaxed text-slate-300"><Info className="mr-2 inline h-4 w-4 text-amber-300" />Hindi recognition is supported. Spoken output is not currently available for the managed AssemblyAI Voice Agent output languages.</div>
          <SettingRow title="Input / recognition language" description="Languages KARYA can understand through AssemblyAI recognition."><OptionPicker label="Recognition language" value={settings.language.input} options={[{ value: 'auto', label: 'Auto detect' }, ...inputLanguages.map((language) => ({ value: language, label: language }))]} onChange={(value) => set(updateSection(settings, 'language', { input: value }))} /></SettingRow>
          <SettingRow title="Spoken response language" description="Languages currently supported by managed Voice Agent speech output."><OptionPicker label="Spoken output language" value={settings.language.output} options={[{ value: 'auto', label: 'Auto' }, ...outputLanguages.map((language) => ({ value: language, label: language }))]} onChange={(value) => set(updateSection(settings, 'language', { output: value }))} /></SettingRow>
          <SettingRow title="Timezone" description="Used by KARYA's date, time, and relative-date tools. System follows this browser's timezone."><OptionPicker label="Timezone" value={settings.language.timezone} options={timezones.map((timezone) => ({ value: timezone, label: timezone === 'system' ? 'System timezone' : timezone }))} onChange={(value) => set(updateSection(settings, 'language', { timezone: value }))} /></SettingRow>
          <div className="grid gap-2 sm:grid-cols-2">{inputLanguages.map((language) => <div key={language} className={`rounded-lg border p-3 text-xs ${outputLanguages.includes(language) ? 'border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-200' : 'border-white/[0.07] bg-white/[0.02] text-slate-400'}`}><p>{language}</p><p className="mt-1 text-[10px] opacity-75">{outputLanguages.includes(language) ? 'Recognition and spoken output supported' : 'Recognition supported · spoken output unavailable'}</p></div>)}</div>
        </Section>;
      case 'handsFree':
        return <Section title="Hands-Free" subtitle="Use browser wake-phrase detection while this tab remains open. Microphone permission is required.">
          <div className={`rounded-xl border p-4 ${settings.handsFree.enabled ? 'border-cyan-400/25 bg-cyan-400/[0.05]' : 'border-white/[0.07] bg-white/[0.02]'}`}><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-200">{settings.handsFree.enabled ? 'Hands-Free enabled' : 'Hands-Free disabled'}</p><p className="mt-1 text-xs text-slate-400">Disable this switch to stop wake detection and release microphone-related browser resources.</p></div><KaryaSwitch label="Hands-Free mode" checked={settings.handsFree.enabled} onChange={(value) => set(updateSection(settings, 'handsFree', { enabled: value }))} /></div></div>
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3 text-xs leading-relaxed text-slate-300">Wake detection uses the browser Speech Recognition API when available. The site must remain open, and some browsers may process recognition through their speech service. If unsupported, use the voice orb instead.</div>
          <SettingRow title="Wake phrase" description="Preferred phrase for the future local wake gate."><span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">{settings.handsFree.wakePhrase}</span></SettingRow>
          <SettingRow title="Require wake phrase" description="Informational preference; browser wake detection currently always waits for the configured phrase."><KaryaSwitch label="Require wake phrase" checked={settings.handsFree.requireWakePhrase} onChange={(value) => set(updateSection(settings, 'handsFree', { requireWakePhrase: value }))} /></SettingRow>
          <SettingRow title="Continue listening" description="Informational preference; the current browser wake flow returns to waiting only after a completed session."><KaryaSwitch label="Continue listening" checked={settings.handsFree.continueListening} onChange={(value) => set(updateSection(settings, 'handsFree', { continueListening: value }))} /></SettingRow>
          <SettingRow title="Start listening automatically" description="Informational preference; browsers require an explicit user gesture before microphone capture can start."><KaryaSwitch label="Start listening automatically" checked={settings.handsFree.startAutomatically} onChange={(value) => set(updateSection(settings, 'handsFree', { startAutomatically: value }))} /></SettingRow>
          <SettingRow title="Stop after response" description="End the AssemblyAI session after a hands-free response and return to idle."><KaryaSwitch label="Stop after response" checked={settings.handsFree.stopAfterResponse} onChange={(value) => set(updateSection(settings, 'handsFree', { stopAfterResponse: value }))} /></SettingRow>
        </Section>;
      case 'permissions':
        return <Section title="Permissions" subtitle="KARYA reports browser permission state instead of assuming access.">
          <PermissionRow title="Microphone" status={microphoneStatus} description="Required for live voice interaction." action={microphoneStatus === 'prompt' || microphoneStatus === 'denied' ? <button type="button" onClick={async () => { await onRequestMicrophone(); setMicrophoneStatus('granted'); }} className="rounded-lg bg-indigo-500/20 px-3 py-2 text-xs text-indigo-200 hover:bg-indigo-500/30">Request</button> : undefined} />
          <PermissionRow title="Browser notifications" status={notificationStatus} description="Not used by current KARYA features." action={<span className="text-[10px] text-slate-500">Not used</span>} />
          <PermissionRow title="Desktop Bridge" status={desktopStatus.connected ? 'granted' : 'not-connected'} description={desktopStatus.connected ? 'Connected to local bridge at 127.0.0.1:48123' : 'Local bridge is offline or unpaired.'} />
        </Section>;
      case 'integrations':
        return <Section title="Integrations" subtitle="OAuth connections and local companion extensions are managed here. Tokens are kept secure.">
          <div className="grid gap-3 sm:grid-cols-2">
            <BrowserExtensionCard onNotice={showNotice} />
            <IntegrationCard name="Google Calendar" provider="google-calendar" status={integrationStatus['google-calendar'] || 'not-configured'} onNotice={showNotice} />
            <IntegrationCard name="GitHub" provider="github" status={integrationStatus.github || 'not-configured'} onNotice={showNotice} />
            <IntegrationCard name="Weather" provider="weather" status="available" onNotice={showNotice} />
            <IntegrationCard name="Web Research" provider="web-research" status="not-configured" onNotice={showNotice} />
            <IntegrationCard name="Google Tasks" provider="unavailable" status="not-configured" onNotice={showNotice} />
            <IntegrationCard name="Google Drive" provider="unavailable" status="not-configured" onNotice={showNotice} />
            <IntegrationCard name="Discord" provider="unavailable" status="not-configured" onNotice={showNotice} />
            <IntegrationCard name="Notion" provider="unavailable" status="not-configured" onNotice={showNotice} />
          </div>
        </Section>;
      case 'mcp':
        return <Section title="MCP" subtitle="MCP lets KARYA connect to external tools and services through Model Context Protocol servers."><div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-xs leading-relaxed text-slate-300"><Shield className="mr-2 inline h-4 w-4 text-amber-300" />MCP servers can expose tools to KARYA. Only connect servers you trust; arbitrary browser-side execution is not enabled.</div><div className="rounded-xl border border-dashed border-white/10 p-8 text-center"><Database className="mx-auto h-7 w-7 text-slate-500" /><p className="mt-3 text-sm text-slate-300">No MCP servers connected</p><button type="button" onClick={() => showNotice('MCP server setup coming soon.')} className="mt-4 rounded-lg bg-indigo-500/20 px-3 py-2 text-xs text-indigo-200">+ Add MCP server</button></div></Section>;
      case 'desktopBridge':
        return <DesktopBridgeSection onNotice={showNotice} />;
      case 'privacy':
        return <Section title="Privacy" subtitle="These controls describe data stored locally in this browser."><SettingRow title="Conversation history" description="Keep conversation messages in the current application session."><KaryaSwitch label="Conversation history" checked={settings.privacy.conversationHistory} onChange={(value) => set(updateSection(settings, 'privacy', { conversationHistory: value }))} /></SettingRow><SettingRow title="Save voice transcripts" description="Preference for future persistent transcript storage; no cloud transcript database exists yet."><KaryaSwitch label="Save voice transcripts" checked={settings.privacy.saveTranscripts} onChange={(value) => set(updateSection(settings, 'privacy', { saveTranscripts: value }))} /></SettingRow><SettingRow title="Save activity history" description="Preference for future persistent activity storage; current activity is in-memory."><KaryaSwitch label="Save activity history" checked={settings.privacy.saveActivity} onChange={(value) => set(updateSection(settings, 'privacy', { saveActivity: value }))} /></SettingRow><SettingRow title="Long-term memory" description="Store only explicit, non-sensitive memories requested with phrases such as remember this."><KaryaSwitch label="Long-term memory" checked={settings.privacy.memoryEnabled} onChange={(value) => set(updateSection(settings, 'privacy', { memoryEnabled: value }))} /></SettingRow><div className="rounded-xl border border-white/[0.07] p-4 text-xs text-slate-400">Local settings are stored in this browser. Microphone audio is used for voice interaction only when permission is granted.</div><button type="button" onClick={() => setClearConfirm(true)} className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-400/10">Clear local KARYA data</button>{clearConfirm && <ConfirmBox onCancel={() => setClearConfirm(false)} onConfirm={() => { setClearConfirm(false); onClearLocalData(); }} />}</Section>;
      case 'notifications':
        return <Section title="Notifications" subtitle="Only preferences are stored until the related features exist."><SettingRow title="Browser notifications" description="Notification permission is shown under Permissions; no current feature sends notifications."><KaryaSwitch label="Browser notifications" checked={settings.notifications.browser} onChange={(value) => set(updateSection(settings, 'notifications', { browser: value }))} /></SettingRow><SettingRow title="Task reminders" description="Task reminders are not implemented yet."><KaryaSwitch label="Task reminders" checked={settings.notifications.taskReminders} onChange={(value) => set(updateSection(settings, 'notifications', { taskReminders: value }))} /></SettingRow><SettingRow title="Voice session notifications" description="Voice session notifications are not implemented yet."><KaryaSwitch label="Voice session notifications" checked={settings.notifications.voiceSession} onChange={(value) => set(updateSection(settings, 'notifications', { voiceSession: value }))} /></SettingRow></Section>;
      case 'about':
        return <Section title="About" subtitle="The current KARYA build and technology stack."><div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.05] p-5"><Sparkles className="h-6 w-6 text-indigo-300" /><h3 className="mt-3 text-xl font-semibold text-white">KARYA</h3><p className="mt-1 text-sm text-indigo-200">Speak. Decide. Done.</p><div className="mt-5 grid gap-3 text-xs text-slate-400 sm:grid-cols-2"><p>Version: <span className="text-slate-200">0.1.0</span></p><p>Build: <span className="text-slate-200">Production / Next.js</span></p><p>Technology: <span className="text-slate-200">TypeScript, Next.js</span></p><p>Voice: <span className="text-slate-200">AssemblyAI Voice Agent API</span></p></div></div><p className="text-xs text-slate-400">Built for the AssemblyAI Voice Agent Hackathon.</p><div className="flex flex-wrap gap-2"><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500">GitHub link not configured</span><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500">Documentation link not configured</span><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500">Report a bug</span></div></Section>;
    }
  };

  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="glass-panel flex min-h-[min(760px,calc(100vh-2rem))] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:min-h-[min(760px,calc(100vh-4rem))]" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-6 sm:py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300"><Settings className="h-4 w-4" /></div><div><h2 id="settings-title" className="text-sm font-semibold text-white">Settings Center</h2><p className="text-xs text-slate-400">Tune KARYA without changing your voice workspace.</p></div></div><button type="button" onClick={onClose} aria-label="Close settings" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button></header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row"><aside className={`${mobileDetail ? 'hidden' : 'flex'} w-full flex-col border-b border-white/[0.08] md:flex md:w-56 md:shrink-0 md:border-b-0 md:border-r`}><div className="p-3"><label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings..." className="min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" /></label></div><nav className="grid max-h-56 gap-1 overflow-y-auto px-3 pb-3 md:block md:max-h-none md:flex-1">{visibleCategories.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setCategory(item.id); setMobileDetail(true); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${category === item.id ? 'bg-indigo-500/20 text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>; })}</nav></aside><main className={`${mobileDetail ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col md:flex`}><div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3 md:hidden"><button type="button" onClick={() => setMobileDetail(false)} className="flex items-center gap-1 text-xs text-slate-400"><ChevronLeft className="h-4 w-4" />Categories</button></div>      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"><div className="mb-5 flex items-center gap-2"><selectedCategory.icon className="h-4 w-4 text-cyan-300" /><div><h3 className="text-base font-semibold text-white">{selectedCategory.label}</h3><p className="text-xs text-slate-400">{selectedCategory.keywords.split(' ').slice(0, 4).join(' · ')}</p></div></div>{notice && <div role="status" className="mb-3 flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-200"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X className="h-3.5 w-3.5" /></button></div>}<div className="space-y-3">{renderContent()}</div></div></main></div>
      <footer className="flex items-center justify-between border-t border-white/[0.08] px-4 py-3 sm:px-6"><p className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex"><UserRound className="h-3.5 w-3.5" />Preferences are stored locally in this browser.</p><button type="button" onClick={onClose} className="ml-auto rounded-lg bg-indigo-500/20 px-4 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/30">Done</button></footer>
    </section>
  </div>;
};

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <><div><h4 className="text-sm font-medium text-slate-200">{title}</h4><p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p></div><div className="space-y-3">{children}</div></>;
}

function VoiceCard({ voice, selected, onSelect }: { voice: SupportedVoice; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? 'border-cyan-400/40 bg-cyan-400/[0.08]' : 'border-white/[0.07] bg-white/[0.02] hover:border-indigo-400/30 hover:bg-white/[0.04]'}`}><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200"><Volume2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{voice.name}</p><p className="text-[11px] text-slate-400">{voice.accent} · {voice.language}</p></div>{selected && <span className="flex items-center gap-1 rounded-full border border-cyan-400/20 px-2 py-1 text-[10px] text-cyan-200"><Check className="h-3 w-3" />Selected</span>}</button>;
}

function PermissionRow({ title, description, status, action }: { title: string; description: string; status: string; action?: React.ReactNode }) {
  const label = status === 'granted' ? 'Granted' : status === 'denied' ? 'Denied' : status === 'prompt' || status === 'default' ? 'Not requested' : status === 'not-connected' ? 'Not connected' : 'Unavailable';
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-xs text-slate-400">{label}</span>{action}</div></div>;
}

function IntegrationCard({ name, provider, status = 'error', onNotice }: { name: string; provider: 'google-calendar' | 'github' | 'weather' | 'web-research' | 'unavailable'; status?: 'available' | 'not-configured' | 'not-connected' | 'connected' | 'error'; onNotice: (message: string) => void }) {
  const router = useRouter();
  const configured = provider === 'google-calendar' || provider === 'github';
  const label = status === 'available' ? 'Available' : status === 'connected' ? 'Connected' : status === 'not-configured' ? 'Not configured' : status === 'not-connected' ? 'Not connected' : 'Unavailable';
  const basePath = provider === 'google-calendar' ? 'google' : 'github';
  const handleAction = async () => {
    if (provider === 'weather') {
      onNotice('Weather uses the public Open-Meteo provider and needs a city at query time.');
      return;
    }
    if (!configured) {
      onNotice(`${name} is not configured in this deployment.`);
      return;
    }
    if (status === 'connected') {
      const response = await fetch(`/api/integrations/${basePath}/disconnect`, { method: 'POST' });
      onNotice(response.ok ? `${name} disconnected.` : `Could not disconnect ${name}.`);
      return;
    }
    router.push(`/api/integrations/${basePath}/authorize`);
  };
  const description = provider === 'weather'
    ? 'Public weather data is available when a city is provided.'
    : configured
    ? 'OAuth connection status is checked from the server.'
    : 'Provider credentials are not configured.';
  const actionLabel = provider === 'weather' ? 'Available' : status === 'connected' ? 'Disconnect' : configured ? 'Connect' : 'Unavailable';
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-200">{name}</p><span className={`rounded-full border px-2 py-1 text-[10px] ${status === 'connected' || status === 'available' ? 'border-emerald-400/20 text-emerald-200' : 'border-slate-500/20 text-slate-500'}`}>{label}</span></div><p className="mt-2 text-xs text-slate-400">{description}</p><button type="button" onClick={() => void handleAction()} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]">{actionLabel}</button></div>;
}

function ConfirmBox({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"><div className="glass-panel max-w-sm rounded-xl border border-white/10 p-5"><h3 className="text-sm font-semibold text-white">Clear KARYA&apos;s local data?</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">This removes locally stored preferences and the current conversation and activity data. It does not delete server data.</p><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Cancel</button><button type="button" onClick={onConfirm} className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs text-rose-200">Clear data</button></div></div></div>;
}

import { useAuth } from '@clerk/nextjs';

function BrowserExtensionCard({ onNotice }: { onNotice: (message: string) => void }) {
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { getToken } = useAuth();

  useEffect(() => {
    // Ping extension to see if it's there
    const chromeGlobal = typeof window !== 'undefined' ? (window as unknown as { chrome?: { runtime?: { sendMessage?: Function } } }).chrome : undefined;
    if (chromeGlobal?.runtime?.sendMessage) {
      try {
        chromeGlobal.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (response: any) => {
          if (response?.success) {
            setConnected(true);
          } else {
             setConnected(false);
          }
        });
      } catch {
        setConnected(false);
      }
    }
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        onNotice('You must be signed in to connect the extension.');
        return;
      }
      const chromeGlobal = typeof window !== 'undefined' ? (window as unknown as { chrome?: { runtime?: { sendMessage?: Function } } }).chrome : undefined;
      if (chromeGlobal?.runtime?.sendMessage) {
        chromeGlobal.runtime.sendMessage(
          { type: 'PAIR', authToken: token, karyaUrl: window.location.origin, pairingCode: 'auto-clerk' },
          (response: any) => {
            if (response?.success) {
              setConnected(true);
              localStorage.setItem('karya.browser.token', token);
              onNotice('Extension connected successfully via Clerk auth!');
            } else {
              onNotice('Failed to connect extension. Make sure it is installed and enabled.');
            }
          }
        );
      } else {
         onNotice('Extension not detected. Please install and reload.');
      }
    } catch {
      onNotice('Error connecting to extension.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('karya.browser.token');
    }
    setConnected(false);
    onNotice('Browser extension disconnected.');
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col h-full">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">Browser Extension</p>
        <span className={`rounded-full border px-2 py-1 text-[10px] ${connected ? 'border-emerald-400/20 text-emerald-200' : 'border-slate-500/20 text-slate-500'}`}>
          {connected ? 'Connected' : 'Not detected'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400 flex-1">
        Companion Chrome extension for tab context, page reading, scrolling, and search.
      </p>
      
      <div className="mt-4 flex flex-col gap-2">
        <a 
          href="/karya-browser-extension.zip" 
          download
          className="flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] w-full"
        >
          Download Extension (ZIP)
        </a>
        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] w-full"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleConnect}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 w-full"
          >
            {loading ? 'Connecting...' : 'Connect to Extension'}
          </button>
        )}
      </div>
    </div>
  );
}

function DesktopBridgeSection({ onNotice }: { onNotice: (message: string) => void }) {
  const [bridgeRunning, setBridgeRunning] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [generatedPairingCode, setGeneratedPairingCode] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('karya.desktop.token') : null;
      const url = token ? `/api/integrations/desktop?action=status&token=${encodeURIComponent(token)}` : '/api/integrations/desktop?action=status';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setBridgeRunning(Boolean(data.bridgeRunning));
      setConnected(Boolean(data.connected));
    } catch {
      setBridgeRunning(false);
      setConnected(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handlePair = async () => {
    if (!pairingCodeInput.trim()) {
      onNotice('Please enter the 6-character pairing code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/desktop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pair', code: pairingCodeInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('karya.desktop.token', data.token);
        }
        setConnected(true);
        setPairingCodeInput('');
        onNotice('KARYA Desktop Bridge paired successfully!');
        checkStatus();
      } else {
        onNotice(`Pairing failed: ${data.error || 'Invalid or expired code'}`);
      }
    } catch {
      onNotice('Could not connect to Desktop Bridge.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetPairingCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/desktop?action=pairing-code');
      const data = await res.json();
      if (data.code) {
        setGeneratedPairingCode(data.code);
        onNotice(`Pairing code from Bridge: ${data.code}`);
      } else {
        onNotice(`Could not get code: ${data.error || 'Bridge is offline'}`);
      }
    } catch {
      onNotice('Error contacting Desktop Bridge.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('karya.desktop.token') : null;
    if (token) {
      try {
        await fetch('/api/integrations/desktop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disconnect', token }),
        });
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('karya.desktop.token');
      }
    }
    setConnected(false);
    setSystemInfo(null);
    onNotice('Desktop Bridge disconnected.');
    checkStatus();
  };

  const handleTestConnection = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('karya.desktop.token') : null;
    if (!token) {
      onNotice('Desktop Bridge is not paired.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/desktop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'command',
          token,
          command: { action: 'get_system_info' },
        }),
      });
      const data = await res.json();
      if (data.result && data.result.success) {
        const d = data.result.data;
        const info = `${d.platform} | CPU: ${d.cpuModel} (${d.cpuCores} cores) | RAM: ${(d.freeMemoryMb / 1024).toFixed(1)}GB free / ${(d.totalMemoryMb / 1024).toFixed(1)}GB total | Uptime: ${(d.uptimeSeconds / 3600).toFixed(1)}h`;
        setSystemInfo(info);
        onNotice('Desktop Bridge connection verified!');
      } else {
        onNotice(`Test failed: ${data.result?.error || data.error || 'Unknown error'}`);
      }
    } catch {
      onNotice('Failed to execute command on Desktop Bridge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Desktop Bridge" subtitle="Safe computer capabilities via standalone companion server at 127.0.0.1:48123.">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-200">
                {connected ? 'Connected & Authorized' : bridgeRunning ? 'Bridge Running (Unpaired)' : 'Bridge Offline'}
              </p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${connected ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : bridgeRunning ? 'border border-amber-400/20 bg-amber-500/10 text-amber-300' : 'border border-slate-500/20 bg-slate-500/10 text-slate-400'}`}>
                {connected ? 'Online' : bridgeRunning ? 'Ready to pair' : '127.0.0.1:48123'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {connected
                ? 'Desktop commands (apps, folders, files, screenshots) are enabled.'
                : bridgeRunning
                ? 'Bridge is running! Click Get Pairing Code below to pair.'
                : 'Download the Bridge (.exe), run it, and click refresh.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!connected && !bridgeRunning && (
              <a
                href="/karya-desktop-bridge.exe"
                download
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]"
              >
                Download Bridge
              </a>
            )}
            {connected ? (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTestConnection}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
                  placeholder="CODE (e.g. A1B2C3)"
                  className="w-32 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs uppercase text-white outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePair}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  Pair
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGetPairingCode}
                  className="rounded-lg border border-white/10 px-2 py-2 text-xs text-slate-400 hover:text-white"
                  title="Query code from bridge server"
                >
                  Get Code
                </button>
              </div>
            )}
          </div>
        </div>

        {generatedPairingCode && (
          <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-2 text-xs text-cyan-300">
            Current Bridge Code: <span className="font-mono font-bold">{generatedPairingCode}</span> (Paste above and click Pair)
          </div>
        )}

        {systemInfo && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-2 font-mono text-[11px] text-slate-300">
            {systemInfo}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {['Open applications (Chrome, Notepad, Calc)', 'Open URLs in default browser', 'Open approved user folders', 'Create safe files in Documents/Karya', 'Read user-selected files', 'System hardware metrics', 'Screenshots'].map((capability) => (
          <div key={capability} className="rounded-lg border border-white/[0.07] p-3 text-xs text-slate-400">
            <Monitor className="mr-2 inline h-3.5 w-3.5 text-slate-500" />
            {capability}
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-200/80">
        Strict security: bound only to 127.0.0.1, paths isolated to Documents/Karya, and zero shell/cmd execution.
      </p>
    </Section>
  );
}

function AccountSection({ onNotice }: { onNotice: (message: string) => void }) {
  const { isSignedIn, user, signIn, signUp, signOut } = useKaryaAuth();

  return (
    <Section title="KARYA Account" subtitle="Manage your KARYA identity and connected companion devices.">
      {isSignedIn && user ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-lg font-bold text-white shadow-lg">
              {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{user.name}</h3>
              <p className="text-xs text-slate-400">{user.email}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                ● Signed In · KARYA Account
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <h4 className="text-xs font-semibold text-slate-200">Identity & Connections</h4>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3 text-xs">
                <span className="text-slate-300">Google Authentication</span>
                <span className="text-emerald-400 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3 text-xs">
                <span className="text-slate-300">Account User ID</span>
                <span className="font-mono text-slate-400 text-[11px]">{user.id}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => {
                signOut();
                onNotice('Signed out of KARYA.');
              }}
              className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <UserRound className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-white">Not Signed In</h3>
          <p className="mt-1 text-xs text-slate-400">
            Sign in to KARYA to sync your companions, tasks, calendar, and preferences across devices.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={signIn}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.06]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={signUp}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

