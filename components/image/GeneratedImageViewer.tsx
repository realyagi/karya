'use client';

import React, { useState } from 'react';
import { Download, Maximize2, X, Eye } from 'lucide-react';

interface GeneratedImageViewerProps {
  imageUrl: string;
  prompt: string;
  className?: string;
}

export const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({
  imageUrl,
  prompt,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `karya-gemini-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Inline Image Preview Card */}
      <div
        className={`group relative mt-3 overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-xl transition-all hover:border-indigo-500/50 ${className}`}
      >
        <div className="relative aspect-square max-h-[320px] w-full overflow-hidden bg-slate-950/60 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={prompt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Hover Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col justify-between p-3">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDownload}
                title="Download Image"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:text-indigo-400 cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Expand Fullscreen"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:text-indigo-400 cursor-pointer"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <p className="line-clamp-2 text-xs font-medium text-slate-200">
              {prompt}
            </p>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-400">
          <span className="truncate pr-2 font-mono text-[10px] text-indigo-300">
            Gemini Generated
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Eye className="h-3 w-3" />
            <span>View Full</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="relative flex flex-col max-w-4xl max-h-[90vh] w-full items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex w-full items-center justify-between pb-3 text-white">
              <span className="text-xs sm:text-sm font-medium text-slate-300 truncate max-w-[70%]">
                {prompt}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* High-res Image container */}
            <div className="overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black">
              <img
                src={imageUrl}
                alt={prompt}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
