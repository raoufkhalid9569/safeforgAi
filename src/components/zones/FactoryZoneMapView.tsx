import React, { useState } from 'react';
import {
  MapPin,
  Users,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Activity,
  Layers,
  CheckCircle2,
  X,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { Zone } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface FactoryZoneMapViewProps {
  zones: Zone[];
  selectedZoneId?: string;
  onSelectZone: (zoneId: string) => void;
  onSelectTab: (tab: string) => void;
}

export const FactoryZoneMapView: React.FC<FactoryZoneMapViewProps> = ({
  zones,
  selectedZoneId = 'welding-zone-b',
  onSelectZone,
  onSelectTab,
}) => {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId);

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  const handleZoneClick = (zoneId: string) => {
    setActiveZoneId(zoneId);
    onSelectZone(zoneId);
  };

  // Color mappings for SVG layout
  const getZoneFill = (zone: Zone) => {
    if (zone.active_risk_score >= 75) return 'fill-red-950/50 stroke-red-500';
    if (zone.active_risk_score >= 50) return 'fill-orange-950/40 stroke-orange-500';
    if (zone.active_risk_score >= 25) return 'fill-amber-950/30 stroke-amber-500';
    return 'fill-slate-900/80 stroke-slate-700';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Interactive Industrial Factory Floor Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Architectural schematic with live risk heat distribution, optical boundary polygons, and worker occupancy.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80 border border-red-400" /> Critical Risk (75+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/80 border border-orange-400" /> High Risk (50-74)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80 border border-amber-400" /> Medium (25-49)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-600" /> Low Risk (0-24)
          </span>
        </div>
      </div>

      {/* Main Grid: SVG Map on Left, Zone Detail Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Factory Floor Map */}
        <div className="lg:col-span-2 p-5 bg-slate-950 border border-slate-800 rounded space-y-3 relative shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>FACILITY LAYOUT: HEAVY MANUFACTURING SECTOR 4</span>
            <span className="text-cyan-400">CLICK ANY SECTOR TO INSPECT</span>
          </div>

          {/* Interactive SVG Diagram */}
          <div className="border border-slate-800 bg-slate-900/50 rounded p-2 overflow-hidden">
            <svg
              viewBox="0 0 1000 650"
              className="w-full h-auto select-none font-mono"
              style={{ minHeight: '380px' }}
            >
              <defs>
                <pattern
                  id="hazardStripe"
                  width="12"
                  height="12"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="4" opacity="0.25" />
                </pattern>
                <pattern
                  id="gridPattern"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="1000" height="650" fill="url(#gridPattern)" />

              {/* Pedestrian Safety Walkways (Yellow dashed lines) */}
              <path
                d="M 300 20 L 300 630 M 20 340 L 980 340 M 600 20 L 600 340 M 800 340 L 800 630"
                stroke="#eab308"
                strokeWidth="3"
                strokeDasharray="8 6"
                opacity="0.35"
              />

              {/* 1. Assembly Line A (Top-Left) */}
              {(() => {
                const z = zones.find((item) => item.id === 'assembly-line-a');
                if (!z) return null;
                const isSelected = activeZoneId === z.id;
                return (
                  <g
                    onClick={() => handleZoneClick(z.id)}
                    className="cursor-pointer group transition-all"
                  >
                    <rect
                      x="30"
                      y="30"
                      width="250"
                      height="290"
                      rx="4"
                      className={`${getZoneFill(z)} stroke-2 group-hover:stroke-cyan-400 ${
                        isSelected ? 'stroke-cyan-400 stroke-[3]' : ''
                      }`}
                    />
                    <text x="50" y="70" className="fill-white font-bold text-base">
                      {z.name.split(' (')[0]}
                    </text>
                    <text x="50" y="95" className="fill-slate-400 text-xs">
                      {z.zone_type}
                    </text>
                    <text x="50" y="140" className="fill-slate-300 text-xs">
                      Risk: {z.active_risk_score}/100 [{z.hazard_level}]
                    </text>
                    <text x="50" y="170" className="fill-slate-400 text-xs">
                      Occupancy: {z.current_occupancy}/{z.max_occupancy} workers
                    </text>
                    <text x="50" y="270" className="fill-emerald-400 text-xs font-bold">
                      ✓ OSHA PATH CLEAR
                    </text>
                  </g>
                );
              })()}

              {/* 2. Welding Bay B (Top-Middle) */}
              {(() => {
                const z = zones.find((item) => item.id === 'welding-zone-b');
                if (!z) return null;
                const isSelected = activeZoneId === z.id;
                return (
                  <g
                    onClick={() => handleZoneClick(z.id)}
                    className="cursor-pointer group transition-all"
                  >
                    <rect
                      x="320"
                      y="30"
                      width="260"
                      height="290"
                      rx="4"
                      className={`${getZoneFill(z)} stroke-2 group-hover:stroke-cyan-400 ${
                        isSelected ? 'stroke-cyan-400 stroke-[3]' : ''
                      }`}
                    />
                    {/* Hazard striped overlay for restricted zone */}
                    <rect x="320" y="30" width="260" height="290" fill="url(#hazardStripe)" />
                    <text x="340" y="70" className="fill-white font-bold text-base">
                      {z.name.split(' (')[0]}
                    </text>
                    <text x="340" y="95" className="fill-red-400 text-xs font-bold">
                      ⚠ RESTRICTED ARC CELL
                    </text>
                    <text x="340" y="140" className="fill-red-400 font-bold text-sm">
                      Risk: {z.active_risk_score}/100 [{z.hazard_level}]
                    </text>
                    <text x="340" y="170" className="fill-slate-300 text-xs">
                      Occupancy: {z.current_occupancy}/{z.max_occupancy} workers
                    </text>
                    <text x="340" y="270" className="fill-red-400 text-xs font-bold animate-pulse">
                      ● ACTIVE OPTICAL BREACH
                    </text>
                  </g>
                );
              })()}

              {/* 3. Machine Operations C (Top-Right) */}
              {(() => {
                const z = zones.find((item) => item.id === 'machine-ops-c');
                if (!z) return null;
                const isSelected = activeZoneId === z.id;
                return (
                  <g
                    onClick={() => handleZoneClick(z.id)}
                    className="cursor-pointer group transition-all"
                  >
                    <rect
                      x="620"
                      y="30"
                      width="350"
                      height="290"
                      rx="4"
                      className={`${getZoneFill(z)} stroke-2 group-hover:stroke-cyan-400 ${
                        isSelected ? 'stroke-cyan-400 stroke-[3]' : ''
                      }`}
                    />
                    <rect x="620" y="30" width="350" height="290" fill="url(#hazardStripe)" opacity="0.6" />
                    <text x="640" y="70" className="fill-white font-bold text-base">
                      {z.name.split(' (')[0]}
                    </text>
                    <text x="640" y="95" className="fill-orange-400 text-xs font-bold">
                      ⚠ CNC HEAVY MILLING
                    </text>
                    <text x="640" y="140" className="fill-orange-400 font-bold text-sm">
                      Risk: {z.active_risk_score}/100 [{z.hazard_level}]
                    </text>
                    <text x="640" y="170" className="fill-slate-300 text-xs">
                      Occupancy: {z.current_occupancy}/{z.max_occupancy} workers
                    </text>
                    <text x="640" y="270" className="fill-orange-400 text-xs font-bold">
                      ● SPINDLE VIBRATION 4.6g
                    </text>
                  </g>
                );
              })()}

              {/* 4. Warehouse & Staging D (Bottom-Left) */}
              {(() => {
                const z = zones.find((item) => item.id === 'warehouse-d');
                if (!z) return null;
                const isSelected = activeZoneId === z.id;
                return (
                  <g
                    onClick={() => handleZoneClick(z.id)}
                    className="cursor-pointer group transition-all"
                  >
                    <rect
                      x="30"
                      y="360"
                      width="450"
                      height="260"
                      rx="4"
                      className={`${getZoneFill(z)} stroke-2 group-hover:stroke-cyan-400 ${
                        isSelected ? 'stroke-cyan-400 stroke-[3]' : ''
                      }`}
                    />
                    <text x="50" y="400" className="fill-white font-bold text-base">
                      {z.name.split(' (')[0]}
                    </text>
                    <text x="50" y="425" className="fill-slate-400 text-xs">
                      {z.zone_type}
                    </text>
                    <text x="50" y="470" className="fill-slate-300 text-xs">
                      Risk: {z.active_risk_score}/100 [{z.hazard_level}]
                    </text>
                    <text x="50" y="500" className="fill-slate-400 text-xs">
                      Occupancy: {z.current_occupancy}/{z.max_occupancy} workers
                    </text>
                    <text x="50" y="580" className="fill-slate-400 text-xs">
                      FORKLIFT TRAFFIC LANE ACTIVE
                    </text>
                  </g>
                );
              })()}

              {/* 5. Loading Bay E (Bottom-Middle) */}
              {(() => {
                const z = zones.find((item) => item.id === 'loading-bay-e');
                if (!z) return null;
                const isSelected = activeZoneId === z.id;
                return (
                  <g
                    onClick={() => handleZoneClick(z.id)}
                    className="cursor-pointer group transition-all"
                  >
                    <rect
                      x="500"
                      y="360"
                      width="280"
                      height="260"
                      rx="4"
                      className={`${getZoneFill(z)} stroke-2 group-hover:stroke-cyan-400 ${
                        isSelected ? 'stroke-cyan-400 stroke-[3]' : ''
                      }`}
                    />
                    <text x="520" y="400" className="fill-white font-bold text-base">
                      {z.name.split(' (')[0]}
                    </text>
                    <text x="520" y="425" className="fill-orange-400 text-xs font-bold">
                      ⚠ DOCK TRAFFIC
                    </text>
                    <text x="520" y="470" className="fill-orange-400 font-bold text-sm">
                      Risk: {z.active_risk_score}/100 [{z.hazard_level}]
                    </text>
                    <text x="520" y="500" className="fill-slate-300 text-xs">
                      Occupancy: {z.current_occupancy}/{z.max_occupancy} workers
                    </text>
                    <text x="520" y="580" className="fill-amber-400 text-xs">
                      NOISE: 88.6 dBA (ELEVATED)
                    </text>
                  </g>
                );
              })()}

              {/* 6. Supervisory Control & Office F (Bottom-Right) */}
              {(() => {
                const z = zones.find((item) => item.id === 'control-office-f');
                if (!z) return null;
                const isSelected = activeZoneId === z.id;
                return (
                  <g
                    onClick={() => handleZoneClick(z.id)}
                    className="cursor-pointer group transition-all"
                  >
                    <rect
                      x="800"
                      y="360"
                      width="170"
                      height="260"
                      rx="4"
                      className={`${getZoneFill(z)} stroke-2 group-hover:stroke-cyan-400 ${
                        isSelected ? 'stroke-cyan-400 stroke-[3]' : ''
                      }`}
                    />
                    <text x="815" y="400" className="fill-white font-bold text-sm">
                      Control Room F
                    </text>
                    <text x="815" y="425" className="fill-slate-400 text-xs">
                      EHS HQ / Office
                    </text>
                    <text x="815" y="470" className="fill-emerald-400 text-xs">
                      Risk: {z.active_risk_score}/100
                    </text>
                    <text x="815" y="500" className="fill-slate-400 text-xs">
                      Staff: {z.current_occupancy}/{z.max_occupancy}
                    </text>
                    <text x="815" y="580" className="fill-emerald-400 text-xs">
                      SECURE HUB
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Right Col: Zone Detailed Inspection Panel */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sector Detail</span>
              </span>
              <RiskBadge
                severity={activeZone?.hazard_level}
                score={activeZone?.active_risk_score}
                showScore
                size="sm"
              />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">{activeZone?.name}</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">{activeZone?.zone_type}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded">
                <span className="text-slate-400 text-[10px] block">OCCUPANCY</span>
                <span className="text-white font-bold text-sm">
                  {activeZone?.current_occupancy} / {activeZone?.max_occupancy}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded">
                <span className="text-slate-400 text-[10px] block">FLOOR AREA</span>
                <span className="text-white font-bold text-sm">{activeZone?.area_sqm} m²</span>
              </div>
            </div>

            {/* Invariants & Supervisor */}
            <div className="space-y-2 text-xs font-mono border-t border-slate-800 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Supervisor:</span>
                <span className="text-slate-200 text-right">{activeZone?.supervisor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Restricted Boundary:</span>
                <span
                  className={
                    activeZone?.restricted
                      ? 'text-red-400 font-bold uppercase'
                      : 'text-slate-300'
                  }
                >
                  {activeZone?.restricted ? 'YES (HARZARD CELL)' : 'NO (GENERAL)'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onSelectTab('monitoring')}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-medium transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View Sector Vision Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onSelectTab('risk-intelligence')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono transition-colors text-center cursor-pointer"
              >
                Inspect Contributing Risk Factors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
