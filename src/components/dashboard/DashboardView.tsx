import React from 'react';
import {
  ShieldAlert,
  HardHat,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Clock,
  Activity,
  Users,
} from 'lucide-react';
import { DashboardSummary } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onSelectTab: (tab: string) => void;
  onSelectZone: (zoneId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  loading,
  onSelectTab,
  onSelectZone,
}) => {
  if (loading || !summary) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded" />
          ))}
        </div>
        <div className="h-72 bg-slate-900 rounded" />
      </div>
    );
  }

  const {
    overall_safety_score,
    overall_risk_level,
    active_alerts_count,
    ppe_compliance_rate_pct,
    violations_today_count,
    high_risk_zones,
    zone_risk_matrix,
    risk_trend_24h,
    model_status,
  } = summary;

  // Compute SVG trend curve points
  const svgWidth = 800;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const points = risk_trend_24h.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(risk_trend_24h.length - 1, 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - (pt.avg_risk / 100) * (svgHeight - 2 * paddingY);
    return `${x},${y}`;
  });
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD =
    points.length > 0
      ? `M ${points[0]} L ${points.join(' L ')} L ${svgWidth - paddingX},${svgHeight - paddingY} L ${paddingX},${svgHeight - paddingY} Z`
      : '';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Industrial Safety Operations Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous AI perception, explainable risk calculation, and real-time hazard mitigation.
          </p>
        </div>

        {/* Model Freshness & Engine Indicator */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>VISION: {model_status.vision_mode === 'active_live' ? 'LIVE' : 'DEMO ADAPTER'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>SYNC: 2s AGO</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Operational Safety Index */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase font-semibold">Safety Score</span>
            <RiskBadge severity={overall_risk_level} size="sm" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{overall_safety_score}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Aggregated Risk Baseline</span>
            <span className="text-slate-300 font-semibold">{overall_risk_level}</span>
          </div>
        </div>

        {/* Metric 2: Active Priority Alerts */}
        <div
          onClick={() => onSelectTab('alerts')}
          className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded flex flex-col justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase font-semibold">Active Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{active_alerts_count.total}</span>
            <span className="text-xs font-mono text-red-400 font-semibold">
              ({active_alerts_count.critical} Critical)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span className="text-red-400 font-semibold">{active_alerts_count.critical} Crit</span>
            <span>·</span>
            <span className="text-orange-400 font-semibold">{active_alerts_count.high} High</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">{active_alerts_count.medium} Med</span>
          </div>
        </div>

        {/* Metric 3: Observed PPE Compliance */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase font-semibold">PPE Compliance</span>
            <HardHat className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{ppe_compliance_rate_pct}%</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +1.4%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Optical Gear Checks</span>
            <span className="text-slate-300">ANSI Z89.1 / 107</span>
          </div>
        </div>

        {/* Metric 4: Violations Today */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase font-semibold">Observed Events Today</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{violations_today_count}</span>
            <span className="text-xs text-amber-400/90 font-mono">boundary/gear</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Near-Miss Record</span>
            <span className="text-slate-300">{summary.recent_incidents.length} logged</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: 24h Trend Chart & Critical Hazards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 24-Hour Risk Curve */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                24-Hour Facility Composite Risk Trajectory
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dynamic risk score aggregated from optical breaches, sensor telemetry, and occupancy.
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Composite Risk
              </span>
              <span className="flex items-center gap-1.5 text-red-400/80">
                <span className="w-2.5 h-0.5 bg-red-400/80 inline-block border-t border-dashed" /> Critical Threshold (75)
              </span>
            </div>
          </div>

          {/* SVG Trend Graph */}
          <div className="relative border border-slate-800/80 bg-slate-950/60 p-2 rounded">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY - (75 / 100) * (svgHeight - 2 * paddingY)}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY - (75 / 100) * (svgHeight - 2 * paddingY)}
                stroke="#ef4444"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY - (50 / 100) * (svgHeight - 2 * paddingY)}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY - (50 / 100) * (svgHeight - 2 * paddingY)}
                stroke="#f97316"
                strokeDasharray="3 3"
                opacity="0.3"
              />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#334155" opacity="0.5" />

              {/* Area & Line */}
              <path d={areaD} fill="url(#riskGrad)" />
              <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data points */}
              {points.map((pt, i) => {
                const [cx, cy] = pt.split(',');
                const isPeak = risk_trend_24h[i]?.avg_risk >= 60;
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={isPeak ? 4 : 2.5}
                    className={isPeak ? 'fill-red-500 stroke-red-200 stroke-1' : 'fill-cyan-400'}
                  />
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-6 pt-1">
              <span>24h ago</span>
              <span>18h ago</span>
              <span>12h ago</span>
              <span>6h ago</span>
              <span className="text-cyan-400 font-semibold">NOW</span>
            </div>
          </div>
        </div>

        {/* High Risk Sectors Spotlight */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-400" />
                <span>Priority Hazard Zones</span>
              </h2>
              <button
                onClick={() => onSelectTab('zones')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
              >
                Map <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sectors currently exceeding baseline ISO risk thresholds.
            </p>
          </div>

          <div className="space-y-2.5">
            {high_risk_zones.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center font-mono">
                All zones currently within standard risk envelope.
              </div>
            ) : (
              high_risk_zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => {
                    onSelectZone(zone.id);
                    onSelectTab('zones');
                  }}
                  className="p-3 border border-slate-800 hover:border-slate-700 bg-slate-950/70 rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate max-w-[180px]">
                      {zone.name}
                    </span>
                    <RiskBadge severity={zone.severity} score={zone.score} showScore size="sm" />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-mono">
                    <span>Active Invariants</span>
                    <span className="text-cyan-400 hover:underline">Inspect Factors &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onSelectTab('risk-intelligence')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded transition-colors text-center cursor-pointer"
          >
            Open Explainable Risk Engine &rarr;
          </button>
        </div>
      </div>

      {/* Zone Risk Matrix Table */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Facility Sector Overview & Occupancy Compliance
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live inspection matrix across all 6 industrial production bays.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('monitoring')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono rounded flex items-center gap-1.5 cursor-pointer"
          >
            <span>Live Vision Feeds</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Sector Name</th>
                <th className="py-2.5 px-3">Hazard Class</th>
                <th className="py-2.5 px-3">Current Risk</th>
                <th className="py-2.5 px-3">Active Alerts</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {zone_risk_matrix.map((zm) => (
                <tr key={zm.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-100">{zm.name}</td>
                  <td className="py-3 px-3 text-slate-400">{zm.severity}</td>
                  <td className="py-3 px-3">
                    <RiskBadge severity={zm.severity} score={zm.score} showScore size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    {zm.active_alerts > 0 ? (
                      <span className="text-red-400 font-semibold">{zm.active_alerts} active</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{zm.occupancy} / {zm.max_occupancy}</span>
                      {zm.occupancy > zm.max_occupancy && (
                        <span className="text-amber-400 text-[10px] ml-1 font-bold">OVER</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        onSelectZone(zm.id);
                        onSelectTab('zones');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] underline cursor-pointer"
                    >
                      Inspect Zone
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
