import React, { useState } from 'react';
import {
  BellRing,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileText,
  UserCheck,
  AlertTriangle,
  X,
  Send,
} from 'lucide-react';
import { api } from '../../services/api';
import { Alert, SeverityLevel, Zone } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface AlertsCenterViewProps {
  alerts: Alert[];
  zones: Zone[];
  onAlertUpdated: () => void;
  onSelectTab: (tab: string) => void;
}

export const AlertsCenterView: React.FC<AlertsCenterViewProps> = ({
  alerts,
  zones,
  onAlertUpdated,
  onSelectTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  // Modal states
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [actionType, setActionType] = useState<'acknowledge' | 'resolve' | null>(null);
  const [actorName, setActorName] = useState<string>('Marcus Vance (EHS Supervisor)');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (zoneFilter !== 'ALL' && a.zone_id !== zoneFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchCode = a.alert_code.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCode) return false;
    }
    return true;
  });

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    setIsSubmitting(true);
    try {
      await api.acknowledgeAlert(selectedAlert.id, actorName, actionNotes || 'Acknowledged by EHS Supervisor on floor');
      setActionType(null);
      setSelectedAlert(null);
      setActionNotes('');
      onAlertUpdated();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert || !actionNotes.trim()) {
      alert('Mandatory resolution notes are required before closing an industrial safety alert.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.resolveAlert(selectedAlert.id, actorName, actionNotes);
      setActionType(null);
      setSelectedAlert(null);
      setActionNotes('');
      onAlertUpdated();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Safety Invariant & Alert Lifecycle Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical violation triage, supervisor acknowledgement verification, and ISO 45001 resolution audit.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
            TOTAL RECORDS: {alerts.length}
          </span>
          <span className="px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 rounded font-semibold">
            ACTIVE: {alerts.filter((a) => a.status !== 'RESOLVED').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, title, gear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW (Unacknowledged)</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Factory Sectors</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts Table / Cards */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded font-mono text-xs text-slate-400">
            No safety alerts match the active search criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 bg-slate-900/90 border rounded transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                alert.status === 'NEW' && alert.severity === 'CRITICAL'
                  ? 'border-red-500/60 shadow-sm shadow-red-950/50'
                  : alert.status === 'NEW'
                  ? 'border-slate-700'
                  : 'border-slate-800 opacity-90'
              }`}
            >
              {/* Alert Content */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <RiskBadge severity={alert.severity} size="sm" />
                  <span className="font-bold text-slate-300">{alert.alert_code}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-cyan-400 font-semibold">{alert.zone_name}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">
                    {new Date(alert.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span
                    className={`font-semibold ${
                      alert.status === 'NEW'
                        ? 'text-red-400 animate-pulse'
                        : alert.status === 'ACKNOWLEDGED'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    STATUS: {alert.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white tracking-wide">{alert.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.description}</p>

                {/* Contributing factors badges */}
                {alert.contributing_factors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {alert.contributing_factors.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded"
                      >
                        {f.factor} (+{f.contribution} pts)
                      </span>
                    ))}
                  </div>
                )}

                {/* Audit Attribution */}
                {alert.acknowledged_by && (
                  <div className="text-[11px] font-mono text-slate-400 pt-1">
                    Acknowledged by <span className="text-slate-200">{alert.acknowledged_by}</span> at{' '}
                    {new Date(alert.acknowledged_at || '').toLocaleTimeString()}
                  </div>
                )}
                {alert.resolution_notes && (
                  <div className="text-[11px] font-mono text-emerald-400/90 pt-0.5">
                    Resolution: "{alert.resolution_notes}" (by {alert.resolved_by})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                {alert.status === 'NEW' && (
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setActionType('acknowledge');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded transition-colors cursor-pointer w-full text-center"
                  >
                    Acknowledge
                  </button>
                )}

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setActionType('resolve');
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs rounded transition-colors cursor-pointer w-full text-center"
                  >
                    Resolve Alert
                  </button>
                )}

                {alert.status === 'RESOLVED' && (
                  <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Closed & Audited</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Acknowledge / Resolve Modal Dialog */}
      {selectedAlert && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase">
                {actionType === 'acknowledge' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Supervisor Alert Acknowledgement</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Formal Hazard Resolution & Closure</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <span className="text-slate-400">Target Incident Alert:</span>
              <p className="text-white font-semibold">
                [{selectedAlert.alert_code}] {selectedAlert.title}
              </p>
              <span className="text-slate-400 text-[11px] block mt-1">
                Sector: {selectedAlert.zone_name}
              </span>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Responding Supervisor / Inspector:</label>
                <input
                  type="text"
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {actionType === 'acknowledge' ? 'Acknowledgement Notes (Optional):' : 'Mandatory Resolution Notes:'}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === 'acknowledge'
                      ? 'e.g. Dispatched technician to inspect machine curtain...'
                      : 'e.g. Worker re-donned helmet and completed PPE safety sign-off sheet.'
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400 font-sans text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'acknowledge' ? handleAcknowledge : handleResolve}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? 'Saving Record...'
                  : actionType === 'acknowledge'
                  ? 'Confirm Acknowledgement'
                  : 'Commit Resolution & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
