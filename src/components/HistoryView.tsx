import React, { useState, useEffect } from 'react';
import {
  Star,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  X,
  Copy,
  Check,
  Smartphone,
  Video,
  Instagram,
  Twitter,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Post } from '../types.ts';
import { getRecentPosts, sendToPhone, AppError } from '../api.ts';

interface HistoryViewProps {
  onOpenSettings: (message?: string) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSelectDropForMain?: (post: Post) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onOpenSettings,
  onToast,
  onSelectDropForMain,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [sendingToPhone, setSendingToPhone] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load starred ids from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('BF_STARRED');
      if (saved) {
        setStarredIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveStarred = (newIds: string[]) => {
    setStarredIds(newIds);
    try {
      localStorage.setItem('BF_STARRED', JSON.stringify(newIds));
    } catch (err) {
      console.error('Failed to save starred posts:', err);
    }
  };

  const toggleStar = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    const strId = String(id);
    const isStarred = starredIds.includes(strId);
    let next: string[];
    if (isStarred) {
      next = starredIds.filter((item) => item !== strId);
      onToast('removed from starred', 'info');
    } else {
      next = [...starredIds, strId];
      onToast('starred post saved', 'success');
    }
    saveStarred(next);
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentPosts();
      setPosts(data || []);
    } catch (err: any) {
      if (err instanceof AppError) {
        if (err.isAuthError) {
          setError(err.message);
          onOpenSettings(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'could not load drop archives');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    const strId = String(p.id);
    if (starredOnly && !starredIds.includes(strId)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const topicMatch = (p.topic || '').toLowerCase().includes(q);
      const pillarMatch = (p.pillar || '').toLowerCase().includes(q);
      const hookMatch = (p.tiktok?.hook || '').toLowerCase().includes(q);
      const xMatch = (p.x_post || '').toLowerCase().includes(q);
      if (!topicMatch && !pillarMatch && !hookMatch && !xMatch) {
        return false;
      }
    }
    return true;
  });

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onToast('copied to clipboard', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      onToast('could not copy', 'error');
    }
  };

  const handleSendToPhone = async (post: Post) => {
    setSendingToPhone(true);
    try {
      const res = await sendToPhone(post);
      onToast(res.message, 'success');
    } catch (err: any) {
      if (err instanceof AppError && err.message.includes('no webhook')) {
        onOpenSettings('add your webhook url in settings to send drops to phone.');
      } else {
        onToast(err.message || 'could not send to phone', 'error');
      }
    } finally {
      setSendingToPhone(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
            <span>studio archives</span>
            <span className="text-[#3a3429]">/</span>
            <span>historical drops</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f2eb]">
            history &amp; star vault
          </h1>
          <p className="text-xs sm:text-sm text-[#8f8778] leading-relaxed">
            browse previous generations stored by the agent. star high-performing drops for quick recall.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#f5f2eb] bg-[#1a1713] hover:bg-[#231f19] border border-[#2d2820] transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : 'text-[#8a8273]'}`} />
          <span>refresh archives</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14120f] border border-[#26211a] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#6e675b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search topics or pillars..."
            className="w-full bg-[#1b1814] border border-[#29231c] focus:border-amber-600 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs text-[#f5f2eb] placeholder-[#595347] font-mono transition-colors"
          />
        </div>

        {/* Starred filter button */}
        <button
          type="button"
          onClick={() => setStarredOnly(!starredOnly)}
          className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
            starredOnly
              ? 'bg-amber-500/15 border-amber-600/70 text-amber-300'
              : 'bg-[#181511] border-[#29231c] text-[#a8a090] hover:text-[#f5f2eb]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : 'text-[#8a8273]'}`} />
          <span>starred only ({starredIds.length})</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/25 border border-red-900/50 rounded-2xl text-xs text-red-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="block font-medium">{error}</span>
            {error.includes('token') && (
              <button
                type="button"
                onClick={() => onOpenSettings()}
                className="mt-1.5 text-[11px] text-amber-400 underline hover:text-amber-300 font-mono"
              >
                open settings to configure access token &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Archive List */}
      {loading && posts.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-[#14120f] border border-[#26211a] rounded-2xl">
          <div className="w-6 h-6 border-2 border-[#787163] border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8a8273] font-mono">retrieving past drops from agent api...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-[#14120f] border border-[#26211a] rounded-2xl text-[#8a8273]">
          <p className="text-sm font-medium text-[#c9c2b3]">no drops found</p>
          <p className="text-xs">
            {starredOnly
              ? 'no starred posts yet. tap the star on any drop to save it here.'
              : 'generate your first drop on the "today\'s drop" tab to start your archive.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredPosts.map((post) => {
            const isStarred = starredIds.includes(String(post.id));

            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-[#14120f] border border-[#26211a] hover:border-[#383126] rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="font-mono text-[#787163]">
                      {formatDate(post.created_at)}
                    </span>
                    <span className="text-[#3a3429]">·</span>
                    <span className="font-mono text-amber-400/90 text-[11px] truncate">
                      {post.pillar || 'drop'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#f5f2eb] group-hover:text-amber-300 transition-colors truncate">
                    {post.topic || post.tiktok?.hook || 'unnamed drop'}
                  </h3>

                  {post.tiktok?.hook && (
                    <p className="text-xs text-[#8a8273] italic truncate">
                      &ldquo;{post.tiktok.hook}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => toggleStar(e, post.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isStarred
                        ? 'border-amber-600/60 bg-amber-500/10 text-amber-400'
                        : 'border-[#26211a] bg-[#1a1713] text-[#787163] hover:text-[#f5f2eb]'
                    }`}
                    aria-label="star drop"
                  >
                    <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                  </button>

                  <div className="p-2 rounded-xl text-[#787163] group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal / Drawer */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl bg-[#14120f] border border-[#2b261f] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col text-[#f5f2eb] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#242019] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8a8273]">
                  <span>{formatDate(selectedPost.created_at)}</span>
                  <span>·</span>
                  <span className="text-amber-400">{selectedPost.pillar || 'archive'}</span>
                </div>
                <h3 className="text-base font-bold text-[#f5f2eb] truncate max-w-sm sm:max-w-md">
                  {selectedPost.topic || 'drop details'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => toggleStar(e, selectedPost.id)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    starredIds.includes(String(selectedPost.id))
                      ? 'border-amber-600/60 bg-amber-500/10 text-amber-400'
                      : 'border-[#26211a] text-[#787163] hover:text-[#f5f2eb]'
                  }`}
                  aria-label="star post"
                >
                  <Star
                    className={`w-4 h-4 ${starredIds.includes(String(selectedPost.id)) ? 'fill-amber-400' : ''}`}
                  />
                </button>
                <button
                  onClick={() => handleSendToPhone(selectedPost)}
                  disabled={sendingToPhone}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{sendingToPhone ? 'sending...' : 'send to phone'}</span>
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1f1b15] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* TikTok / Reel */}
              {selectedPost.tiktok && (
                <div className="bg-[#181511] border border-[#26211a] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#221d17] pb-2">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      tiktok / reel
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          'tiktok',
                          `HOOK: ${selectedPost.tiktok?.hook}\nSHOT: ${selectedPost.tiktok?.shot}\nCAPTION: ${selectedPost.tiktok?.caption}`
                        )
                      }
                      className="text-xs text-[#8a8273] hover:text-[#f5f2eb] flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      <span>copy</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-200">
                    Hook (first 3s): &ldquo;{selectedPost.tiktok.hook}&rdquo;
                  </div>
                  {selectedPost.tiktok.shot && (
                    <p className="text-xs text-[#c9c2b3]">
                      <strong className="text-[#8a8273] font-mono">shot: </strong>
                      {selectedPost.tiktok.shot}
                    </p>
                  )}
                  {selectedPost.tiktok.caption && (
                    <p className="text-xs text-[#ded8cb] whitespace-pre-wrap">
                      <strong className="text-[#8a8273] font-mono">caption: </strong>
                      {selectedPost.tiktok.caption}
                    </p>
                  )}
                </div>
              )}

              {/* Instagram */}
              {selectedPost.instagram && (
                <div className="bg-[#181511] border border-[#26211a] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#221d17] pb-2">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5" />
                      instagram carousel
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          'ig',
                          `${(selectedPost.instagram?.slides || []).join('\n---\n')}\n\n${selectedPost.instagram?.caption || ''}`
                        )
                      }
                      className="text-xs text-[#8a8273] hover:text-[#f5f2eb] flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      <span>copy</span>
                    </button>
                  </div>
                  {selectedPost.instagram.slides && selectedPost.instagram.slides.length > 0 && (
                    <div className="space-y-1.5">
                      {selectedPost.instagram.slides.map((s, idx) => (
                        <div key={idx} className="p-2 bg-[#1d1914] rounded-lg text-xs text-[#e2dcce] flex gap-2">
                          <span className="text-amber-400/90 font-mono font-semibold">[{idx + 1}]</span>
                          <span className="flex-1">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPost.instagram.caption && (
                    <p className="text-xs text-[#ded8cb] whitespace-pre-wrap">
                      <strong className="text-[#8a8273] font-mono">caption: </strong>
                      {selectedPost.instagram.caption}
                    </p>
                  )}
                  {selectedPost.instagram.tags && (
                    <p className="text-xs font-mono text-amber-400/80">
                      {selectedPost.instagram.tags.join(' ')}
                    </p>
                  )}
                </div>
              )}

              {/* X Post */}
              {selectedPost.x_post && (
                <div className="bg-[#181511] border border-[#26211a] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#221d17] pb-2">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5" />
                      x post ({selectedPost.x_post.length}/280)
                    </span>
                    <button
                      onClick={() => handleCopy('x', selectedPost.x_post || '')}
                      className="text-xs text-[#8a8273] hover:text-[#f5f2eb] flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      <span>copy</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#f5f2eb] whitespace-pre-wrap leading-relaxed">
                    {selectedPost.x_post}
                  </p>
                </div>
              )}

              {/* Fan prompt */}
              {selectedPost.fan_prompt && (
                <div className="bg-[#181511] border border-[#26211a] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#221d17] pb-2">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      pinned fan prompt
                    </span>
                    <button
                      onClick={() => handleCopy('fan', selectedPost.fan_prompt || '')}
                      className="text-xs text-[#8a8273] hover:text-[#f5f2eb] flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      <span>copy</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#f5f2eb] font-medium leading-relaxed">
                    &ldquo;{selectedPost.fan_prompt}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
