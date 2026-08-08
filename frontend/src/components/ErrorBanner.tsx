'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, KeyRound, WifiOff, Timer, Database, X } from 'lucide-react';
import { ApiErrorShape } from '@/lib/types';

interface ErrorBannerProps {
  error: ApiErrorShape;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  network_unreachable: WifiOff,
  llm_not_configured: KeyRound,
  llm_auth_failed: KeyRound,
  llm_rate_limited: Timer,
  retrieval_unavailable: Database,
};

const TITLES: Record<string, string> = {
  network_unreachable: 'Backend offline',
  session_not_found: 'Session expired',
  invalid_request: 'Invalid request',
  llm_not_configured: 'Gemini key missing',
  llm_auth_failed: 'Gemini key rejected',
  llm_rate_limited: 'Rate limited',
  llm_unavailable: 'Model unavailable',
  llm_bad_response: 'Unusable model response',
  retrieval_unavailable: 'Vector store unavailable',
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
}) => {
  const Icon = ICONS[error.code] || AlertTriangle;
  const title = TITLES[error.code] || 'Something went wrong';

  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-500/40 bg-rose-950/30 backdrop-blur-xl p-4 flex items-start gap-3 animate-fadeIn"
    >
      <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-200">
            {title}
          </h4>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-rose-300/70 border border-rose-500/25">
            {error.code}
            {error.status ? ` · ${error.status}` : ''}
          </span>
        </div>

        <p className="text-sm text-rose-100/90 leading-relaxed">{error.message}</p>

        {error.hint && (
          <p className="text-xs text-rose-200/60 leading-relaxed font-mono break-words">
            {error.hint}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs font-mono font-medium text-rose-100 hover:bg-rose-500/25 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying' : 'Retry'}</span>
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1.5 rounded-lg text-rose-300/60 hover:text-rose-200 hover:bg-rose-500/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
