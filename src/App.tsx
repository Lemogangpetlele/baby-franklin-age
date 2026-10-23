import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Wand2,
  History,
  Settings,
  Disc,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TabId, Post } from './types.ts';
import { getToken } from './api.ts';
import { TodaysDrop } from './components/TodaysDrop.tsx';
import { RolloutView } from './components/RolloutView.tsx';
import { RemixView } from './components/RemixView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { Toast, ToastProps } from './components/Toast.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('drop');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Check if token exists on first open
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setSettingsMessage('welcome to promo studio. please enter your agent access token to begin.');
      setSettingsOpen(true);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleOpenSettings = (message?: string) => {
    setSettingsMessage(message);
    setSettingsOpen(true);
  };

  const hasTokenSaved = !!getToken();

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'drop', label: "today's drop", icon: Sparkles },
    { id: 'rollout', label: '14-day rollout', icon: Calendar },
    { id: 'remix', label: 'lyric remixer', icon: Wand2 },
    { id: 'history', label: 'archives & stars', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#f5f2eb] analog-grain flex flex-col selection:bg-amber-500/25 selection:text-amber-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0f0e0c]/90 backdrop-blur-md border-b border-[#221e17] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Artist info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a1713] border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Disc className="w-5 h-5 animate-spin-slow text-amber-500" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#f5f2eb]">
                  baby franklin
                </span>
                <span className="text-[#3d372c]">/</span>
                <span className="text-xs font-mono text-amber-400">promo studio</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#787163] font-mono">
                <span>lemogang petlele</span>
                <span>·</span>
                <span>pretoria, za</span>
                <span>·</span>
                <span>alt r&amp;b</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#14120f] border border-[#241f18] p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#221d17] text-amber-300 shadow-sm border border-[#332c22]'
                      : 'text-[#8a8273] hover:text-[#f5f2eb] hover:bg-[#191612]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-[#787163]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Settings Trigger Button */}
          <div className="flex items-center gap-2">
            {!hasTokenSaved && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                token needed
              </span>
            )}

            <button
              onClick={() => handleOpenSettings()}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#161411] hover:bg-[#201c16] border border-[#29231c] hover:border-[#383126] text-[#c9c2b3] hover:text-[#f5f2eb] transition-colors flex items-center gap-1.5 text-xs font-mono"
              aria-label="open settings"
            >
              <Settings className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6 pb-24 md:pb-12">
        {activeTab === 'drop' && (
          <TodaysDrop
            onOpenSettings={handleOpenSettings}
            onToast={showToast}
          />
        )}

        {activeTab === 'rollout' && (
          <RolloutView
            onOpenSettings={handleOpenSettings}
            onToast={showToast}
          />
        )}

        {activeTab === 'remix' && (
          <RemixView
            onOpenSettings={handleOpenSettings}
            onToast={showToast}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onOpenSettings={handleOpenSettings}
            onToast={showToast}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f0e0c]/95 backdrop-blur-md border-t border-[#221e17] px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 font-medium'
                    : 'text-[#787163] hover:text-[#f5f2eb]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-[#787163]'}`} />
                <span className="text-[10px] tracking-tight truncate max-w-full font-mono lowercase">
                  {tab.id === 'drop'
                    ? 'drop'
                    : tab.id === 'rollout'
                    ? 'rollout'
                    : tab.id === 'remix'
                    ? 'remix'
                    : 'history'}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialMessage={settingsMessage}
        onSave={() => showToast('settings saved to browser storage', 'success')}
      />

      {/* Global Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
