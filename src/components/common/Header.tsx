import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  RotateCcw,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DashboardSummary } from '../../types';

interface HeaderProps {
  summary: DashboardSummary | null;
  onTriggerDemo: () => Promise<void>;
  onResetData: () => Promise<void>;
  isTriggering: boolean;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  onTriggerDemo,
  onResetData,
  isTriggering,
  onSelectTab,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalAlert = summary?.recent_alerts.find(
    (a) => a.severity === 'CRITICAL' && a.status === 'NEW'
  );

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white text-base font-sans">
              SafeForge <span className="text-cyan-400 font-mono font-medium">AI</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono uppercase px-1.5 py-0.5 border border-slate-700 bg-slate-900 text-slate-400 rounded-sm">
              INDUX 5.0 Edition
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Predict Risk. Prevent Incidents. Industrial Safety Intelligence
          </p>
        </div>
      </div>

      {/* Critical Ticker or Status */}
      {criticalAlert ? (
        <div
          onClick={() => onSelectTab('alerts')}
          className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 border border-red-500/40 bg-red-950/30 text-red-300 text-xs font-mono cursor-pointer hover:bg-red-950/50 transition-colors rounded-sm"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-semibold uppercase tracking-wider text-red-400">CRITICAL PRIORITY:</span>
          <span className="truncate max-w-md">{criticalAlert.title}</span>
          <span className="text-[10px] text-red-400/80 border border-red-500/30 px-1 py-0.2">
            REVIEW &rarr;
          </span>
        </div>
      ) : (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 text-xs text-slate-400 font-mono border border-slate-800 bg-slate-900/60 rounded-sm">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>FACILITY TELEMETRY: ALL PERIMETERS NOMINAL</span>
        </div>
      )}

      {/* Actions & Operational Clock */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Demonstration Mode Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-cyan-300 border border-cyan-800/50 bg-cyan-950/30 rounded-sm">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>DEMO FIXTURE</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:block text-right font-mono text-xs text-slate-300 px-2 py-1 bg-slate-900 border border-slate-800 rounded-sm">
          <span className="text-slate-500 mr-1.5 text-[10px]">TIME</span>
          <span>{timeStr}</span>
        </div>

        {/* Trigger Demo Scenario Button */}
        <button
          onClick={onTriggerDemo}
          disabled={isTriggering}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium text-xs rounded transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          title="Simulate the end-to-end hackathon demo scenario: worker breaches welding restricted zone without helmet"
        >
          {isTriggering ? (
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span className="hidden sm:inline">Trigger Demo Scenario</span>
          <span className="sm:hidden">Demo</span>
        </button>

        {/* Reset State Button */}
        <button
          onClick={onResetData}
          className="p-1.5 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded cursor-pointer transition-colors"
          title="Reset database to initial pristine state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
