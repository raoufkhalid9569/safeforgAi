import {
  Alert,
  DashboardSummary,
  Incident,
  PredictionHorizon,
  RiskAssessment,
  RiskRuleConfig,
  Scenario,
  Zone,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to load dashboard summary');
    return res.json();
  },

  // Zones
  getZones: async (): Promise<Zone[]> => {
    const res = await fetch(`${API_BASE}/zones`);
    if (!res.ok) throw new Error('Failed to fetch zones');
    return res.json();
  },

  getZoneRisk: async (zoneId: string): Promise<RiskAssessment> => {
    const res = await fetch(`${API_BASE}/zones/${zoneId}/risk`);
    if (!res.ok) throw new Error('Failed to fetch zone risk assessment');
    return res.json();
  },

  // Alerts
  getAlerts: async (params?: { zone_id?: string; severity?: string; status?: string }): Promise<Alert[]> => {
    const search = new URLSearchParams();
    if (params?.zone_id) search.set('zone_id', params.zone_id);
    if (params?.severity) search.set('severity', params.severity);
    if (params?.status) search.set('status', params.status);

    const res = await fetch(`${API_BASE}/alerts?${search.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  acknowledgeAlert: async (alertId: string, actor: string, notes?: string): Promise<Alert> => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, notes }),
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  resolveAlert: async (alertId: string, actor: string, resolution_notes: string): Promise<Alert> => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, resolution_notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  // Incidents
  getIncidents: async (params?: { zone_id?: string; severity?: string }): Promise<Incident[]> => {
    const search = new URLSearchParams();
    if (params?.zone_id) search.set('zone_id', params.zone_id);
    if (params?.severity) search.set('severity', params.severity);

    const res = await fetch(`${API_BASE}/incidents?${search.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  createIncident: async (incidentData: Partial<Incident>): Promise<Incident> => {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData),
    });
    if (!res.ok) throw new Error('Failed to create incident');
    return res.json();
  },

  getPrintableIncidentReport: async (incidentId: string) => {
    const res = await fetch(`${API_BASE}/reports/incident/${incidentId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate incident report');
    return res.json();
  },

  // Monitoring & Vision
  getScenarios: async (): Promise<Scenario[]> => {
    const res = await fetch(`${API_BASE}/monitoring/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  analyzeImage: async (payload: {
    zone_id: string;
    image_data?: string;
    confidence_threshold?: number;
    scenario_id?: string;
  }) => {
    const res = await fetch(`${API_BASE}/monitoring/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to analyze image');
    return res.json();
  },

  analyzeVideo: async (payload: { zone_id: string; scenario_id?: string; filename?: string }) => {
    const res = await fetch(`${API_BASE}/monitoring/analyze-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to analyze video');
    return res.json();
  },

  // Risk Rules
  getRiskRules: async (): Promise<{ config: RiskRuleConfig; thresholds: any; version: string }> => {
    const res = await fetch(`${API_BASE}/risk/rules`);
    if (!res.ok) throw new Error('Failed to fetch risk rules');
    return res.json();
  },

  updateRiskRules: async (config: Partial<RiskRuleConfig>) => {
    const res = await fetch(`${API_BASE}/risk/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update risk rules');
    return res.json();
  },

  // Predictions
  getForecast: async (zoneId: string): Promise<PredictionHorizon> => {
    const res = await fetch(`${API_BASE}/predictions/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone_id: zoneId }),
    });
    if (!res.ok) throw new Error('Failed to fetch risk forecast');
    return res.json();
  },

  getPredictionHistory: async (zoneId: string) => {
    const res = await fetch(`${API_BASE}/predictions/history?zone_id=${zoneId}`);
    if (!res.ok) throw new Error('Failed to fetch prediction history');
    return res.json();
  },

  // AI Copilot
  askCopilot: async (payload: {
    message: string;
    context_zone_id?: string;
    context_alert_id?: string;
    context_incident_id?: string;
  }) => {
    const res = await fetch(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to process copilot query');
    return res.json();
  },

  // Settings & System
  getModelStatus: async () => {
    const res = await fetch(`${API_BASE}/settings/model-status`);
    if (!res.ok) throw new Error('Failed to fetch model status');
    return res.json();
  },

  resetDemoData: async () => {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  },

  triggerScenario: async (scenarioId: string) => {
    const res = await fetch(`${API_BASE}/demo/scenario/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to trigger scenario');
    return res.json();
  },
};
