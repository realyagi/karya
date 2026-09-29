'use client';

import React, { useState } from 'react';
import { 
  Mic, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FileText, 
  Compass, 
  Settings, 
  Menu, 
  X,
  Sparkles,
  ListTodo,
  Brain,
} from 'lucide-react';
import { useKaryaAuth } from '@/lib/auth/user-context';
import { VoiceState } from '@/types/karya';

interface NavbarProps {
  activeTab?: string;
  voiceState?: VoiceState;
  onTabSelect?: (tab: string) => void;
  onSettingsOpen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'Voice',
  voiceState = 'ready',
  onTabSelect,
  onSettingsOpen,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Voice', icon: Mic, isWorking: true },
    { name: 'Tasks', icon: CheckSquare, isWorking: true },
    { name: 'Plans', icon: ListTodo, isWorking: true },
    { name: 'Calendar', icon: CalendarIcon, isWorking: true },
    { name: 'Notes', icon: FileText, isWorking: true },
    { name: 'Research', icon: Compass, isWorking: true },
    { name: 'Memory', icon: Brain, isWorking: true },
  ];

  // Derive real status display from active voiceState
  const getStatusDisplay = () => {
    switch (voiceState) {
      case 'listening':
        return {
          label: 'Listening',
          dotClass: 'bg-cyan-400 animate-ping',
          solidClass: 'bg-cyan-400',
          textClass: 'text-cyan-300',
          badgeClass: 'bg-cyan-500/10 border-cyan-500/25',
        };
      case 'processing':
        return {
          label: 'Thinking',
          dotClass: 'bg-purple-400 animate-pulse',
          solidClass: 'bg-purple-400',
          textClass: 'text-purple-300',
          badgeClass: 'bg-purple-500/10 border-purple-500/25',
        };
      case 'speaking':
        return {
          label: 'Speaking',
          dotClass: 'bg-indigo-400 animate-pulse',
          solidClass: 'bg-indigo-400',
          textClass: 'text-indigo-300',
          badgeClass: 'bg-indigo-500/10 border-indigo-500/25',
        };
      case 'error':
        return {
          label: 'Error',
          dotClass: 'bg-rose-500',
          solidClass: 'bg-rose-500',
          textClass: 'text-rose-300',
          badgeClass: 'bg-rose-500/10 border-rose-500/25',
        };
      case 'idle':
      case 'ready':
      default:
        return {
          label: 'Ready',
          dotClass: 'bg-emerald-400 opacity-75',
          solidClass: 'bg-emerald-500',
          textClass: 'text-emerald-300',
          badgeClass: 'bg-emerald-500/10 border-emerald-500/20',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-[#07090e]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================
            LEFT: KARYA BRANDING ([ KARYA LOGO ] KARYA)
            ======================================================== */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => onTabSelect?.('Voice')}
          title="KARYA Assistant"
        >
          {/* KARYA Logo Icon sitting immediately to the left of KARYA text */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-black/80 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)] transition group-hover:scale-105 overflow-hidden">
            <img
              src="/karya-logo.png"
              alt="KARYA Logo"
              className="h-full w-full object-contain p-0.5"
            />
            {/* Subtle animated status dot on top-right */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider text-white leading-none">
              KARYA
            </span>
            <span className="text-[10px] text-slate-400 tracking-tight mt-0.5 hidden sm:inline">
              Voice-First AI Agent
            </span>
          </div>
        </div>

        {/* ========================================================
            CENTER: NAVIGATION (Cleaner, tighter, subtle active pill)
            ======================================================== */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.02] p-1 border border-white/[0.04]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onTabSelect?.(item.name)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
                title={item.name}
              >
                <Icon className={`h-3 w-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* ========================================================
            RIGHT: REAL READY STATUS + CIRCULAR SETTINGS + PROFILE
            ======================================================== */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real Status indicator driven by AssemblyAI voice state */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border ${status.badgeClass} transition-colors`}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${status.dotClass}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.solidClass}`} />
            </span>
            <span className={`text-[11px] font-medium ${status.textClass}`}>
              {status.label}
            </span>
          </div>

          {/* Clean Circular Settings Button */}
          <button
            type="button"
            onClick={onSettingsOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          {/* Existing Clerk Profile */}
          <NavbarAuthControls />

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#07090e]/95 px-4 py-3 backdrop-blur-2xl">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    onTabSelect?.(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export function NavbarAuthControls() {
  const { isSignedIn, user, signIn, signUp, signOut } = useKaryaAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center gap-1.5 pl-1">
        <button
          type="button"
          onClick={signIn}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={signUp}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'KY';

  return (
    <div className="relative pl-1">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06] transition-colors hover:bg-white/[0.07] cursor-pointer"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-[10px] font-bold text-white shadow-xs">
          {initials}
        </div>
        <span className="text-xs font-medium text-slate-200 pr-1 hidden sm:inline">{user.name}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#0c0f17] p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/[0.08] px-3 py-2">
            <p className="text-xs font-semibold text-white">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              signOut();
              setMenuOpen(false);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
