import React, { useState, useEffect } from 'react';
import {
  LineChart,
  TrendingUp,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { PredictionHorizon, Zone } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface PredictionsViewProps {
  zones: Zone[];
  selectedZoneId?: string;
  onSelectTab: (tab: string) => void;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  zones,
  selectedZoneId = 'welding-zone-b',
  onSelectTab,
}) => {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId);
  const [forecast, setForecast] = useState<PredictionHorizon | null>(null);
  const [historyTrend, setHistoryTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadForecast(activeZoneId);
  }, [activeZoneId]);

  const loadForecast = async (zoneId: string) => {
    setLoading(true);
    try {
      const [fc, hist] = await Promise.all([
        api.getForecast(zoneId),
        api.getPredictionHistory(zoneId),
      ]);
      setForecast(fc);
      setHistoryTrend(hist.trend || []);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  // SVG Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 180;
  const padX = 40;
  const padY = 20;

  const actualPoints = historyTrend.map((pt, idx) => {
    const x = padX + (idx / Math.max(historyTrend.length - 1, 1)) * (svgWidth - 2 * padX);
    const y = svgHeight - padY - (pt.risk_score / 100) * (svgHeight - 2 * padY);
    return `${x},${y}`;
  });

  const predictedPoints = historyTrend.map((pt, idx) => {
    const x = padX + (idx / Math.max(historyTrend.length - 1, 1)) * (svgWidth - 2 * padX);
    const y = svgHeight - padY - (pt.predicted_risk / 100) * (svgHeight - 2 * padY);
    return `${x},${y}`;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Predictive Risk Forecasting & Leading Indicators
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Shift-level hazard probabilities estimated via calibrated gradient-boosted models and operational feature momentum.
          </p>
        </div>

        {/* Sector Selector Bar */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-xs">Sector:</span>
          <select
            value={activeZoneId}
            onChange={(e) => setActiveZoneId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Forecast Cards on Left, ML Model Evaluation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active 4h Forecast Spotlight */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  4-Hour Forecast Horizon Window
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{activeZone?.name}</h2>
              </div>
              {forecast && (
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-3xl font-bold text-white font-mono">
                      {forecast.probability_score}%
                    </span>
                    <RiskBadge severity={forecast.risk_category} size="md" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    95% CI: [{forecast.confidence_interval[0]}% – {forecast.confidence_interval[1]}%]
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded text-xs font-mono text-slate-300 space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>MODEL VERSION: {forecast?.model_name}</span>
                <span>HORIZON: +4 HOURS</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
                Estimates the conditional probability that this production bay will experience an OSHA-reportable near-miss or safety boundary breach during the upcoming 4-hour operating period.
              </p>
            </div>
          </div>

          {/* Historical Actual vs Predicted 24h Risk Curve */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Historical Actual Risk vs Calibrated Model Forecast
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Continuous tracking over the prior 24 operating hours.
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Actual Risk
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2.5 h-0.5 bg-purple-400 inline-block border-t border-dashed" /> 4h Forecast Horizon
                </span>
              </div>
            </div>

            {/* SVG Graph */}
            <div className="border border-slate-800 bg-slate-950/60 p-2 rounded">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                {/* Horizontal guide lines */}
                <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                <line
                  x1={padX}
                  y1={svgHeight - padY - (50 / 100) * (svgHeight - 2 * padY)}
                  x2={svgWidth - padX}
                  y2={svgHeight - padY - (50 / 100) * (svgHeight - 2 * padY)}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
                <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="#334155" opacity="0.5" />

                {/* Actual Risk Line */}
                <path d={`M ${actualPoints.join(' L ')}`} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />

                {/* Forecast Risk Line */}
                <path
                  d={`M ${predictedPoints.join(' L ')}`}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-6 pt-1">
                <span>T-24h</span>
                <span>T-18h</span>
                <span>T-12h</span>
                <span>T-6h</span>
                <span className="text-cyan-400 font-semibold">T-0 (NOW)</span>
              </div>
            </div>
          </div>

          {/* Feature Importance Attribution Breakdown */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Gradient-Boosted Feature Importance & Operational Momentum
            </h3>

            <div className="space-y-3">
              {forecast?.contributing_features.map((feat, idx) => (
                <div key={idx} className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-200">
                    <span className="font-semibold">{feat.feature}</span>
                    <span className="text-cyan-400">{feat.importance_pct}% Impact</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${feat.importance_pct * 2.5}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Value: {feat.value}</span>
                    <span className="text-slate-300 font-sans">{feat.impact_description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Model Validation Metrics & Disclaimers */}
        <div className="space-y-5">
          {/* Validation Metrics Card */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200 uppercase tracking-wider">
                Model Evaluation Metrics
              </span>
              <span className="text-[10px] text-emerald-400">EVALUATED</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">ROC-AUC Score:</span>
                <span className="text-emerald-400 font-bold">{forecast?.evaluation_metrics.roc_auc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Precision-Recall AUC:</span>
                <span className="text-emerald-400 font-bold">{forecast?.evaluation_metrics.pr_auc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">F1-Classification:</span>
                <span className="text-slate-200 font-bold">{forecast?.evaluation_metrics.f1_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Brier Calibration Score:</span>
                <span className="text-cyan-400 font-bold">{forecast?.evaluation_metrics.brier_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Training Samples:</span>
                <span className="text-slate-200 font-bold">
                  {forecast?.evaluation_metrics.training_sample_size} shifts
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
              Split Strategy: {forecast?.evaluation_metrics.split_strategy}
            </div>
          </div>

          {/* Honest Synthetic Label Warning */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded space-y-2 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold font-mono text-[11px] uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Synthetic Dataset Disclaimer</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              Demonstration Model: Trained on synthetic industrial shift observations for hackathon demonstration. Forecast probabilities serve as operational prioritization aids and do not guarantee the occurrence of future incidents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
