export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CLOSED';
export type IncidentType = 'near_miss' | 'first_aid' | 'equipment_damage' | 'restricted_entry_hazard' | 'ppe_noncompliance';

export interface Point {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  name: string;
  zone_type: string;
  hazard_level: SeverityLevel;
  restricted: boolean;
  layout_geometry: Point[];
  area_sqm: number;
  max_occupancy: number;
  current_occupancy: number;
  supervisor: string;
  active_risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface BoundingBox {
  label: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  confidence: number;
  has_helmet?: boolean;
  has_vest?: boolean;
}

export interface Detection {
  id: string;
  event_type: 'ppe_violation' | 'restricted_zone_breach' | 'machine_proximity' | 'normal_observation';
  zone_id: string;
  confidence: number;
  source_type: 'uploaded_image' | 'uploaded_video' | 'synthetic_stream';
  evidence: {
    missing_ppe?: string[];
    bounding_boxes?: BoundingBox[];
    polygon_overlap?: boolean;
    worker_id?: string;
    description: string;
  };
  observed_at: string;
  model_name: string;
  demo_mode: boolean;
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  contribution: number;
  evidence: string;
}

export interface Alert {
  id: string;
  alert_code: string;
  detection_id?: string;
  zone_id: string;
  zone_name: string;
  severity: SeverityLevel;
  risk_score: number;
  status: AlertStatus;
  title: string;
  description: string;
  contributing_factors: ContributingFactor[];
  recommended_actions: string[];
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface Incident {
  id: string;
  incident_number: string;
  zone_id: string;
  zone_name: string;
  detection_id?: string;
  incident_type: IncidentType;
  severity: SeverityLevel;
  title: string;
  description: string;
  contributing_factors: string[];
  corrective_actions: string[];
  status: IncidentStatus;
  reported_by: string;
  investigator?: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  demo_mode: boolean;
}

export interface SensorReading {
  id: string;
  zone_id: string;
  sensor_type: 'temperature' | 'vibration' | 'noise' | 'air_quality_voc' | 'humidity';
  numeric_value: number;
  unit: string;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  threshold_warning: number;
  threshold_critical: number;
  observed_at: string;
  demo_mode: boolean;
}

export interface RiskRuleConfig {
  ppe_violation: number;
  restricted_zone: number;
  machine_proximity: number;
  abnormal_sensor: number;
  high_occupancy: number;
  historical_zone_penalty: number;
}

export interface RiskAssessment {
  id: string;
  zone_id: string;
  zone_name: string;
  risk_score: number;
  severity: SeverityLevel;
  factors: ContributingFactor[];
  rule_version: string;
  formula_used: string;
  recommendations: string[];
  calculated_at: string;
  demo_mode: boolean;
}

export interface PredictionHorizon {
  zone_id: string;
  zone_name: string;
  probability_score: number;
  risk_category: SeverityLevel;
  forecast_horizon_hours: number;
  confidence_interval: [number, number];
  contributing_features: Array<{
    feature: string;
    importance_pct: number;
    value: string | number;
    impact_description: string;
  }>;
  model_name: string;
  model_version: string;
  evaluation_metrics: {
    roc_auc: number;
    pr_auc: number;
    f1_score: number;
    brier_score: number;
    training_sample_size: number;
    split_strategy: string;
  };
  generated_at: string;
  is_synthetic: boolean;
  warnings?: string[];
}

export interface DashboardSummary {
  overall_safety_score: number;
  overall_risk_level: SeverityLevel;
  active_alerts_count: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  ppe_compliance_rate_pct: number;
  violations_today_count: number;
  high_risk_zones: Array<{
    id: string;
    name: string;
    score: number;
    severity: SeverityLevel;
  }>;
  recent_incidents: Incident[];
  recent_alerts: Alert[];
  zone_risk_matrix: Array<{
    id: string;
    name: string;
    score: number;
    severity: SeverityLevel;
    active_alerts: number;
    occupancy: number;
    max_occupancy: number;
  }>;
  risk_trend_24h: Array<{
    timestamp: string;
    avg_risk: number;
    critical_events: number;
  }>;
  model_status: {
    vision_engine: string;
    vision_mode: 'active_live' | 'demo_heuristic';
    prediction_engine: string;
    copilot_provider: string;
    copilot_mode: 'gemini_active' | 'deterministic_fallback';
    database: string;
  };
  last_updated: string;
}

export interface Scenario {
  id: string;
  title: string;
  zone_id: string;
  media_type: 'image' | 'video';
  hazard_type: SeverityLevel;
  description: string;
  recommended_action: string;
}
