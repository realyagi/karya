import React from 'react';
import { KaryaPlan, PlanItemStatus } from '@/types/plan';
import { CheckSquare, CheckCircle2, Circle, Clock, SkipForward } from 'lucide-react';

interface PlansManagerProps {
  plans: KaryaPlan[];
  onUpdatePlanItemStatus?: (planId: string, itemId: string, status: PlanItemStatus) => void;
}

export const PlansManager: React.FC<PlansManagerProps> = ({ plans, onUpdatePlanItemStatus }) => {
  const getStatusIcon = (status: PlanItemStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-slate-400" />;
      case 'not_started':
      default:
        return <Circle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: PlanItemStatus) => {
    switch (status) {
      case 'done':
        return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/20">Done</span>;
      case 'in_progress':
        return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">In Progress</span>;
      case 'skipped':
        return <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/20">Skipped</span>;
      case 'not_started':
      default:
        return <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-white/10">Not Started</span>;
    }
  };

  const nextStatus = (current: PlanItemStatus): PlanItemStatus => {
    switch (current) {
      case 'not_started': return 'in_progress';
      case 'in_progress': return 'done';
      case 'done': return 'skipped';
      case 'skipped': return 'not_started';
      default: return 'done';
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Daily Plans</h2>
            <p className="text-xs text-slate-400">Your structured daily goals, exam preparation, and milestones</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-400">
            <p className="text-slate-300 font-medium">No plans created yet.</p>
            <p className="mt-1 text-xs text-slate-500">Say &ldquo;Create a plan for today&rdquo; or &ldquo;Plan my day&rdquo; to begin.</p>
          </div>
        ) : (
          plans.map((p) => {
            const items = p.items && p.items.length > 0
              ? p.items
              : (p.objectives || []).map((obj, i) => ({ id: `obj-${i}`, title: obj, status: (p.isCompleted ? 'done' : 'not_started') as PlanItemStatus }));
            const completedCount = items.filter(it => it.status === 'done').length;

            return (
              <div key={p.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{p.title}</h3>
                  <span className="text-xs text-slate-400">
                    {completedCount} / {items.length} completed
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onUpdatePlanItemStatus?.(p.id, item.id, nextStatus(item.status))}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.01] p-3 text-xs text-slate-300 hover:bg-white/[0.04] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <span className={item.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}>
                          {item.title}
                        </span>
                      </div>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};