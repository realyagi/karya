'use client';

import React from 'react';

interface KaryaSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function KaryaSwitch({ checked, onChange, label, disabled = false }: KaryaSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-cyan-400/50 bg-cyan-400/30' : 'border-white/10 bg-white/[0.06]'}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-transform ${checked ? 'translate-x-5 bg-cyan-300' : 'translate-x-0 bg-slate-500'}`} />
    </button>
  );
}