import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCheck2,
  Info,
  Save,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { RiskAssessment, RiskRuleConfig, Zone } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface RiskIntelligenceViewProps {
  zones: Zone[];
  selectedZoneId?: string;
  onSelectTab: (tab: string) => void;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  zones,
  selectedZoneId = 'welding-zone-b',
  onSelectTab,
}) => {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [rulesConfig, setRulesConfig] = useState<RiskRuleConfig | null>(null);
  const [tempConfig, setTempConfig] = useState<RiskRuleConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSavingRules, setIsSavingRules] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadData(activeZoneId);
  }, [activeZoneId]);

  const loadData = async (zoneId: string) => {
    setLoading(true);
    try {
      const [riskRes, rulesRes] = await Promise.all([
        api.getZoneRisk(zoneId),
        api.getRiskRules(),
      ]);
      setAssessment(riskRes);
      setRulesConfig(rulesRes.config);
      setTempConfig(rulesRes.config);
    } catch (err) {
      console.error('Failed to load risk intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!tempConfig) return;
    setIsSavingRules(true);
    try {
      await api.updateRiskRules(tempConfig);
      setRulesConfig(tempConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      // Reload zone assessment with updated weights
      const updatedAssessment = await api.getZoneRisk(activeZoneId);
      setAssessment(updatedAssessment);
    } catch (err) {
      console.error('Failed to save rules:', err);
    } finally {
      setIsSavingRules(false);
    }
  };

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Industrial Risk Intelligence & Rule Explainability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent composite scoring algorithm, evidence attribution, and configurable safety invariants.
          </p>
        </div>

        {/* Zone Selector Bar */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-xs">Sector:</span>
          <select
            value={activeZoneId}
            onChange={(e) => setActiveZoneId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.hazard_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Score & Factors on Left, Rule Configurator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assessment Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Score Spotlight Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Active Hazard Assessment
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{activeZone?.name}</h2>
              </div>
              {assessment && (
                <RiskBadge severity={assessment.severity} score={assessment.risk_score} showScore size="lg" />
              )}
            </div>

            {/* Score Visual Bar */}
            {assessment && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Risk Severity Gauge (0 - 100)</span>
                  <span className="text-slate-200 font-semibold">{assessment.risk_score} / 100</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      assessment.risk_score >= 75
                        ? 'bg-red-500'
                        : assessment.risk_score >= 50
                        ? 'bg-orange-500'
                        : assessment.risk_score >= 25
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${assessment.risk_score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <span className="text-emerald-400">0 Low</span>
                  <span className="text-amber-400">25 Med</span>
                  <span className="text-orange-400">50 High</span>
                  <span className="text-red-400">75 Critical</span>
                  <span className="text-red-500">100</span>
                </div>
              </div>
            )}

            {/* Formula Explanation */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded font-mono text-xs space-y-1">
              <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Deterministic Calculation Rule Engine</span>
              </div>
              <p className="text-slate-300 text-[11px]">{assessment?.formula_used}</p>
              <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-1">
                <span>Rule Version: {assessment?.rule_version}</span>
                <span>·</span>
                <span>Evaluated: {new Date(assessment?.calculated_at || '').toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Contributing Factors & Evidence Table */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Contributing Risk Factors & Optical / Telemetry Evidence
            </h3>

            {assessment?.factors && assessment.factors.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {assessment.factors.map((f, idx) => (
                  <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{f.factor}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                          Weight: {f.weight}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono leading-relaxed">
                        {f.evidence}
                      </p>
                    </div>
                    <div className="shrink-0 text-right font-mono">
                      <span className="text-xs font-bold text-red-400">+{f.contribution} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-mono">
                No active elevated hazard factors detected for this sector.
              </div>
            )}
          </div>

          {/* Contextual Recommendations */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recommended Preventive Actions (ISO 45001 / OSHA)</span>
            </h3>

            <div className="space-y-2">
              {assessment?.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-200 font-mono flex items-start gap-2.5"
                >
                  <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Configurable Safety Rule Engine */}
        <div className="space-y-5">
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono uppercase font-semibold text-slate-200">
                  Risk Rule Invariants
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">EHS Config</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Adjust factor weight contributions to align with site-specific hazard assessments. Changes recalculate zone scores immediately.
            </p>

            {tempConfig && (
              <div className="space-y-4 text-xs font-mono">
                {/* Rule: PPE Violation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">PPE Non-Compliance:</span>
                    <span className="text-cyan-400 font-semibold">{tempConfig.ppe_violation} pts</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={tempConfig.ppe_violation}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, ppe_violation: parseInt(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Rule: Restricted Boundary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Restricted Zone Breach:</span>
                    <span className="text-cyan-400 font-semibold">{tempConfig.restricted_zone} pts</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={tempConfig.restricted_zone}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, restricted_zone: parseInt(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Rule: Machine Proximity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Dangerous Proximity:</span>
                    <span className="text-cyan-400 font-semibold">{tempConfig.machine_proximity} pts</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={tempConfig.machine_proximity}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, machine_proximity: parseInt(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Rule: Abnormal Telemetry */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Abnormal Telemetry:</span>
                    <span className="text-cyan-400 font-semibold">{tempConfig.abnormal_sensor} pts</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={tempConfig.abnormal_sensor}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, abnormal_sensor: parseInt(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Rule: High Occupancy */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Occupancy Limit Excess:</span>
                    <span className="text-cyan-400 font-semibold">{tempConfig.high_occupancy} pts</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="5"
                    value={tempConfig.high_occupancy}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, high_occupancy: parseInt(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingRules}
                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingRules ? 'Saving...' : 'Apply Rule Weights'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (rulesConfig) setTempConfig(rulesConfig);
                    }}
                    className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Reset to active configuration"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {saveSuccess && (
                  <div className="text-[11px] text-emerald-400 text-center font-mono animate-fadeIn">
                    ✓ Weights saved and applied across all sectors.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legal / Standard Boundaries Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded text-xs space-y-2 text-slate-400">
            <span className="text-slate-200 font-semibold font-mono text-[11px] uppercase flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Safety Assessment Boundary</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              Calculated risk scores prioritize operational attention. They do not constitute certified automated machinery shutoff under IEC 61508 / ISO 13849. Always maintain physical emergency stops (E-Stops).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
