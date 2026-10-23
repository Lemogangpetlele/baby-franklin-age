import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Copy,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  Music,
  ListTodo,
  Disc3,
  Bookmark,
} from 'lucide-react';
import { Rollout, RolloutDay } from '../types.ts';
import { generateRollout, AppError } from '../api.ts';

interface RolloutViewProps {
  onOpenSettings: (message?: string) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RolloutView: React.FC<RolloutViewProps> = ({
  onOpenSettings,
  onToast,
}) => {
  const [song, setSong] = useState('');
  const [vibe, setVibe] = useState('');
  const [lyric, setLyric] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRollout, setActiveRollout] = useState<Rollout | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);

  // Checked tasks map: { [taskId: string]: boolean }
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Load existing rollout on mount
  useEffect(() => {
    try {
      const savedRolloutStr = localStorage.getItem('BF_ACTIVE_ROLLOUT');
      if (savedRolloutStr) {
        const parsed = JSON.parse(savedRolloutStr) as Rollout;
        setActiveRollout(parsed);
        if (parsed.song) {
          loadProgress(parsed.song);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const loadProgress = (songTitle: string) => {
    try {
      const storageKey = `BF_ROLLOUT_${songTitle.toLowerCase().trim()}`;
      const savedProgress = localStorage.getItem(storageKey);
      if (savedProgress) {
        setCompletedTasks(JSON.parse(savedProgress));
      } else {
        setCompletedTasks({});
      }
    } catch {
      setCompletedTasks({});
    }
  };

  const saveProgress = (songTitle: string, progress: Record<string, boolean>) => {
    try {
      const storageKey = `BF_ROLLOUT_${songTitle.toLowerCase().trim()}`;
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (err) {
      console.error('Failed to save rollout progress:', err);
    }
  };

  const toggleTask = (dayNum: number, taskIdx: number) => {
    if (!activeRollout) return;
    const key = `d${dayNum}_t${taskIdx}`;
    const nextState = {
      ...completedTasks,
      [key]: !completedTasks[key],
    };
    setCompletedTasks(nextState);
    saveProgress(activeRollout.song, nextState);
  };

  const handleGenerateRollout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!song.trim()) {
      setError('please provide a song title');
      return;
    }
    if (!releaseDate) {
      setError('please select a release date');
      return;
    }

    setLoading(true);
    try {
      const rollout = await generateRollout({
        song: song.trim(),
        vibe: vibe.trim(),
        lyric: lyric.trim(),
        release_date: releaseDate,
      });

      setActiveRollout(rollout);
      loadProgress(rollout.song);
      localStorage.setItem('BF_ACTIVE_ROLLOUT', JSON.stringify(rollout));
      onToast(`14-day rollout ready for "${rollout.song}"`, 'success');
    } catch (err: any) {
      if (err instanceof AppError) {
        if (err.isAuthError) {
          setError(err.message);
          onOpenSettings(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'failed to build rollout campaign');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWholePlan = async () => {
    if (!activeRollout) return;

    const lines: string[] = [];
    lines.push(`14-DAY SONG ROLLOUT: ${activeRollout.song.toUpperCase()}`);
    lines.push('=' .repeat(40));
    lines.push('');

    activeRollout.days.forEach((d) => {
      lines.push(`DAY ${d.day}: ${d.label || 'Drop Step'} (${d.date || 'TBD'})`);
      if (d.content_idea) {
        lines.push(`Content Concept: ${d.content_idea}`);
      }
      if (d.tasks && d.tasks.length > 0) {
        lines.push('Action Items:');
        d.tasks.forEach((task, tIdx) => {
          const isDone = completedTasks[`d${d.day}_t${tIdx}`];
          lines.push(`  [${isDone ? 'X' : ' '}] ${task}`);
        });
      }
      lines.push('');
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedPlan(true);
      onToast('entire 14-day plan copied', 'success');
      setTimeout(() => setCopiedPlan(false), 2500);
    } catch {
      onToast('failed to copy plan', 'error');
    }
  };

  // Group days into 4 phases: teasers, pre-save, release day, after release
  const groupDaysByPhase = (days: RolloutDay[]) => {
    const phases = {
      teasers: {
        title: 'phase 1: teasers & sonic world building',
        subtitle: 'establishing atmosphere, vocal stems & early intrigue',
        days: [] as RolloutDay[],
      },
      presave: {
        title: 'phase 2: pre-save acceleration & community momentum',
        subtitle: 'dsp pre-saves, snippet trends & direct connection',
        days: [] as RolloutDay[],
      },
      releaseday: {
        title: 'phase 3: release day drop',
        subtitle: 'midnight launch, stream links, visualizer & full push',
        days: [] as RolloutDay[],
      },
      afterrelease: {
        title: 'phase 4: after release & extended life',
        subtitle: 'curator outreach, live acoustic takes & lyric resonance',
        days: [] as RolloutDay[],
      },
    };

    days.forEach((d) => {
      const labelLower = (d.label || '').toLowerCase();
      if (d.day <= 4 || labelLower.includes('teaser') || labelLower.includes('snippet')) {
        phases.teasers.days.push(d);
      } else if (
        (d.day >= 5 && d.day <= 11) ||
        labelLower.includes('pre-save') ||
        labelLower.includes('presave')
      ) {
        phases.presave.days.push(d);
      } else if (
        d.day === 12 ||
        labelLower.includes('release day') ||
        labelLower.includes('launch') ||
        labelLower.includes('out now')
      ) {
        phases.releaseday.days.push(d);
      } else {
        phases.afterrelease.days.push(d);
      }
    });

    return phases;
  };

  // Calculate overall completion stats
  let totalTasksCount = 0;
  let finishedTasksCount = 0;
  if (activeRollout) {
    activeRollout.days.forEach((d) => {
      (d.tasks || []).forEach((_, tIdx) => {
        totalTasksCount++;
        if (completedTasks[`d${d.day}_t${tIdx}`]) {
          finishedTasksCount++;
        }
      });
    });
  }

  const completionPercent =
    totalTasksCount > 0 ? Math.round((finishedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Introduction */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
          <span>campaign architecture</span>
          <span className="text-[#3a3429]">/</span>
          <span>14 days</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f2eb]">
          14-day song rollout
        </h1>
        <p className="text-xs sm:text-sm text-[#8f8778] leading-relaxed">
          strategic release roadmap structured across teasers, pre-save momentum, launch day, and post-release velocity.
        </p>
      </div>

      {/* Rollout Generation Form */}
      <form
        onSubmit={handleGenerateRollout}
        className="bg-[#14120f] border border-[#26211a] rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#c9c2b3]">
              song title <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              value={song}
              onChange={(e) => setSong(e.target.value)}
              placeholder="e.g. Arcadia, PretoriAutumn, 4AM Reverie"
              className="w-full bg-[#1b1814] border border-[#2b251d] focus:border-amber-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#f5f2eb] placeholder-[#595347] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#c9c2b3]">
              release date <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-[#1b1814] border border-[#2b251d] focus:border-amber-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#f5f2eb] placeholder-[#595347] font-mono transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#c9c2b3]">
              sound / vibe description
            </label>
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. dark melodic trap drums, warm rhodes, 808s, brooding r&b"
              className="w-full bg-[#1b1814] border border-[#2b251d] focus:border-amber-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#f5f2eb] placeholder-[#595347] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#c9c2b3]">
              key lyric / hook quote
            </label>
            <input
              type="text"
              value={lyric}
              onChange={(e) => setLyric(e.target.value)}
              placeholder="e.g. 'told myself i wouldn't call again at 3am...'"
              className="w-full bg-[#1b1814] border border-[#2b251d] focus:border-amber-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#f5f2eb] placeholder-[#595347] transition-colors"
            />
          </div>
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
                <span>crafting 14-day rollout strategy...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>generate rollout timeline</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Active Rollout View */}
      {activeRollout && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Summary & Actions */}
          <div className="bg-[#14120f] border border-[#26211a] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xl font-bold text-[#f5f2eb] tracking-tight">
                    {activeRollout.song}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8a8273] font-mono">
                  <span>14 days planned</span>
                  <span>·</span>
                  <span>
                    {finishedTasksCount} of {totalTasksCount} tasks done ({completionPercent}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleCopyWholePlan}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#f5f2eb] bg-[#1a1713] hover:bg-[#231f19] border border-[#2d2820] transition-colors flex items-center gap-1.5 font-mono"
                >
                  {copiedPlan ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">plan copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8a8273]" />
                      <span>copy whole plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#1b1814] h-1.5 rounded-full overflow-hidden border border-[#28231c]">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Grouped by Phase */}
          {(() => {
            const phases = groupDaysByPhase(activeRollout.days || []);
            return (
              <div className="space-y-8">
                {Object.entries(phases).map(([phaseKey, phase]) => {
                  if (phase.days.length === 0) return null;
                  return (
                    <div key={phaseKey} className="space-y-3">
                      {/* Phase Header */}
                      <div className="border-b border-[#221d17] pb-2.5">
                        <h3 className="text-sm font-semibold tracking-tight text-amber-400">
                          {phase.title}
                        </h3>
                        <p className="text-xs text-[#787163] font-mono">
                          {phase.subtitle}
                        </p>
                      </div>

                      {/* Days in this phase */}
                      <div className="grid grid-cols-1 gap-3.5">
                        {phase.days.map((day) => {
                          const isToday =
                            day.date && day.date.trim().toLowerCase() === todayStr.toLowerCase();

                          return (
                            <div
                              key={day.day}
                              className={`rounded-2xl border transition-all p-4 sm:p-5 ${
                                isToday
                                  ? 'bg-[#181510] border-amber-600/70 shadow-amber-950/20 shadow-lg ring-1 ring-amber-500/30'
                                  : 'bg-[#14120f] border-[#241f18] hover:border-[#332c22]'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-3 border-b border-[#201c16]">
                                <div className="flex items-center gap-2.5">
                                  <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-[#221d17] text-amber-400">
                                    day {day.day}
                                  </span>
                                  <h4 className="text-sm font-medium text-[#f5f2eb]">
                                    {day.label || `drop day ${day.day}`}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2 font-mono text-xs">
                                  {isToday && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500 text-[#0f0e0c] font-semibold text-[10px] uppercase tracking-wider">
                                      today
                                    </span>
                                  )}
                                  <span className="text-[#8a8273] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#6e675b]" />
                                    {day.date || `day ${day.day}`}
                                  </span>
                                </div>
                              </div>

                              {/* Content Idea */}
                              {day.content_idea && (
                                <div className="mt-3 text-xs bg-[#191612] border border-[#262019] rounded-xl p-3 space-y-1">
                                  <span className="text-[10px] font-mono text-[#787163] uppercase tracking-wider block">
                                    content concept
                                  </span>
                                  <p className="text-[#ded8cb] leading-relaxed">
                                    {day.content_idea}
                                  </p>
                                </div>
                              )}

                              {/* Checkable Tasks */}
                              {day.tasks && day.tasks.length > 0 && (
                                <div className="mt-3.5 space-y-2">
                                  <span className="text-[10px] font-mono text-[#787163] uppercase tracking-wider block">
                                    tasks checklist
                                  </span>
                                  <div className="space-y-1.5">
                                    {day.tasks.map((task, tIdx) => {
                                      const taskKey = `d${day.day}_t${tIdx}`;
                                      const isDone = !!completedTasks[taskKey];

                                      return (
                                        <button
                                          key={tIdx}
                                          type="button"
                                          onClick={() => toggleTask(day.day, tIdx)}
                                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-colors border ${
                                            isDone
                                              ? 'bg-[#151310] border-[#221e18] text-[#787163] line-through'
                                              : 'bg-[#1a1713] border-[#2a241c] text-[#e4ded2] hover:border-[#383126]'
                                          }`}
                                        >
                                          {isDone ? (
                                            <CheckSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                          ) : (
                                            <Square className="w-4 h-4 text-[#6e675b] shrink-0 mt-0.5" />
                                          )}
                                          <span className="leading-relaxed flex-1">{task}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
