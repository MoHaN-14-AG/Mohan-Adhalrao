import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, Clock, CheckCircle2, RotateCcw, Copy } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  isBreached?: boolean;
  isDuplicate?: boolean;
  reopenCount?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isBreached = false,
  isDuplicate = false,
  reopenCount = 0,
}) => {
  const { t } = useLanguage();

  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'submitted':
        return {
          label: t('status_submitted'),
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'routed':
        return {
          label: t('status_routed'),
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'in_progress':
        return {
          label: t('status_in_progress'),
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500 animate-pulse',
        };
      case 'resolved':
        return {
          label: t('status_resolved'),
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
          dot: 'bg-emerald-500',
        };
      case 'citizen_confirmed':
        return {
          label: t('status_citizen_confirmed'),
          bg: 'bg-teal-50 text-teal-800 border-teal-300 font-medium',
          dot: 'bg-teal-600',
        };
      case 'draft':
        return {
          label: t('status_draft'),
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
      case 'processing':
        return {
          label: t('status_processing'),
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'completed':
        return {
          label: t('status_completed'),
          bg: 'bg-green-50 text-green-800 border-green-200',
          dot: 'bg-green-600',
        };
      case 'abandoned':
        return {
          label: t('status_abandoned'),
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: st,
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>

      {isBreached && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-600 text-white animate-pulse shadow-xs">
          <AlertCircle className="w-3 h-3" />
          {t('sla_breached')}
        </span>
      )}

      {isDuplicate && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
          <Copy className="w-3 h-3" />
          {t('duplicate_badge')}
        </span>
      )}

      {reopenCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          <RotateCcw className="w-3 h-3" />
          {t('reopened_badge')} ({reopenCount})
        </span>
      )}
    </div>
  );
};
