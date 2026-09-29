'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Compass,
  LayoutGrid,
  Clock,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  Paperclip,
  Image as ImageIcon,
  ChevronDown,
  X,
  MessageSquare,
  Send,
  Play,
  Pause,
  Mic,
  Calendar,
  Globe,
  Monitor,
  Sparkles,
  ArrowLeft,
  MoreHorizontal,
  Folder,
  FileText,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { ConversationMessage, VoiceState } from '@/types/karya';
import { VoiceOrb } from '@/components/voice/VoiceOrb';
import { useKaryaAuth } from '@/lib/auth/user-context';

interface ModernAssistantWorkspaceProps {
  messages: ConversationMessage[];
  voiceState: VoiceState;
  volumeLevel: number;
  interimTranscript: string | null;
  onSendMessage: (text: string) => void;
  onToggleVoice: () => void;
  onOpenSettings: (category?: string) => void;
  onSelectTab: (tab: 'Voice' | 'Tasks' | 'Notes' | 'Research' | 'Calendar' | 'Plans' | 'Memory') => void;
  onNewConversation: () => void;
}

export const ModernAssistantWorkspace: React.FC<ModernAssistantWorkspaceProps> = ({
  messages,
  voiceState,
  volumeLevel,
  interimTranscript,
  onSendMessage,
  onToggleVoice,
  onOpenSettings,
  onSelectTab,
  onNewConversation,
}) => {
  const { isSignedIn, user } = useKaryaAuth();
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>('voice');
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [showIntegrationsMenu, setShowIntegrationsMenu] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Record<string, 'like' | 'dislike'>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [robotSpeech, setRobotSpeech] = useState<string>(
    'Stuck on something?\nLet me help, get a\nquick assist! 🫡'
  );
  
  // Track whether we are on Home View or active Conversation View
  const [isHomeView, setIsHomeView] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Transition from Home view to Conversation view when user takes action
  useEffect(() => {
    if (messages.length > 0 || voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'processing') {
      setIsHomeView(false);
    }
  }, [messages.length, voiceState]);

  // Sync robot speech bubble with AssemblyAI voice states
  useEffect(() => {
    switch (voiceState) {
      case 'listening':
        setRobotSpeech('Listening to you... 🎙️\nSpeak naturally!');
        break;
      case 'processing':
        setRobotSpeech('Thinking & reasoning... ⚡\nOn it!');
        break;
      case 'speaking':
        setRobotSpeech('Responding now... 💬\nTake a listen!');
        break;
      case 'error':
        setRobotSpeech('Let me know if you need help! ⚠️');
        break;
      default:
        setRobotSpeech('Stuck on something?\nLet me help, get a\nquick assist! 🫡');
        break;
    }
  }, [voiceState]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && !selectedTag) return;
    const finalMessage = selectedTag ? `${selectedTag} ${trimmed}` : trimmed;
    setIsHomeView(false);
    onSendMessage(finalMessage);
    setInputText('');
    setSelectedTag(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsHomeView(false);
      onSendMessage(
        `I uploaded a document: ${file.name} (${Math.round(file.size / 1024)} KB). Please inspect and summarize it.`
      );
      setShowPlusMenu(false);
    }
  };

  const handleAudioPlayToggle = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio && voiceState === 'idle') {
      onToggleVoice();
    }
  };

  const handleSelectIntegration = (tag: string) => {
    setSelectedTag(tag);
    setShowPlusMenu(false);
    setShowIntegrationsMenu(false);
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#0a0b0e] text-slate-100 font-sans antialiased selection:bg-slate-700 selection:text-white">
      
      {/* Subtle ambient gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)] blur-3xl" />
      </div>

      {/* ========================================================
          TOP HEADER & BRANDING BAR
          ======================================================== */}
      <header className="relative z-20 flex w-full max-w-7xl shrink-0 items-center justify-between px-6 py-4 sm:px-8">
        
        {/* Left Branding: KARYA + AI Assistant for AssemblyAI + by GGCART */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white shadow-md backdrop-blur-md">
            <img src="/ggcart-logo.png" alt="GGCART" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">KARYA</h1>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                v2.6
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              AI Assistant for <span className="text-slate-200">AssemblyAI</span> <span className="text-slate-500">by</span> <span className="text-blue-400 font-semibold">GGCART</span>
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (TEXT | VOICE) */}
        <div className="flex items-center rounded-full bg-white/5 p-1 border border-white/10 shadow-inner backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveMode('text')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeMode === 'text'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Text</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('voice');
              if (voiceState === 'idle') onToggleVoice();
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeMode === 'voice'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Voice</span>
          </button>
        </div>

        {/* Right Controls: History, Integrations, Account/Settings */}
        <div className="relative flex items-center gap-2 select-none">
          {/* Conversation History Trigger */}
          <button
            type="button"
            onClick={() => setShowHistoryMenu(!showHistoryMenu)}
            title="Conversation History"
            className="flex h-9 items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Integrations Trigger */}
          <button
            type="button"
            onClick={() => setShowIntegrationsMenu(!showIntegrationsMenu)}
            title="Available Integrations"
            className="flex h-9 items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Integrations</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={() => onOpenSettings('appearance')}
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => {
              setIsHomeView(true);
              onNewConversation();
            }}
            title="Start Fresh"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md hover:bg-slate-200 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* HISTORY POPOVER DROPDOWN */}
          <AnimatePresence>
            {showHistoryMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-12 top-12 z-50 w-72 rounded-2xl border border-white/15 bg-[#121318] p-3 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-xs font-semibold text-white">Conversation History</span>
                  <button type="button" onClick={() => setShowHistoryMenu(false)} className="text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar text-xs">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today</div>
                    <button
                      type="button"
                      onClick={() => { onSendMessage("What's the best way to create a daily plan?"); setShowHistoryMenu(false); }}
                      className="w-full text-left truncate rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      What&apos;s the best way to create a daily plan?
                    </button>
                    <button
                      type="button"
                      onClick={() => { onSendMessage("What if we discovered that today?"); setShowHistoryMenu(false); }}
                      className="w-full text-left truncate rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      What if we discovered that today?
                    </button>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yesterday</div>
                    <button
                      type="button"
                      onClick={() => { onSendMessage("Generate a 3D scene of robot..."); setShowHistoryMenu(false); }}
                      className="w-full text-left truncate rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      Generate a 3D scene of robot...
                    </button>
                    <button
                      type="button"
                      onClick={() => { onSendMessage("Help me write a professional plan"); setShowHistoryMenu(false); }}
                      className="w-full text-left truncate rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      Help me write a professional plan
                    </button>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Previous 7 Days</div>
                    <button
                      type="button"
                      onClick={() => { onSendMessage("What would a job interview prep look like?"); setShowHistoryMenu(false); }}
                      className="w-full text-left truncate rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      What would a job interview prep look like?
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* INTEGRATIONS POPOVER DROPDOWN */}
          <AnimatePresence>
            {showIntegrationsMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-white/15 bg-[#121318] p-3 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-xs font-semibold text-white">Active Integrations</span>
                  <button type="button" onClick={() => setShowIntegrationsMenu(false)} className="text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectIntegration('@calendar')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-200 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span>Calendar &amp; Planning</span>
                    </div>
                    <span className="text-[10px] text-slate-400">@calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectIntegration('@browser')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-200 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <Globe className="h-4 w-4 text-emerald-400" />
                      <span>Browser Companion</span>
                    </div>
                    <span className="text-[10px] text-slate-400">@browser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectIntegration('@desktop')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-200 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <Monitor className="h-4 w-4 text-amber-400" />
                      <span>Desktop Companion</span>
                    </div>
                    <span className="text-[10px] text-slate-400">@desktop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectIntegration('@google')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-200 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <Search className="h-4 w-4 text-red-400" />
                      <span>Google Search &amp; Cloud</span>
                    </div>
                    <span className="text-[10px] text-slate-400">@google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenSettings('integrations')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2 text-slate-400 hover:text-white transition mt-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span>More Integrations...</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ========================================================
          MAIN CENTRAL CANVAS: HOME SCREEN vs CONVERSATION VIEW
          ======================================================== */}
      <main className="relative z-10 flex flex-1 w-full max-w-6xl overflow-hidden px-4 sm:px-8">
        
        <AnimatePresence mode="wait">
          {/* 1. HOME SCREEN: Visually Striking Central Composition */}
          {isHomeView && messages.length === 0 && voiceState === 'idle' ? (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="relative flex flex-1 flex-col items-center justify-center py-6 text-center select-none"
            >
              {/* Product Hero Headline */}
              <div className="mb-4 flex flex-col items-center">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-2">
                  KARYA
                </h1>
                <p className="text-lg sm:text-xl font-medium text-slate-300 max-w-md">
                  AI Assistant for <span className="text-white font-semibold">AssemblyAI</span>
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span>by GGCART</span>
                </div>
              </div>

              {/* Central Composition Layout: Large MP4 Centerpiece + Floating Robot.svg */}
              <div className="relative flex items-center justify-center my-4 w-full max-w-2xl">
                
                {/* LARGE VISUAL CENTERPIECE MP4 */}
                <div className="relative h-[280px] sm:h-[360px] w-full rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/15 bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover pointer-events-none"
                  >
                    <source src="/karya-center.mp4" type="video/mp4" />
                    <source src="/karya-center.webm" type="video/webm" />
                  </video>
                  
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Centered Quick Voice Action Overlay */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHomeView(false);
                        onToggleVoice();
                      }}
                      className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-xl hover:bg-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      <Mic className="h-4 w-4 fill-black" />
                      <span>Start Voice Session</span>
                    </button>
                  </div>
                </div>

                {/* ROBOT ASSISTANT CHARACTER (Robot.svg) */}
                <div className="hidden lg:flex absolute -right-24 bottom-0 flex-col items-center">
                  {/* Speech bubble beside robot */}
                  <div className="relative mb-3 max-w-[160px] rounded-2xl bg-white/95 px-3 py-2 text-[11px] font-medium leading-tight text-slate-900 shadow-xl border border-white/20">
                    <p className="whitespace-pre-line text-left font-sans">{robotSpeech}</p>
                    <div className="absolute -left-1.5 bottom-4 h-2.5 w-2.5 rotate-45 bg-white/95 border-b border-l border-white/20" />
                  </div>

                  {/* Robot.svg with SMIL Animation Preserved */}
                  <div className="h-40 w-40 cursor-pointer transition hover:scale-105" onClick={onToggleVoice} title="Click KARYA Robot">
                    <img src="/Robot.svg" alt="KARYA Robot Assistant" className="h-full w-full object-contain drop-shadow-2xl select-none" />
                  </div>
                </div>
              </div>

              {/* Suggested Quick Prompt Chips */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsHomeView(false);
                    onSendMessage("What is my plan for today?");
                  }}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  🗓️ Plan my day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHomeView(false);
                    onSendMessage("Summarize my open tasks");
                  }}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  ✅ Summarize active tasks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHomeView(false);
                    onSendMessage("Check current weather and calendar");
                  }}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  🌤️ Check weather &amp; calendar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHomeView(false);
                    onSendMessage("@browser open YouTube");
                  }}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  🌐 Open browser companion
                </button>
              </div>
            </motion.div>
          ) : (
            
            /* 2. CONVERSATION VIEW */
            <motion.div
              key="conversation-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-1 flex-col h-full overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                
                {/* Voice Interaction Visualizer when Voice mode active */}
                {activeMode === 'voice' && (
                  <div className="mx-auto max-w-md my-4 rounded-3xl bg-white/5 border border-white/10 p-4 backdrop-blur-md shadow-2xl flex flex-col items-center">
                    <VoiceOrb
                      state={voiceState}
                      volumeLevel={volumeLevel}
                      interimTranscript={interimTranscript}
                      onClick={onToggleVoice}
                    />
                  </div>
                )}

                {/* Messages Stream */}
                <div className="mx-auto max-w-3xl space-y-6 pb-6 px-2">
                  
                  {/* Default reference conversation message if no messages yet */}
                  {messages.length === 0 && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-end space-y-1">
                        <div className="rounded-[22px] rounded-br-sm bg-white/10 border border-white/15 px-5 py-3 text-[14px] text-white shadow-sm">
                          Can you help me visualize a 3D scene?
                        </div>
                        <span className="text-[11px] text-slate-400 pr-1 select-none">Just now</span>
                      </div>

                      <div className="flex flex-col items-start space-y-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-md">
                            K
                          </div>
                          <div className="rounded-[22px] rounded-tl-sm bg-[#14151c] border border-white/10 px-5 py-3 text-[14px] leading-relaxed text-slate-200 shadow-md">
                            Sure! 😊 I&apos;d be happy to assist you with AssemblyAI voice controls or generating 3D scene visual cards.
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 pl-11 select-none">Just now</span>
                      </div>

                      {/* Reference 3D Cards Cluster Display */}
                      <div className="pl-11 py-2">
                        <div className="max-w-[420px] rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-black/40">
                          <img
                            src="/reference-cards-cluster.png"
                            alt="3D Visualizations"
                            className="w-full object-contain select-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real Dynamic Conversation Messages */}
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const feedback = likedMessages[msg.id];

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-start gap-3 max-w-[88%]">
                          {!isUser && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
                              K
                            </div>
                          )}

                          <div
                            className={`rounded-[22px] px-5 py-3 text-[14px] leading-relaxed shadow-sm ${
                              isUser
                                ? 'bg-white text-black font-medium rounded-br-sm'
                                : 'bg-[#14151c] border border-white/10 text-slate-200 rounded-tl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>

                        {/* Timestamp & Feedback controls */}
                        <div className={`flex items-center gap-2 px-1 text-[11px] text-slate-400 ${isUser ? 'pr-1' : 'pl-11'}`}>
                          <span>{msg.timestamp || 'Just now'}</span>
                          {!isUser && (
                            <div className="flex items-center gap-1.5 ml-2">
                              <button
                                type="button"
                                onClick={() => setLikedMessages(prev => ({ ...prev, [msg.id]: 'like' }))}
                                className={`p-1 rounded hover:bg-white/10 transition ${feedback === 'like' ? 'text-blue-400' : 'text-slate-500'}`}
                                title="Like response"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setLikedMessages(prev => ({ ...prev, [msg.id]: 'dislike' }))}
                                className={`p-1 rounded hover:bg-white/10 transition ${feedback === 'dislike' ? 'text-red-400' : 'text-slate-500'}`}
                                title="Dislike response"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition"
                                title="Copy text"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ========================================================
          BOTTOM CHAT COMPOSER: [ + ] [ Input... ] [ Mic ] [ Send ]
          ======================================================== */}
      <footer className="relative z-30 w-full max-w-4xl p-4 sm:p-6 shrink-0 select-none">
        
        {/* Active Integration Mention Tag */}
        {selectedTag && (
          <div className="mb-2 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white border border-white/20 shadow-md backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{selectedTag}</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="ml-1 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {/* Plus Action Popup Menu */}
        <AnimatePresence>
          {showPlusMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-20 left-6 z-50 w-72 rounded-2xl border border-white/15 bg-[#121318] p-3 shadow-2xl backdrop-blur-xl"
            >
              <div className="text-xs font-semibold text-slate-400 px-3 py-1 mb-1">Actions &amp; Integrations</div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 text-left transition"
              >
                <Paperclip className="h-4 w-4 text-slate-400" />
                <span>Upload File / Document</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsHomeView(false);
                  onSendMessage("Generate a 3D scene visual");
                  setShowPlusMenu(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 text-left transition"
              >
                <ImageIcon className="h-4 w-4 text-purple-400" />
                <span>Create Image / 3D Scene</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                type="button"
                onClick={() => handleSelectIntegration('@calendar')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Calendar</span>
                </div>
                <span className="text-[10px] text-slate-400">@calendar</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectIntegration('@google')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <Search className="h-4 w-4 text-red-400" />
                  <span>Google</span>
                </div>
                <span className="text-[10px] text-slate-400">@google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectIntegration('@browser')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <Globe className="h-4 w-4 text-emerald-400" />
                  <span>Browser</span>
                </div>
                <span className="text-[10px] text-slate-400">@browser</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectIntegration('@desktop')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 text-left transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <Monitor className="h-4 w-4 text-amber-400" />
                  <span>Desktop</span>
                </div>
                <span className="text-[10px] text-slate-400">@desktop</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
        />

        {/* Minimal Black & White Rounded Composer Bar */}
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-[#121318] pl-4 pr-2 py-2.5 shadow-2xl focus-within:border-white/40 transition">
          {/* Plus Action Button */}
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="More options & integrations"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="h-5 w-[1px] bg-white/10" />

          {/* Message Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-[14px] text-white placeholder-slate-400 outline-none"
          />

          {/* Mic Voice Button */}
          <button
            type="button"
            onClick={onToggleVoice}
            title="Toggle Voice Mode"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition cursor-pointer ${
              voiceState !== 'idle'
                ? 'bg-blue-600 text-white animate-pulse'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md hover:bg-slate-200 transition active:scale-95 cursor-pointer"
            title="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

      </footer>
    </div>
  );
};
