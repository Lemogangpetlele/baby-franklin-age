import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Video,
  Instagram,
  Twitter,
  MessageSquare,
  AlertCircle,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import { Post } from '../types.ts';
import { generateDrop, sendToPhone, AppError } from '../api.ts';

interface TodaysDropProps {
  onOpenSettings: (message?: string) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onPostGenerated?: (post: Post) => void;
}

const PILLARS = [
  'Auto',
  'Studio Process & Layering',
  'Perspective & Peace',
  'Visual Mood & Unreleased Snippet',
  'Catalogue Storyteller',
] as const;

export const TodaysDrop: React.FC<TodaysDropProps> = ({
  onOpenSettings,
  onToast,
  onPostGenerated,
}) => {
  const [idea, setIdea] = useState('');
  const [pillar, setPillar] = useState<string>('Auto');
  const [loading, setLoading] = useState(false);
  const [sendingToPhone, setSendingToPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropResult, setDropResult] = useState<Post | null>(null);

  // Copy feedback tracking for individual cards
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onToast('copied to clipboard', 'success');
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      onToast('could not copy to clipboard', 'error');
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const post = await generateDrop({
        pillar,
        idea,
      });
      setDropResult(post);
      onToast('today\'s drop generated', 'success');
      if (onPostGenerated) {
        onPostGenerated(post);
      }
    } catch (err: any) {
      if (err instanceof AppError) {
        if (err.isAuthError) {
          setError(err.message);
          onOpenSettings(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'failed to generate drop. try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendToPhone = async () => {
    if (!dropResult) return;
    setSendingToPhone(true);
    try {
      const res = await sendToPhone(dropResult);
      onToast(res.message, 'success');
    } catch (err: any) {
      if (err instanceof AppError && err.message.includes('no webhook')) {
        onOpenSettings('add your webhook url to send drops directly to your phone.');
      } else {
        onToast(err.message || 'could not send to phone', 'error');
      }
    } finally {
      setSendingToPhone(false);
    }
  };

  // Content formatters for copy actions
  const getTikTokCopyText = (p: Post) => {
    return [
      `HOOK (FIRST 3s): ${p.tiktok?.hook || ''}`,
      `SHOT: ${p.tiktok?.shot || ''}`,
      `AUDIO: ${p.tiktok?.audio || ''}`,
      `CAPTION: ${p.tiktok?.caption || ''}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  const getInstagramCopyText = (p: Post) => {
    const slidesText = (p.instagram?.slides || [])
      .map((s, idx) => `Slide ${idx + 1}: ${s}`)
      .join('\n');
    return [
      slidesText,
      p.instagram?.caption ? `\nCaption:\n${p.instagram.caption}` : '',
      p.instagram?.tags && p.instagram.tags.length > 0
        ? `\nTags: ${p.instagram.tags.join(' ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const getXCopyText = (p: Post) => p.x_post || '';
  const getFanPromptCopyText = (p: Post) => p.fan_prompt || '';

  const xLength = dropResult?.x_post ? dropResult.x_post.length : 0;
  const xOverLimit = xLength > 280;

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* Introduction / context */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
          <span>daily broadcast</span>
          <span className="text-[#3a3429]">/</span>
          <span>pretoria sound</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f2eb]">
          today&apos;s drop
        </h1>
        <p className="text-xs sm:text-sm text-[#8f8778] leading-relaxed">
          generate high-fidelity alternative r&amp;b multi-platform content aligned with your sound and story.
        </p>
      </div>

      {/* Generator Input Section */}
      <form
        onSubmit={handleGenerate}
        className="bg-[#14120f] border border-[#26211a] rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#c9c2b3] flex items-center justify-between">
            <span>a thought, lyric or mood (optional)</span>
            <span className="text-[11px] font-mono text-[#6e675b]">raw inspiration</span>
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. late night vocal stack in pretoria east, unreleased bassline, thoughts on staying grounded..."
            rows={3}
            className="w-full bg-[#1b1814] border border-[#2b251d] focus:border-amber-600 focus:outline-none rounded-xl p-3.5 text-sm text-[#f5f2eb] placeholder-[#595347] transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Pillar Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#c9c2b3]">creative pillar</span>
            <span className="text-[11px] font-mono text-amber-500/80">
              {pillar === 'Auto' ? 'auto-balanced' : 'focused angle'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PILLARS.map((p) => {
              const active = pillar === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPillar(p)}
                  className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500/10 border-amber-600/70 text-amber-300 shadow-sm'
                      : 'bg-[#181511] border-[#26211a] text-[#a8a090] hover:border-[#383126] hover:text-[#f5f2eb]'
                  }`}
                >
                  <span className="block truncate">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="p-3.5 bg-red-950/25 border border-red-900/50 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="block font-medium">{error}</span>
              {error.includes('token') && (
                <button
                  type="button"
                  onClick={() => onOpenSettings()}
                  className="mt-1.5 text-[11px] text-amber-400 underline hover:text-amber-300 font-mono"
                >
                  configure token in settings &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
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
                <span>generating drop from agent...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>generate today&apos;s drop</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Output 4 Cards Result */}
      {dropResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Result Bar with Pillar & Send to Phone */}
          <div className="bg-[#14120f] border border-[#26211a] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[#787163]">drop topic:</span>
              <span className="text-[#f5f2eb] font-medium truncate max-w-xs sm:max-w-md">
                {dropResult.topic || 'alternative r&b dispatch'}
              </span>
              {dropResult.pillar && (
                <>
                  <span className="text-[#3a3429]">·</span>
                  <span className="text-amber-400/90 font-mono text-[11px]">
                    {dropResult.pillar}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleSendToPhone}
              disabled={sendingToPhone}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              {sendingToPhone ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  <span>sending...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>send to phone</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. TikTok / Reel Card */}
            <div className="bg-[#14120f] border border-[#26211a] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#221d17] pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-[#f5f2eb]">
                      tiktok / reel
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopy('tiktok', getTikTokCopyText(dropResult))}
                    className="p-1.5 text-xs text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1d1914] transition-colors flex items-center gap-1 font-mono"
                    title="copy tiktok breakdown"
                  >
                    {copiedKey === 'tiktok' ? (
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

                {/* On-screen hook (HIGHLIGHTED first 3 seconds) */}
                <div className="p-3.5 bg-gradient-to-r from-amber-500/15 to-amber-600/5 border border-amber-500/40 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                    <span>on-screen hook</span>
                    <span>first 3 seconds</span>
                  </div>
                  <p className="text-sm font-medium text-[#fffbf2] leading-snug">
                    &ldquo;{dropResult.tiktok?.hook || 'no hook provided'}&rdquo;
                  </p>
                </div>

                {/* Shot & Visual */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#787163] uppercase tracking-wider">
                    visual shot
                  </span>
                  <p className="text-xs text-[#c9c2b3] leading-relaxed">
                    {dropResult.tiktok?.shot || 'candid performance or studio playback angle'}
                  </p>
                </div>

                {/* Audio */}
                {dropResult.tiktok?.audio && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#787163] uppercase tracking-wider">
                      audio
                    </span>
                    <p className="text-xs text-[#a8a090] font-mono bg-[#1a1713] px-2.5 py-1.5 rounded-lg border border-[#29231c]">
                      {dropResult.tiktok.audio}
                    </p>
                  </div>
                )}

                {/* Caption */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#787163] uppercase tracking-wider">
                    caption
                  </span>
                  <p className="text-xs text-[#ded8cb] whitespace-pre-wrap leading-relaxed">
                    {dropResult.tiktok?.caption || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Instagram Card */}
            <div className="bg-[#14120f] border border-[#26211a] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#221d17] pb-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-[#f5f2eb]">
                      instagram carousel &amp; post
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopy('ig', getInstagramCopyText(dropResult))}
                    className="p-1.5 text-xs text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1d1914] transition-colors flex items-center gap-1 font-mono"
                    title="copy instagram details"
                  >
                    {copiedKey === 'ig' ? (
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

                {/* Numbered Slides */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#787163] uppercase tracking-wider">
                      numbered slides
                    </span>
                    <span className="text-[11px] font-mono text-[#787163]">
                      {(dropResult.instagram?.slides || []).length} slides
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(dropResult.instagram?.slides || []).map((slide, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#191612] border border-[#29231c] rounded-xl flex items-start gap-2.5 text-xs"
                      >
                        <span className="px-2 py-0.5 bg-[#252019] text-amber-400/90 font-mono text-[10px] rounded font-semibold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-[#e2dcce] leading-relaxed flex-1">
                          {slide}
                        </p>
                      </div>
                    ))}
                    {(!dropResult.instagram?.slides || dropResult.instagram.slides.length === 0) && (
                      <p className="text-xs text-[#787163] italic">no slides returned</p>
                    )}
                  </div>
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#787163] uppercase tracking-wider">
                    caption
                  </span>
                  <p className="text-xs text-[#ded8cb] whitespace-pre-wrap leading-relaxed">
                    {dropResult.instagram?.caption || ''}
                  </p>
                </div>

                {/* Tags */}
                {dropResult.instagram?.tags && dropResult.instagram.tags.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-mono text-[#787163] uppercase tracking-wider">
                      tags
                    </span>
                    <p className="text-xs text-amber-400/80 font-mono break-words leading-relaxed">
                      {dropResult.instagram.tags.join(' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. X Post Card */}
            <div className="bg-[#14120f] border border-[#26211a] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#221d17] pb-3">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-[#f5f2eb]">
                      x post
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Live Character counter */}
                    <div
                      className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        xOverLimit
                          ? 'border-red-800 bg-red-950/40 text-red-400'
                          : xLength > 250
                          ? 'border-amber-700/50 bg-amber-950/30 text-amber-300'
                          : 'border-[#2d2820] bg-[#1a1713] text-[#8a8273]'
                      }`}
                    >
                      {xLength}/280
                    </div>

                    <button
                      onClick={() => handleCopy('x', getXCopyText(dropResult))}
                      className="p-1.5 text-xs text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1d1914] transition-colors flex items-center gap-1 font-mono"
                      title="copy x post"
                    >
                      {copiedKey === 'x' ? (
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
                </div>

                <div className="p-4 bg-[#191612] border border-[#28231c] rounded-xl">
                  <p className="text-sm text-[#f5f2eb] whitespace-pre-wrap leading-relaxed">
                    {dropResult.x_post || 'no x post generated'}
                  </p>
                </div>

                {xOverLimit && (
                  <p className="text-[11px] text-red-400 font-mono">
                    post is {xLength - 280} characters over the standard 280 limit.
                  </p>
                )}
              </div>
            </div>

            {/* 4. Fan Prompt Card */}
            <div className="bg-[#14120f] border border-[#26211a] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#221d17] pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-[#f5f2eb]">
                      fan prompt (pin in comments)
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopy('fan', getFanPromptCopyText(dropResult))}
                    className="p-1.5 text-xs text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1d1914] transition-colors flex items-center gap-1 font-mono"
                    title="copy fan prompt"
                  >
                    {copiedKey === 'fan' ? (
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

                <div className="p-4 bg-[#191612] border border-[#28231c] rounded-xl space-y-2">
                  <span className="text-[11px] font-mono text-amber-500/80 uppercase tracking-wider">
                    pinned conversation starter
                  </span>
                  <p className="text-sm font-medium text-[#f5f2eb] leading-relaxed">
                    &ldquo;{dropResult.fan_prompt || 'which track feels most like 2am pretoria?'}&rdquo;
                  </p>
                </div>

                <p className="text-[11px] text-[#787163] leading-relaxed">
                  pin this immediately upon publishing to anchor comments, boost engagement metrics, and hear directly from genuine listeners.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
