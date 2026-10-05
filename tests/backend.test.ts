import { db } from '../server/db';
import { IndustrialRiskEngine, DEFAULT_RISK_CONFIG } from '../server/risk-engine';
import { ModularVisionService } from '../server/vision-service';
import { PredictiveRiskService } from '../server/prediction-service';
import { SafeForgeCopilotService } from '../server/copilot-service';
import { Detection, Zone, SensorReading } from '../server/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log(' SafeForge AI Test Suite Execution');
  console.log('========================================\n');

  // --- 1. Database & Initial Seed Tests ---
  console.log('Suite 1: Database & Seed Integrity');
  db.seedInitialData();
  const zones = db.getZones();
  assert(zones.length === 6, 'Should seed exactly 6 industrial zones', `Found ${zones.length}`);
  assert(zones.some((z) => z.id === 'welding-zone-b'), 'Welding Zone B exists');
  assert(zones.some((z) => z.id === 'machine-ops-c'), 'Machine Operations C exists');

  const alerts = db.getAlerts();
  assert(alerts.length >= 4, 'Should have initial seeded alerts', `Found ${alerts.length}`);
  const criticalAlert = alerts.find((a) => a.severity === 'CRITICAL');
  assert(criticalAlert !== undefined, 'Has at least one critical alert initially');

  const dashboard = db.getDashboardSummary();
  assert(dashboard.overall_safety_score > 0 && dashboard.overall_safety_score <= 100, 'Overall safety score within [1, 100]');
  assert(dashboard.zone_risk_matrix.length === 6, 'Zone risk matrix matches all 6 zones');
  assert(dashboard.active_alerts_count.total === alerts.filter((a) => a.status !== 'RESOLVED').length, 'Active alerts count strictly equals unresolved alerts in DB');

  // --- 2. Risk Engine Tests ---
  console.log('\nSuite 2: Industrial Risk Engine & Score Bounds');
  const engine = new IndustrialRiskEngine();

  // Test severity thresholds
  assert(engine.getSeverityLevel(0) === 'LOW', 'Score 0 is LOW');
  assert(engine.getSeverityLevel(24) === 'LOW', 'Score 24 is LOW');
  assert(engine.getSeverityLevel(25) === 'MEDIUM', 'Score 25 is MEDIUM');
  assert(engine.getSeverityLevel(49) === 'MEDIUM', 'Score 49 is MEDIUM');
  assert(engine.getSeverityLevel(50) === 'HIGH', 'Score 50 is HIGH');
  assert(engine.getSeverityLevel(74) === 'HIGH', 'Score 74 is HIGH');
  assert(engine.getSeverityLevel(75) === 'CRITICAL', 'Score 75 is CRITICAL');
  assert(engine.getSeverityLevel(100) === 'CRITICAL', 'Score 100 is CRITICAL');

  const sampleZone: Zone = {
    id: 'test-zone',
    name: 'Test Hazardous Bay',
    zone_type: 'Test',
    hazard_level: 'HIGH',
    restricted: true,
    layout_geometry: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
    area_sqm: 100,
    max_occupancy: 2,
    current_occupancy: 4, // Over occupancy (+100%)
    supervisor: 'Test Supervisor',
    active_risk_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleDetection: Detection = {
    id: 'DET-T1',
    event_type: 'restricted_zone_breach',
    zone_id: 'test-zone',
    confidence: 0.95,
    source_type: 'synthetic_stream',
    evidence: {
      missing_ppe: ['helmet'],
      description: 'Breach test',
    },
    observed_at: new Date().toISOString(),
    model_name: 'test-model',
    demo_mode: true,
  };

  const sampleSensor: SensorReading = {
    id: 'SNS-T1',
    zone_id: 'test-zone',
    sensor_type: 'temperature',
    numeric_value: 45.0,
    unit: '°C',
    status: 'CRITICAL',
    threshold_warning: 35,
    threshold_critical: 40,
    observed_at: new Date().toISOString(),
    demo_mode: true,
  };

  const assessment = engine.evaluateZoneRisk(sampleZone, [sampleDetection], [sampleSensor], 1);
  assert(assessment.risk_score >= 50, 'Composite score reflects breach, critical sensor, and over-occupancy', `Score: ${assessment.risk_score}`);
  assert(assessment.factors.length >= 3, 'Includes all contributing factors with evidence', `Count: ${assessment.factors.length}`);
  assert(assessment.recommendations.length > 0, 'Generates actionable recommendations');
  assert(assessment.risk_score <= 100, 'Score is clamped to 100 maximum');

  // Test custom weights config update
  engine.updateConfig({ ppe_violation: 40 });
  assert(engine.getConfig().ppe_violation === 40, 'Config successfully updates risk weights');

  // --- 3. Computer Vision & Ray Casting Polygon Tests ---
  console.log('\nSuite 3: Computer Vision & Geometry Overlap');
  const vision = new ModularVisionService();

  // Ray-casting algorithm polygon check
  const poly = [
    { x: 10, y: 10 },
    { x: 50, y: 10 },
    { x: 50, y: 50 },
    { x: 10, y: 50 },
  ];

  assert(vision.isPointInPolygon({ x: 30, y: 30 }, poly) === true, 'Point inside polygon returns true');
  assert(vision.isPointInPolygon({ x: 5, y: 5 }, poly) === false, 'Point outside polygon returns false');
  assert(vision.isPointInPolygon({ x: 70, y: 70 }, poly) === false, 'Point far outside returns false');

  // Debounce check
  assert(vision.shouldDebounce('welding-zone-b', 'ppe_violation') === false, 'First event does not debounce');
  assert(vision.shouldDebounce('welding-zone-b', 'ppe_violation') === true, 'Immediate subsequent event is debounced');

  // Media analysis
  const weldingZone = db.getZone('welding-zone-b')!;
  const visionResult = await vision.analyzeMedia(
    { media_type: 'image', zone_id: weldingZone.id, scenario_id: 'welding_breach' },
    weldingZone
  );
  assert(visionResult.annotated_boxes.length > 0, 'Returns annotated bounding boxes');
  assert(visionResult.engine_info.inference_type === 'simulated_heuristic', 'Honest status for demo mode heuristic adapter');

  // --- 4. Alert Lifecycle (New -> Acknowledged -> Resolved) ---
  console.log('\nSuite 4: Alert Lifecycle & Audit Trail');
  const newAlert = db.createAlert({
    zone_id: weldingZone.id,
    zone_name: weldingZone.name,
    severity: 'HIGH',
    risk_score: 65,
    status: 'NEW',
    title: 'Test Spindle Alert',
    description: 'Unit test alert',
    contributing_factors: [],
    recommended_actions: ['Inspect spindle'],
  });
  assert(newAlert.status === 'NEW', 'Alert created in NEW state');

  const ackAlert = db.acknowledgeAlert(newAlert.id, 'Tester Lead', 'Investigating now');
  assert(ackAlert?.status === 'ACKNOWLEDGED', 'Alert transitions to ACKNOWLEDGED');
  assert(ackAlert?.acknowledged_by === 'Tester Lead', 'Records acknowledging actor');

  const resolvedAlert = db.resolveAlert(newAlert.id, 'Tester Lead', 'Sensor recalibrated');
  assert(resolvedAlert?.status === 'RESOLVED', 'Alert transitions to RESOLVED');
  assert(resolvedAlert?.resolution_notes === 'Sensor recalibrated', 'Preserves resolution notes');

  // Verify resolution reflects in dashboard
  const updatedDash = db.getDashboardSummary();
  assert(
    updatedDash.active_alerts_count.total === db.getAlerts().filter((a) => a.status !== 'RESOLVED').length,
    'Resolved alert is excluded from active count'
  );

  // --- 5. Incident Management Tests ---
  console.log('\nSuite 5: Incident Management & Classification');
  const createdIncident = db.createIncident({
    zone_id: weldingZone.id,
    zone_name: weldingZone.name,
    incident_type: 'near_miss',
    severity: 'MEDIUM',
    title: 'Trip Hazard Near Feed Roller',
    description: 'Pneumatic line loose across aisle',
    contributing_factors: ['Loose hose'],
    corrective_actions: ['Installed overhead hose clamp'],
    status: 'INVESTIGATING',
    reported_by: 'Inspector Dave',
    occurred_at: new Date().toISOString(),
    demo_mode: true,
  });
  assert(createdIncident.id.startsWith('INC-2026-'), 'Incident assigned formal ID number');
  assert(db.getIncident(createdIncident.id) !== undefined, 'Incident persisted in store');

  // --- 6. Predictive Analytics Model Tests ---
  console.log('\nSuite 6: Predictive Analytics & Model Metrics');
  const predictor = new PredictiveRiskService();
  const forecast = predictor.generateForecast(weldingZone);

  assert(forecast.probability_score >= 0 && forecast.probability_score <= 100, 'Forecast probability between 0 and 100%');
  assert(forecast.forecast_horizon_hours === 4, 'Forecast horizon is 4 hours');
  assert(forecast.evaluation_metrics.roc_auc > 0.8, 'Model reports evaluated ROC-AUC metric > 0.8');
  assert(forecast.contributing_features.length >= 4, 'Provides feature importance breakdown');
  assert(forecast.is_synthetic === true, 'Transparently marks synthetic dataset training');

  // Trend history
  const trend = predictor.getHistoricalRiskTrend(weldingZone.id);
  assert(trend.length >= 24, 'Returns 24 hours of trend data for charts');

  // --- 7. Copilot Deterministic Fallback Tests ---
  console.log('\nSuite 7: AI Copilot Fallback & Fact Grounding');
  const copilot = new SafeForgeCopilotService();

  const whyRiskResponse = await copilot.processChat({
    message: 'Why is the welding zone currently high risk?',
    context_zone_id: 'welding-zone-b',
  });
  assert(whyRiskResponse.answer.length > 50, 'Generates comprehensive answer');
  assert(whyRiskResponse.answer.includes('Welding Bay B'), 'Grounds answer in actual zone name');
  assert(whyRiskResponse.source_data.retrieved_zones !== undefined, 'Attaches transparent retrieved source data');

  const shiftSummary = await copilot.processChat({
    message: 'Summarize today shift safety performance',
  });
  assert(shiftSummary.answer.includes('Shift Safety Summary'), 'Answers shift summary request with live metrics');

  // --- Summary ---
  console.log('\n========================================');
  console.log(` Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
