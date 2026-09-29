'use client';

import React from 'react';
import { CheckSquare, Calendar, FileText, Search } from 'lucide-react';
import { QuickActionItem } from '@/types/karya';

interface QuickActionsProps {
  onSelectAction?: (action: QuickActionItem) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  const actions: QuickActionItem[] = [
    {
      id: 'tasks',
      label: 'Check my tasks',
      category: 'tasks',
      promptSuggestion: 'Check my tasks for today and what needs attention',
    },
    {
      id: 'plan',
      label: 'Plan my day',
      category: 'calendar',
      promptSuggestion: 'Plan my schedule and priorities for today',
    },
    {
      id: 'note',
      label: 'Create a note',
      category: 'notes',
      promptSuggestion: 'Create a note with my latest thoughts',
    },
    {
      id: 'research',
      label: 'Research something',
      category: 'research',
      promptSuggestion: 'Research recent breakthroughs in agentic AI',
    },
  ];

  const getActionIcon = (category: QuickActionItem['category']) => {
    switch (category) {
      case 'tasks':
        return <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />;
      case 'calendar':
        return <Calendar className="h-3.5 w-3.5 text-purple-400" />;
      case 'notes':
        return <FileText className="h-3.5 w-3.5 text-cyan-400" />;
      case 'research':
        return <Search className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <p className="text-center text-[11px] font-medium tracking-wider uppercase text-slate-400 mb-3">
        Suggested Queries
      </p>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelectAction?.(action)}
            className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 border border-white/[0.07] hover:bg-white/[0.08] hover:text-white hover:border-indigo-500/30 transition-all duration-200 shadow-sm"
          >
            {getActionIcon(action.category)}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
