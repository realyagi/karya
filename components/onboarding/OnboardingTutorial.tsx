'use client';

import React, { useEffect, useState } from 'react';

const TUTORIAL_STORAGE_KEY = 'karya.tutorial.completed';

const STEPS = [
  {
    title: 'This is your KARYA Voice Orb',
    description: 'Click it and start speaking naturally. KARYA listens and responds to your voice commands in real time.',
    highlight: 'orb',
  },
  {
    title: 'Just tell KARYA what you need',
    description: 'Try saying "What\'s on my calendar today?" or "Create a task to study chemistry".',
    highlight: 'transcript',
  },
  {
    title: 'Use Settings to connect your services',
    description: 'Connect Google Calendar, GitHub, and manage your account and appearance preferences.',
    highlight: 'settings',
  },
  {
    title: 'Connect your browser and desktop',
    description: 'Turn on companion access to let KARYA inspect tabs, search page text, open apps, and get system hardware info.',
    highlight: 'companions',
  },
  {
    title: 'Integrations and Tools',
    description: 'You are all set! Speak anytime to execute real actions across your browser, desktop, and productivity tools.',
    highlight: 'done',
  },
];

export const OnboardingTutorial: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  }, []);

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f17] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400 border border-indigo-500/30">
              {currentStep + 1}
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Welcome to KARYA - Step {currentStep + 1} of {STEPS.length}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Skip tutorial
          </button>
        </div>

        <div className="my-6">
          <h2 className="text-lg font-bold text-white">{step.title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{step.description}</p>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div className="flex gap-1">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(TUTORIAL_STORAGE_KEY);
}
