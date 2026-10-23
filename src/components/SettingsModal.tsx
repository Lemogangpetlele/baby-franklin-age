import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, Bell, Check, ExternalLink } from 'lucide-react';
import { getToken, setToken, getWebhook, setWebhook } from '../api.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialMessage?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMessage,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [webhookInput, setWebhookInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTokenInput(getToken());
      setWebhookInput(getWebhook());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setToken(tokenInput);
    setWebhook(webhookInput);
    setSavedSuccess(true);
    if (onSave) onSave();
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const hasToken = tokenInput.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#14120f] border border-[#2b261f] rounded-2xl shadow-2xl overflow-hidden text-[#f5f2eb]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242019] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#f5f2eb]">
              studio settings
            </h2>
            <p className="text-xs text-[#8a8273] font-mono mt-0.5">
              local credentials · stored only in this browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8273] hover:text-[#f5f2eb] rounded-lg hover:bg-[#1f1b15] transition-colors"
            aria-label="close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {initialMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-600/30 rounded-lg text-xs text-amber-200">
              {initialMessage}
            </div>
          )}

          {/* Access Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#c9c2b3] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                access token <span className="text-amber-500/90">*</span>
              </label>
              <span className="text-[11px] font-mono text-[#6e675b]">
                localStorage: BF_TOKEN
              </span>
            </div>

            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="enter your bearer auth token"
                className="w-full bg-[#1b1814] border border-[#2d2820] focus:border-amber-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#f5f2eb] placeholder-[#595347] pr-10 transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#787163] hover:text-[#f5f2eb] transition-colors rounded"
                aria-label={showToken ? 'hide token' : 'show token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#787163] leading-relaxed">
              sent as <code className="text-[#a8a090]">Bearer &lt;token&gt;</code> to the agent API. required for all drop generations.
            </p>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#c9c2b3] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                send-to-phone webhook (optional)
              </label>
              <span className="text-[11px] font-mono text-[#6e675b]">
                BF_WEBHOOK
              </span>
            </div>

            <input
              type="url"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="https://discord.com/api/webhooks/... or zapier/make url"
              className="w-full bg-[#1b1814] border border-[#2d2820] focus:border-amber-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#f5f2eb] placeholder-[#595347] transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-[#787163] leading-relaxed">
              discord channel webhooks auto-format under 1900 characters. other webhooks receive the full drop json.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-[#242019] flex items-center justify-between gap-3">
            <div className="text-[11px] text-[#6e675b] font-mono truncate">
              {hasToken ? 'token loaded' : 'no token saved'}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#a8a090] hover:text-[#f5f2eb] bg-[#1a1713] hover:bg-[#221f19] border border-[#2d2820] rounded-xl transition-colors"
              >
                cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-[#0f0e0c] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm font-semibold"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    saved
                  </>
                ) : (
                  'save settings'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
