import {
  ContributingFactor,
  RiskAssessment,
  RiskRuleConfig,
  SeverityLevel,
  Zone,
  SensorReading,
  Detection,
} from './types';

export const DEFAULT_RISK_CONFIG: RiskRuleConfig = {
  ppe_violation: 25,
  restricted_zone: 35,
  machine_proximity: 20,
  abnormal_sensor: 10,
  high_occupancy: 10,
  historical_zone_penalty: 5,
};

export class IndustrialRiskEngine {
  private config: RiskRuleConfig;
  private readonly ruleVersion = '2026.1-OSHA-ISO45001-ALPHA';

  constructor(customConfig?: Partial<RiskRuleConfig>) {
    this.config = { ...DEFAULT_RISK_CONFIG, ...customConfig };
  }

  public getConfig(): RiskRuleConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<RiskRuleConfig>): RiskRuleConfig {
    this.config = { ...this.config, ...newConfig };
    return this.getConfig();
  }

  public getSeverityLevel(score: number): SeverityLevel {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculates explainable risk assessment for a specific zone based on detections,
   * sensor telemetry, occupancy, and historical zone factors.
   */
  public evaluateZoneRisk(
    zone: Zone,
    recentDetections: Detection[],
    sensors: SensorReading[],
    historicalIncidentCount: number = 0
  ): RiskAssessment {
    const factors: ContributingFactor[] = [];
    let rawScore = 0;

    // 1. PPE Violations
    const ppeViolations = recentDetections.filter(
      (d) => d.zone_id === zone.id && d.event_type === 'ppe_violation'
    );
    if (ppeViolations.length > 0) {
      // Debounced factor contribution (max 100% of weight, scaled if multiple)
      const count = Math.min(ppeViolations.length, 3);
      const contribution = Math.min(
        this.config.ppe_violation * (1 + (count - 1) * 0.25),
        this.config.ppe_violation * 1.5
      );
      rawScore += contribution;

      const missingItems = Array.from(
        new Set(ppeViolations.flatMap((v) => v.evidence.missing_ppe || ['PPE']))
      );
      factors.push({
        factor: 'PPE Non-Compliance',
        weight: this.config.ppe_violation,
        contribution: Math.round(contribution * 10) / 10,
        evidence: `${count} observable instance(s) lacking required gear: [${missingItems.join(', ')}]`,
      });
    }

    // 2. Restricted Zone Breaches
    const zoneBreaches = recentDetections.filter(
      (d) => d.zone_id === zone.id && d.event_type === 'restricted_zone_breach'
    );
    if (zoneBreaches.length > 0) {
      const contribution = this.config.restricted_zone;
      rawScore += contribution;
      factors.push({
        factor: 'Restricted Hazard Boundary Breach',
        weight: this.config.restricted_zone,
        contribution,
        evidence: `${zoneBreaches.length} unauthorized polygon intrusion(s) in active hazardous zone.`,
      });
    }

    // 3. Unsafe Machine Proximity
    const proximityEvents = recentDetections.filter(
      (d) => d.zone_id === zone.id && d.event_type === 'machine_proximity'
    );
    if (proximityEvents.length > 0) {
      const contribution = this.config.machine_proximity;
      rawScore += contribution;
      factors.push({
        factor: 'Dangerous Machine Proximity',
        weight: this.config.machine_proximity,
        contribution,
        evidence: `Worker detected within 1.2m pinch/arc envelope of heavy machinery.`,
      });
    }

    // 4. Abnormal Sensor Telemetry
    const criticalSensors = sensors.filter(
      (s) => s.zone_id === zone.id && (s.status === 'CRITICAL' || s.status === 'ELEVATED')
    );
    if (criticalSensors.length > 0) {
      const criticalCount = criticalSensors.filter((s) => s.status === 'CRITICAL').length;
      const elevatedCount = criticalSensors.length - criticalCount;
      const contribution = Math.min(
        this.config.abnormal_sensor * (criticalCount * 1.0 + elevatedCount * 0.5),
        this.config.abnormal_sensor * 2.0
      );
      rawScore += contribution;

      const sensorSummary = criticalSensors
        .map((s) => `${s.sensor_type}: ${s.numeric_value}${s.unit} (${s.status})`)
        .join('; ');

      factors.push({
        factor: 'Abnormal Environmental Telemetry',
        weight: this.config.abnormal_sensor,
        contribution: Math.round(contribution * 10) / 10,
        evidence: sensorSummary,
      });
    }

    // 5. Occupancy Ratio
    if (zone.max_occupancy > 0 && zone.current_occupancy > zone.max_occupancy) {
      const excessRatio = (zone.current_occupancy - zone.max_occupancy) / zone.max_occupancy;
      const contribution = Math.min(
        this.config.high_occupancy * (1 + excessRatio),
        this.config.high_occupancy * 1.5
      );
      rawScore += contribution;
      factors.push({
        factor: 'Occupancy Threshold Exceeded',
        weight: this.config.high_occupancy,
        contribution: Math.round(contribution * 10) / 10,
        evidence: `Zone occupancy at ${zone.current_occupancy}/${zone.max_occupancy} workers (+${Math.round(excessRatio * 100)}% over safe limit).`,
      });
    }

    // 6. Historical Zone Penalty
    if (historicalIncidentCount > 0) {
      const penalty = Math.min(historicalIncidentCount * 3, this.config.historical_zone_penalty * 2);
      rawScore += penalty;
      factors.push({
        factor: 'Historical Incident Vulnerability',
        weight: this.config.historical_zone_penalty,
        contribution: penalty,
        evidence: `${historicalIncidentCount} recorded incident(s) in this sector over prior 30 days.`,
      });
    }

    // Clamp score to 0 - 100
    const finalScore = Math.min(Math.max(Math.round(rawScore), 0), 100);
    const severity = this.getSeverityLevel(finalScore);

    // Contextual recommendations
    const recommendations = this.generateRecommendations(severity, factors);

    return {
      id: `RA-${zone.id}-${Date.now()}`,
      zone_id: zone.id,
      zone_name: zone.name,
      risk_score: finalScore,
      severity,
      factors,
      rule_version: this.ruleVersion,
      formula_used: `R = min(100, Σ(Factor_i * Weight_i) + HistoryAdjustment) [v${this.ruleVersion}]`,
      recommendations,
      calculated_at: new Date().toISOString(),
      demo_mode: recentDetections.some((d) => d.demo_mode),
    };
  }

  private generateRecommendations(
    severity: SeverityLevel,
    factors: ContributingFactor[]
  ): string[] {
    const recs: string[] = [];

    const hasPPE = factors.some((f) => f.factor.includes('PPE'));
    const hasBreach = factors.some((f) => f.factor.includes('Restricted'));
    const hasMachine = factors.some((f) => f.factor.includes('Machine'));
    const hasSensor = factors.some((f) => f.factor.includes('Telemetry'));
    const hasOccupancy = factors.some((f) => f.factor.includes('Occupancy'));

    if (severity === 'CRITICAL') {
      recs.push('IMMEDIATE ACTION: Halt non-essential work in this zone and dispatch floor supervisor.');
      if (hasBreach) recs.push('Enforce physical interlock barricade check and verify safety perimeter badge scans.');
      if (hasPPE) recs.push('Require immediate worker PPE donning before machine reactivation.');
      if (hasSensor) recs.push('Verify ventilation scrubber and emergency thermal shutoff threshold valves.');
    } else if (severity === 'HIGH') {
      recs.push('PRIORITY: Floor supervisor must conduct a targeted 5-minute safety spot-check.');
      if (hasPPE) recs.push('Audit shift gear allocation and replenish high-visibility vests / ANSI hardhats.');
      if (hasMachine) recs.push('Verify machine light-curtain sensor calibration and perimeter buffer tape.');
    } else if (severity === 'MEDIUM') {
      recs.push('MONITOR: Observe zone telemetry during the next shift handover.');
      if (hasOccupancy) recs.push('Stagger shift staging to avoid worker clustering around material intake.');
      recs.push('Review near-miss reporting log with lead technician.');
    } else {
      recs.push('NORMAL: Maintain scheduled housekeeping and standard PPE spot checks.');
      recs.push('Operational parameters within ISO 45001 tolerance envelopes.');
    }

    return recs;
  }
}

export const riskEngine = new IndustrialRiskEngine();
