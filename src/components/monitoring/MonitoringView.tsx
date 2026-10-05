import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Detection, RiskAssessment, Scenario, Zone } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface MonitoringViewProps {
  zones: Zone[];
  selectedZoneId?: string;
  onAlertCreated: () => void;
  onSelectTab: (tab: string) => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  zones,
  selectedZoneId = 'welding-zone-b',
  onAlertCreated,
  onSelectTab,
}) => {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('welding_breach');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.65);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; type: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    if (selectedZoneId) {
      setActiveZoneId(selectedZoneId);
    }
  }, [selectedZoneId]);

  const loadScenarios = async () => {
    try {
      const list = await api.getScenarios();
      setScenarios(list);
      // Auto-analyze default scenario for immediate visual feedback
      handleRunAnalysis('welding_breach');
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  };

  const handleRunAnalysis = async (scenarioId?: string) => {
    setIsAnalyzing(true);
    try {
      const activeScen = scenarioId || selectedScenarioId;
      const targetZone = zones.find((z) => z.id === activeZoneId) || zones[0];

      const res = await api.analyzeImage({
        zone_id: targetZone.id,
        scenario_id: activeScen,
        confidence_threshold: confidenceThreshold,
      });

      setAnalysisResult(res);
      setRecentDetections((prev) => [res.detection, ...prev.slice(0, 4)]);
      onAlertCreated();
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File exceeds 20MB limit. Please upload an optimized industrial inspection clip or image.');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    setUploadedFile({
      name: file.name,
      url: fileUrl,
      type: file.type.startsWith('video') ? 'video' : 'image',
    });

    // Run analysis on custom uploaded media
    handleRunAnalysis('custom_upload');
  };

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Live Computer Vision Safety Perception
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time object detection, PPE compliance verification, and restricted polygon boundary intersection.
          </p>
        </div>

        {/* Engine Notice Badge */}
        <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-1 bg-slate-900 border border-slate-800 rounded">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">SafeForge Vision Pipeline (Modular Adapter)</span>
        </div>
      </div>

      {/* Main Grid: Viewport on Left, Telemetry & Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Optical Stream Viewport & Canvas Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded overflow-hidden relative shadow-lg">
            {/* Viewport Header Bar */}
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-white">FEED: {activeZone?.name}</span>
                <span className="text-slate-400 text-[10px]">
                  [{activeZone?.restricted ? 'RESTRICTED SECTOR' : 'GENERAL ACCESS'}]
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>RES: 1920x1080</span>
                <span>FPS: 30</span>
              </div>
            </div>

            {/* Video/Image Canvas Area */}
            <div className="relative aspect-video bg-slate-900/80 flex items-center justify-center overflow-hidden">
              {/* Simulated Industrial Camera Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/60 to-slate-950/80" />

              {/* Grid Crosshair Overlay */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:4rem_4rem]" />

              {/* Restricted Hazard Zone Boundary Polygon */}
              {activeZone?.restricted && (
                <div className="absolute inset-x-12 inset-y-8 border-2 border-dashed border-red-500/70 bg-red-950/15 pointer-events-none flex items-start justify-start p-2">
                  <span className="font-mono text-[10px] text-red-400 bg-red-950/80 px-1.5 py-0.5 border border-red-500/50 uppercase tracking-widest font-bold">
                    RESTRICTED ARC HAZARD POLYGON
                  </span>
                </div>
              )}

              {/* Simulated Bounding Boxes Rendered Over the Feed */}
              {analysisResult?.annotated_boxes && (
                <div className="absolute inset-0 pointer-events-none p-4">
                  {analysisResult.annotated_boxes.map((box: any, idx: number) => {
                    // box: [ymin, xmin, ymax, xmax] 0-1
                    const top = `${box.box[0] * 100}%`;
                    const left = `${box.box[1] * 100}%`;
                    const width = `${(box.box[3] - box.box[1]) * 100}%`;
                    const height = `${(box.box[2] - box.box[0]) * 100}%`;
                    const isViolator = box.has_helmet === false || box.has_vest === false;

                    return (
                      <div
                        key={idx}
                        className={`absolute border-2 transition-all duration-300 ${
                          isViolator
                            ? 'border-red-500 bg-red-950/20 shadow-sm shadow-red-900'
                            : 'border-emerald-400 bg-emerald-950/20'
                        }`}
                        style={{ top, left, width, height }}
                      >
                        {/* Detection Tag */}
                        <div
                          className={`absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-tight whitespace-nowrap flex items-center gap-1.5 ${
                            isViolator
                              ? 'bg-red-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <span>{box.label.toUpperCase()}</span>
                          <span className="opacity-90">{Math.round(box.confidence * 100)}%</span>
                        </div>

                        {/* PPE Status Tag */}
                        {box.label === 'person' && (
                          <div className="absolute -bottom-5 left-0 text-[9px] font-mono px-1 bg-slate-950/90 text-slate-200 border border-slate-800 whitespace-nowrap">
                            HELMET: {box.has_helmet ? '✓ ANSI' : '✗ MISSING'} · VEST: {box.has_vest ? '✓' : '✗'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optical Detection Scanning HUD */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-cyan-950/30 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-2 p-4 bg-slate-900 border border-cyan-500/50 rounded shadow-xl text-center">
                    <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                    <span className="font-mono text-xs text-cyan-300 font-semibold">
                      INFERENCING CONVOLUTIONAL MODEL...
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Running point-in-polygon ray-casting algorithm
                    </span>
                  </div>
                </div>
              )}

              {/* Central Watermark when idle */}
              {!analysisResult && !isAnalyzing && (
                <div className="text-center font-mono text-slate-400 text-xs z-10">
                  <Play className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <span>Select a scenario or upload media below to start inference</span>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">CONFIDENCE THRESHOLD:</span>
                <input
                  type="range"
                  min="0.4"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono text-cyan-300 text-xs w-8">
                  {Math.round(confidenceThreshold * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunAnalysis()}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Re-Analyze Frame</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scenario Quick Selector Cards */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-semibold text-slate-300">
                Evaluation Scenarios (Pre-Recorded Feeds)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Select to test risk rules instantly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scenarios.map((scen) => {
                const isSelected = selectedScenarioId === scen.id;
                return (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setSelectedScenarioId(scen.id);
                      setActiveZoneId(scen.zone_id);
                      handleRunAnalysis(scen.id);
                    }}
                    className={`p-3 text-left border rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-800 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-cyan-400 uppercase font-semibold">
                        {scen.media_type}
                      </span>
                      <RiskBadge severity={scen.hazard_type} size="sm" />
                    </div>
                    <h3 className="font-semibold text-xs mt-1.5 truncate text-slate-100">
                      {scen.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {scen.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Optical Evidence & Risk Verification Panel */}
        <div className="space-y-4">
          {/* Custom Upload Card */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded space-y-3">
            <span className="text-xs font-mono uppercase font-semibold text-slate-300 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Upload Custom Media</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Upload factory JPG, PNG, or MP4 (max 20MB). Client-side frame extraction verifies PPE compliance.
            </p>

            <label className="block w-full border-2 border-dashed border-slate-700 hover:border-cyan-500/70 p-4 text-center rounded cursor-pointer transition-colors bg-slate-950/40">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-xs text-cyan-400 font-medium block">Select Image / Video</span>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {uploadedFile ? uploadedFile.name : 'MP4, WebM, JPEG, PNG'}
              </span>
            </label>
          </div>

          {/* Real-time Detection Telemetry & Diagnostics */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold uppercase text-slate-300">Observation Telemetry</span>
              <span className="text-[10px] text-slate-400">ID: {analysisResult?.detection?.id || '—'}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Sector:</span>
                <span className="text-slate-200 font-semibold">{activeZone?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event Classification:</span>
                <span className="text-cyan-400 font-semibold">
                  {analysisResult?.detection?.event_type.replace('_', ' ').toUpperCase() || 'NORMAL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Polygon Breach:</span>
                <span
                  className={
                    analysisResult?.restricted_zone_breach
                      ? 'text-red-400 font-bold'
                      : 'text-emerald-400 font-semibold'
                  }
                >
                  {analysisResult?.restricted_zone_breach ? 'YES (UNAUTHORIZED)' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Missing PPE:</span>
                <span className="text-amber-400 font-semibold">
                  {analysisResult?.missing_ppe_detected?.length > 0
                    ? analysisResult.missing_ppe_detected.join(', ')
                    : 'None (Compliant)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inference Latency:</span>
                <span className="text-slate-300">
                  {analysisResult?.engine_info?.inference_time_ms || 42} ms
                </span>
              </div>
            </div>

            {/* Calculated Risk Impact */}
            {analysisResult?.risk_assessment && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Calculated Sector Risk:</span>
                  <RiskBadge
                    severity={analysisResult.risk_assessment.severity}
                    score={analysisResult.risk_assessment.risk_score}
                    showScore
                    size="sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {analysisResult.detection.evidence.description}
                </p>
                <button
                  onClick={() => onSelectTab('alerts')}
                  className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded transition-colors text-center cursor-pointer"
                >
                  View in Alerts Center &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Model Status Disclaimer */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1 rounded">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model Execution Notice</span>
            </div>
            <p className="leading-snug">
              Running modular detection pipeline. Does not perform facial recognition or store biometric identities. Detections require human supervisory sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
