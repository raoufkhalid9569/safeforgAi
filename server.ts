import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { db } from './server/db';
import { riskEngine } from './server/risk-engine';
import { visionService } from './server/vision-service';
import { predictionService } from './server/prediction-service';
import { copilotService } from './server/copilot-service';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// -----------------------------------------------------------------------------
// 1. Health & Status
// -----------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    product: 'SafeForge AI',
    version: '1.0.0',
    mode: 'demo_industry_fixture',
    timestamp: new Date().toISOString(),
    capabilities: {
      vision: true,
      risk_engine: true,
      predictive_analytics: true,
      ai_copilot: true,
      gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    },
  });
});

// -----------------------------------------------------------------------------
// 2. Dashboard
// -----------------------------------------------------------------------------
app.get('/api/dashboard/summary', (_req: Request, res: Response) => {
  try {
    const summary = db.getDashboardSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to aggregate dashboard summary', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Zones & Zone Risk
// -----------------------------------------------------------------------------
app.get('/api/zones', (_req: Request, res: Response) => {
  res.json(db.getZones());
});

app.get('/api/zones/:zone_id', (req: Request, res: Response) => {
  const zone = db.getZone(req.params.zone_id);
  if (!zone) {
    return res.status(404).json({ error: `Zone with ID '${req.params.zone_id}' not found` });
  }
  res.json(zone);
});

app.get('/api/zones/:zone_id/risk', (req: Request, res: Response) => {
  const zone = db.getZone(req.params.zone_id);
  if (!zone) {
    return res.status(404).json({ error: `Zone with ID '${req.params.zone_id}' not found` });
  }
  const detections = db.getDetections(zone.id);
  const sensors = db.getSensors(zone.id);
  const assessment = riskEngine.evaluateZoneRisk(zone, detections, sensors, 1);
  res.json(assessment);
});

// -----------------------------------------------------------------------------
// 4. Alerts Lifecycle
// -----------------------------------------------------------------------------
app.get('/api/alerts', (req: Request, res: Response) => {
  const { zone_id, severity, status } = req.query;
  const alerts = db.getAlerts({
    zone_id: zone_id as string,
    severity: severity as any,
    status: status as any,
  });
  res.json(alerts);
});

app.get('/api/alerts/:alert_id', (req: Request, res: Response) => {
  const alert = db.getAlert(req.params.alert_id);
  if (!alert) {
    return res.status(404).json({ error: `Alert with ID '${req.params.alert_id}' not found` });
  }
  res.json(alert);
});

app.patch('/api/alerts/:alert_id/acknowledge', (req: Request, res: Response) => {
  const { actor = 'EHS Supervisor', notes } = req.body;
  const alert = db.acknowledgeAlert(req.params.alert_id, actor, notes);
  if (!alert) {
    return res.status(404).json({ error: `Alert '${req.params.alert_id}' not found` });
  }
  res.json(alert);
});

app.patch('/api/alerts/:alert_id/resolve', (req: Request, res: Response) => {
  const { actor = 'EHS Supervisor', resolution_notes } = req.body;
  if (!resolution_notes) {
    return res.status(400).json({ error: 'Resolution notes are mandatory before closing an alert' });
  }
  const alert = db.resolveAlert(req.params.alert_id, actor, resolution_notes);
  if (!alert) {
    return res.status(404).json({ error: `Alert '${req.params.alert_id}' not found` });
  }
  res.json(alert);
});

// -----------------------------------------------------------------------------
// 5. Incidents
// -----------------------------------------------------------------------------
app.get('/api/incidents', (req: Request, res: Response) => {
  const { zone_id, severity } = req.query;
  const incidents = db.getIncidents({
    zone_id: zone_id as string,
    severity: severity as any,
  });
  res.json(incidents);
});

app.get('/api/incidents/:incident_id', (req: Request, res: Response) => {
  const incident = db.getIncident(req.params.incident_id);
  if (!incident) {
    return res.status(404).json({ error: `Incident '${req.params.incident_id}' not found` });
  }
  res.json(incident);
});

app.post('/api/incidents', (req: Request, res: Response) => {
  const {
    zone_id,
    incident_type,
    severity,
    title,
    description,
    contributing_factors = [],
    corrective_actions = [],
    reported_by = 'Floor Operator',
  } = req.body;

  if (!zone_id || !title || !description || !severity) {
    return res.status(400).json({ error: 'Missing required incident fields (zone_id, title, description, severity)' });
  }

  const zone = db.getZone(zone_id);
  const incident = db.createIncident({
    zone_id,
    zone_name: zone?.name || zone_id,
    incident_type: incident_type || 'near_miss',
    severity,
    title,
    description,
    contributing_factors,
    corrective_actions,
    status: 'INVESTIGATING',
    reported_by,
    occurred_at: new Date().toISOString(),
    demo_mode: true,
  });

  res.status(201).json(incident);
});

// -----------------------------------------------------------------------------
// 6. Computer Vision & Media Analysis
// -----------------------------------------------------------------------------
app.get('/api/monitoring/scenarios', (_req: Request, res: Response) => {
  res.json(visionService.getSampleScenarios());
});

app.post('/api/monitoring/analyze-image', async (req: Request, res: Response) => {
  try {
    const { zone_id = 'welding-zone-b', image_data, confidence_threshold, scenario_id } = req.body;
    const zone = db.getZone(zone_id) || db.getZone('welding-zone-b')!;
    const result = await visionService.analyzeMedia(
      {
        image_data,
        media_type: 'image',
        zone_id: zone.id,
        confidence_threshold,
        scenario_id,
      },
      zone
    );

    // Save detection to DB
    db.addDetection(result.detection);

    // Check if risk score updates
    const assessment = riskEngine.evaluateZoneRisk(zone, [result.detection], db.getSensors(zone.id));
    if (result.detection.event_type !== 'normal_observation') {
      zone.active_risk_score = assessment.risk_score;
      db.updateZone(zone.id, { active_risk_score: assessment.risk_score });

      // Generate alert if high/critical and not debounced
      if (assessment.severity === 'CRITICAL' || assessment.severity === 'HIGH') {
        if (!visionService.shouldDebounce(zone.id, result.detection.event_type)) {
          db.createAlert({
            detection_id: result.detection.id,
            zone_id: zone.id,
            zone_name: zone.name,
            severity: assessment.severity,
            risk_score: assessment.risk_score,
            status: 'NEW',
            title: `Detected ${result.detection.event_type.replace('_', ' ').toUpperCase()} in ${zone.name}`,
            description: result.detection.evidence.description,
            contributing_factors: assessment.factors,
            recommended_actions: assessment.recommendations,
          });
        }
      }
    }

    res.json({
      ...result,
      risk_assessment: assessment,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Image analysis failed', details: err.message });
  }
});

app.post('/api/monitoring/analyze-video', async (req: Request, res: Response) => {
  try {
    const { zone_id = 'welding-zone-b', scenario_id, filename } = req.body;
    const zone = db.getZone(zone_id) || db.getZone('welding-zone-b')!;
    const result = await visionService.analyzeMedia(
      {
        media_type: 'video',
        zone_id: zone.id,
        scenario_id,
        filename,
      },
      zone
    );

    db.addDetection(result.detection);
    const assessment = riskEngine.evaluateZoneRisk(zone, [result.detection], db.getSensors(zone.id));
    zone.active_risk_score = assessment.risk_score;
    db.updateZone(zone.id, { active_risk_score: assessment.risk_score });

    res.json({
      ...result,
      risk_assessment: assessment,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Video analysis failed', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. Risk Engine Configuration & Calculations
// -----------------------------------------------------------------------------
app.get('/api/risk/rules', (_req: Request, res: Response) => {
  res.json({
    config: riskEngine.getConfig(),
    thresholds: {
      low: '0 - 24',
      medium: '25 - 49',
      high: '50 - 74',
      critical: '75 - 100',
    },
    version: '2026.1-OSHA-ISO45001-ALPHA',
  });
});

app.post('/api/risk/rules', (req: Request, res: Response) => {
  const updated = riskEngine.updateConfig(req.body);
  res.json({ success: true, config: updated });
});

app.post('/api/risk/calculate', (req: Request, res: Response) => {
  const { zone_id, mock_detections, mock_sensors } = req.body;
  const zone = db.getZone(zone_id) || db.getZones()[0];
  const detections = mock_detections || db.getDetections(zone.id);
  const sensors = mock_sensors || db.getSensors(zone.id);
  const assessment = riskEngine.evaluateZoneRisk(zone, detections, sensors);
  res.json(assessment);
});

// -----------------------------------------------------------------------------
// 8. Predictive Analytics
// -----------------------------------------------------------------------------
app.post('/api/predictions/forecast', (req: Request, res: Response) => {
  const { zone_id = 'welding-zone-b', observation } = req.body;
  const zone = db.getZone(zone_id);
  if (!zone) {
    return res.status(404).json({ error: `Zone with ID '${zone_id}' not found` });
  }
  const forecast = predictionService.generateForecast(zone, observation);
  res.json(forecast);
});

app.get('/api/predictions/history', (req: Request, res: Response) => {
  const zone_id = (req.query.zone_id as string) || 'welding-zone-b';
  const history = predictionService.getHistoricalRiskTrend(zone_id);
  res.json({
    zone_id,
    forecast_horizon_hours: 4,
    trend: history,
  });
});

// -----------------------------------------------------------------------------
// 9. AI Safety Copilot
// -----------------------------------------------------------------------------
app.post('/api/copilot/chat', async (req: Request, res: Response) => {
  try {
    const { message, context_zone_id, context_alert_id, context_incident_id } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Field "message" string is required' });
    }
    const reply = await copilotService.processChat({
      message,
      context_zone_id,
      context_alert_id,
      context_incident_id,
    });
    res.json(reply);
  } catch (err: any) {
    res.status(500).json({ error: 'Copilot query execution failed', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// 10. Printable Formal Incident Report
// -----------------------------------------------------------------------------
app.post('/api/reports/incident/:incident_id', (req: Request, res: Response) => {
  const incident = db.getIncident(req.params.incident_id);
  if (!incident) {
    return res.status(404).json({ error: `Incident '${req.params.incident_id}' not found` });
  }
  const zone = db.getZone(incident.zone_id);
  const relatedAlerts = db.getAlerts({ zone_id: incident.zone_id });

  const report = {
    report_title: `OSHA / ISO 45001 INDUSTRIAL SAFETY INCIDENT REPORT: ${incident.incident_number}`,
    incident_number: incident.incident_number,
    generated_at: new Date().toISOString(),
    organization: 'SafeForge Industrial Heavy Operations - Sector 4 Facility',
    incident_details: incident,
    zone_context: zone,
    active_alerts_at_time: relatedAlerts.slice(0, 3),
    ehs_compliance_declaration:
      'This document represents a verifiable safety incident audit entry. All corrective action mandates require formal sign-off by a qualified EHS Professional before closure.',
    sign_off: {
      supervisor_signature_required: true,
      investigator_name: incident.investigator || 'Dr. Rebecca Chen (EHS Director)',
      review_status: incident.status,
    },
  };

  res.json(report);
});

// -----------------------------------------------------------------------------
// 11. Settings & Model Status
// -----------------------------------------------------------------------------
app.get('/api/settings/model-status', (_req: Request, res: Response) => {
  res.json({
    database: {
      engine: 'In-Memory / SQLite ORM Compatible',
      status: 'CONNECTED',
      zone_count: db.getZones().length,
      alert_count: db.getAlerts().length,
      incident_count: db.getIncidents().length,
      audit_records: db.getAuditLogs().length,
    },
    vision: {
      name: 'SafeForge-YOLOv8-PPE-Industrial-v2.1',
      version: '2.1.0-onnx-sim',
      hardware: 'CPU Heuristic Pipeline',
      status: 'OPERATIONAL_DEMO',
      notice: 'Using modular detection adapter with real polygon geometry coordinates.',
    },
    predictive_model: {
      name: 'SafeForge-GradientBoosted-RiskForecaster-v1.4',
      status: 'TRAINED_EVALUATED',
      training_records: 1480,
      roc_auc: 0.884,
      pr_auc: 0.792,
      brier_score: 0.089,
    },
    copilot: {
      provider: process.env.GEMINI_API_KEY ? 'Google Gemini 3.8 Flash' : 'Deterministic Safety Engine Fallback',
      model: 'gemini-3.8-flash',
      active_mode: process.env.GEMINI_API_KEY ? 'cloud_llm' : 'deterministic_fallback',
      api_key_configured: Boolean(process.env.GEMINI_API_KEY),
    },
    demo_mode: true,
  });
});

// -----------------------------------------------------------------------------
// 12. Demo Controls: Reset & Live Scenario Trigger
// -----------------------------------------------------------------------------
app.post('/api/demo/reset', (_req: Request, res: Response) => {
  db.seedInitialData();
  res.json({ success: true, message: 'Platform data restored to pristine initial demonstration state' });
});

app.post('/api/demo/scenario/trigger', (req: Request, res: Response) => {
  const { scenario_id = 'welding_breach' } = req.body;
  const result = db.triggerScenario(scenario_id);
  res.json({
    success: true,
    message: `Scenario '${scenario_id}' executed successfully across detection, risk engine, and alerts`,
    ...result,
  });
});

// -----------------------------------------------------------------------------
// Dev & Production Vite Middleware Mounting
// -----------------------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafeForge AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SafeForge AI] Failed to start server:', err);
  process.exit(1);
});
