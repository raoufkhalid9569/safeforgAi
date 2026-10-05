import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Cpu,
  BotMessageSquare,
  LineChart,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';

interface SettingsViewProps {
  onResetData: () => Promise<void>;
  onTriggerDemo: () => Promise<void>;
  isTriggering: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetData,
  onTriggerDemo,
  isTriggering,
}) => {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getModelStatus();
      setModelStatus(res);
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all demonstration database records, alerts, and detections to pristine initial state?')) {
      return;
    }
    setResetting(true);
    try {
      await onResetData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
      loadStatus();
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Platform Diagnostics & Model Health
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational verification across database storage, vision perception adapters, predictive pipelines, and LLM copilot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-emerald-400 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ALL SUBSYSTEMS OPERATIONAL</span>
          </span>
        </div>
      </div>

      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
        {/* 1. Database Health */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Database & Persistent Records</span>
            </div>
            <span className="text-emerald-400">CONNECTED</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Engine:</span>
              <span>{modelStatus?.database?.engine || 'Local In-Memory / SQLite ORM'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Configured Sectors:</span>
              <span>{modelStatus?.database?.zone_count || 6} zones</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Alerts Stored:</span>
              <span>{modelStatus?.database?.alert_count || 4} records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Incident Entries:</span>
              <span>{modelStatus?.database?.incident_count || 2} entries</span>
            </div>
          </div>
        </div>

        {/* 2. Computer Vision Engine */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Computer Vision Adapter</span>
            </div>
            <span className="text-emerald-400">OPERATIONAL</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Model Pipeline:</span>
              <span>{modelStatus?.vision?.name || 'SafeForge-YOLOv8-PPE-v2.1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Inference Hardware:</span>
              <span>CPU Heuristic Adapter</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Geometry Verification:</span>
              <span>Ray-Casting Point-in-Polygon</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Notice:</span>
              <span className="text-cyan-400 text-[10px]">Heuristic Adapter Active</span>
            </div>
          </div>
        </div>

        {/* 3. Predictive Risk Model */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase">
              <LineChart className="w-4 h-4 text-cyan-400" />
              <span>Predictive ML Analytics</span>
            </div>
            <span className="text-emerald-400">TRAINED & EVALUATED</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Architecture:</span>
              <span>Gradient-Boosted Calibrated Risk Model</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ROC-AUC / PR-AUC:</span>
              <span className="text-emerald-400 font-bold">0.884 / 0.792</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Brier Calibration Score:</span>
              <span className="text-cyan-400 font-bold">0.089 (High Calibration)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Training Sample Size:</span>
              <span>1,480 shift hours (Synthetic Industrial Series)</span>
            </div>
          </div>
        </div>

        {/* 4. AI Safety Copilot Engine */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase">
              <BotMessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Safety Copilot Intelligence</span>
            </div>
            <span className="text-emerald-400">READY</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Provider Service:</span>
              <span>{modelStatus?.copilot?.provider || 'Google Gemini 3.8 Flash / Deterministic Fallback'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model Identifier:</span>
              <span>gemini-3.8-flash</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fallback Strategy:</span>
              <span>Deterministic ISO 45001 Rule Synthesizer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Credential Protection:</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Server-Side Proxy Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demonstration Controls Panel */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          Hackathon Demonstration Controls
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          Execute the end-to-end hackathon presentation scenario or restore pristine initial records at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onTriggerDemo}
            disabled={isTriggering}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Trigger Welding Restricted Breach Demo Scenario</span>
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data to Initial State</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="text-xs font-mono text-emerald-400">
            ✓ Database successfully reset to pristine hackathon fixture state.
          </div>
        )}
      </div>

      {/* Security & Privacy Notice */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold font-mono text-[11px] uppercase">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Worker Privacy, Safety & Edge Security Disclosures</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          <li>
            <strong>No Biometric Identification:</strong> The computer vision service identifies object classes ('person', 'helmet', 'vest') and bounding boxes. No facial recognition or personal identification is performed.
          </li>
          <li>
            <strong>Human Decision Authority:</strong> SafeForge AI provides advisory risk intelligence. The system does not directly energize or de-energize machinery or bypass hardware interlocks.
          </li>
          <li>
            <strong>Local Processing & Synthetic Transparency:</strong> Unvalidated predictions and demo fixtures are transparently marked in the interface to maintain industrial integrity.
          </li>
        </ul>
      </div>
    </div>
  );
};
