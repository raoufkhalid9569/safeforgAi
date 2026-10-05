import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Alert, DashboardSummary, Incident, Zone } from './types';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MonitoringView } from './components/monitoring/MonitoringView';
import { RiskIntelligenceView } from './components/risk/RiskIntelligenceView';
import { FactoryZoneMapView } from './components/zones/FactoryZoneMapView';
import { AlertsCenterView } from './components/alerts/AlertsCenterView';
import { PredictionsView } from './components/predictions/PredictionsView';
import { CopilotView } from './components/copilot/CopilotView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { SettingsView } from './components/settings/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('welding-zone-b');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
    // Poll data every 10 seconds
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      const [sumRes, zonesRes, alertsRes, incidentsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getZones(),
        api.getAlerts(),
        api.getIncidents(),
      ]);
      setSummary(sumRes);
      setZones(zonesRes);
      setAlerts(alertsRes);
      setIncidents(incidentsRes);
    } catch (err) {
      console.error('Failed to sync platform state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDemoScenario = async () => {
    setIsTriggering(true);
    setDemoBanner('Running end-to-end hackathon demo scenario: Worker in Welding Zone B without helmet...');
    try {
      const res = await api.triggerScenario('welding_breach');
      await loadAllData();
      setSelectedZoneId('welding-zone-b');
      setDemoBanner(
        `✓ Scenario complete! Restricted zone breach detected in Welding Bay B. Risk score recalculated to ${res.assessment?.risk_score || 78}/100 [CRITICAL]. Persistent alert created in Alerts Center.`
      );
      setTimeout(() => setDemoBanner(null), 7000);
    } catch (err) {
      console.error('Demo scenario failed:', err);
      setDemoBanner('Scenario trigger failed. Please check network logs.');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleResetData = async () => {
    try {
      await api.resetDemoData();
      await loadAllData();
      setDemoBanner('✓ Database restored to initial demonstration state.');
      setTimeout(() => setDemoBanner(null), 4000);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const activeAlertCount = alerts.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        summary={summary}
        onTriggerDemo={handleTriggerDemoScenario}
        onResetData={handleResetData}
        isTriggering={isTriggering}
        onSelectTab={setActiveTab}
      />

      {/* Demo Scenario Notification Banner */}
      {demoBanner && (
        <div className="bg-cyan-950 border-b border-cyan-500/40 text-cyan-200 px-4 py-2 text-xs font-mono flex items-center justify-between animate-fadeIn z-20">
          <span>{demoBanner}</span>
          <button
            onClick={() => setDemoBanner(null)}
            className="text-cyan-400 hover:text-white ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Body with Sidebar + Tab View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeAlertCount={activeAlertCount}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              loading={loading}
              onSelectTab={setActiveTab}
              onSelectZone={(zId) => {
                setSelectedZoneId(zId);
                setActiveTab('zones');
              }}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringView
              zones={zones}
              selectedZoneId={selectedZoneId}
              onAlertCreated={loadAllData}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'risk-intelligence' && (
            <RiskIntelligenceView
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'zones' && (
            <FactoryZoneMapView
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsCenterView
              alerts={alerts}
              zones={zones}
              onAlertUpdated={loadAllData}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'predictions' && (
            <PredictionsView
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'copilot' && (
            <CopilotView
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              zones={zones}
              onIncidentCreated={loadAllData}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onResetData={handleResetData}
              onTriggerDemo={handleTriggerDemoScenario}
              isTriggering={isTriggering}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
