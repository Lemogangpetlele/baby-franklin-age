import React, { useState } from 'react';
import {
  Wand2,
  Copy,
  Check,
  AlertCircle,
  Quote,
  Flame,
  Car,
  Compass,
  MessageCircle,
} from 'lucide-react';
import { Remix, RemixHook } from '../types.ts';
import { remixLyric, AppError } from '../api.ts';

interface RemixViewProps {
  onOpenSettings: (message?: string) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RemixView: React.FC<RemixViewProps> = ({
  onOpenSettings,
  onToast,
}) => {
  const [lyric, setLyric] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remixResult, setRemixResult] = useState<Remix | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleRemix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyric.trim()) {
      setError('paste a verse, chorus, or raw bar to remix');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await remixLyric({ lyric: lyric.trim() });
      setRemixResult(res);
      onToast('5 hook angles generated', 'success');
    } catch (err: any) {
      if (err instanceof AppError) {
        if (err.isAuthError) {
          setError(err.message);
          onOpenSettings(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'failed to remix lyric');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHook = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      onToast('hook copied to clipboard', 'success');
      setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 2000);
    } catch {
      onToast('could not copy hook', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      {/* Introduction */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
          <span>hook engineering</span>
          <span className="text-[#3a3429]">/</span>
          <span>5 angles</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f2eb]">
          lyric &amp; hook remixer
        </h1>
        <p className="text-xs sm:text-sm text-[#8f8778] leading-relaxed">
          re-angle any verse, bar or chorus into five distinct viral hooks (pov, late-night drive, unsaid confessions, and narrative triggers).
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleRemix}
        className="bg-[#14120f] border border-[#26211a] rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#c9c2b3] flex items-center justify-between">
            <span>verse, chorus or raw lyric</span>
            <span className="text-[11px] font-mono text-[#6e675b]">input text</span>
          </label>
          <textarea
            required
            value={lyric}
            onChange={(e) => setLyric(e.target.value)}
            placeholder="paste your lyrics here... e.g. 'told you i'm moving forward, but my city keeps raining on your side of town...'"
            rows={4}
            className="w-full bg-[#1b1814] border border-[#2b251d] focus:border-amber-600 focus:outline-none rounded-xl p-3.5 text-sm text-[#f5f2eb] placeholder-[#595347] transition-colors resize-none leading-relaxed font-mono"
          />
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/25 border border-red-900/50 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
              loading
                ? 'bg-[#2b251d] text-[#787163] cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[#0f0e0c]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#787163] border-t-amber-400 rounded-full animate-spin" />
                <span>remixing lyrics into 5 angles...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>remix lyrics</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 5 Hooks Output */}
      {remixResult && remixResult.hooks && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-[#f5f2eb] tracking-tight">
              remixed hook perspectives
            </h2>
            <span className="text-xs font-mono text-amber-500/80">
              {remixResult.hooks.length} variations
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {remixResult.hooks.map((hook: RemixHook, index: number) => {
              const isCopied = copiedIndex === index;

              return (
                <div
                  key={index}
                  className="bg-[#14120f] border border-[#26211a] hover:border-[#383126] rounded-2xl p-4 sm:p-5 transition-all shadow-md space-y-3 group"
                >
                  <div className="flex items-center justify-between border-b border-[#201c16] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#201b15] text-amber-400 font-semibold uppercase tracking-wider">
                        {hook.type || `angle ${index + 1}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyHook(index, hook.text)}
                      className="p-1.5 text-xs text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1d1914] transition-colors flex items-center gap-1 font-mono"
                      title="copy hook"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400 text-[11px]">copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-[#f5f2eb] font-medium leading-relaxed">
                    &ldquo;{hook.text}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
