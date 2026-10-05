import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { Incident, SeverityLevel, Zone } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface IncidentsViewProps {
  incidents: Incident[];
  zones: Zone[];
  onIncidentCreated: () => void;
  onSelectTab: (tab: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  zones,
  onIncidentCreated,
  onSelectTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // New incident modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    zone_id: 'welding-zone-b',
    incident_type: 'near_miss',
    severity: 'HIGH' as SeverityLevel,
    title: '',
    description: '',
    contributing_factors: '',
    corrective_actions: '',
    reported_by: 'Marcus Vance (Lead Inspector)',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Printable report modal
  const [selectedIncidentForPrint, setSelectedIncidentForPrint] = useState<Incident | null>(null);

  const filtered = incidents.filter((inc) => {
    if (typeFilter !== 'ALL' && inc.incident_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchNum = inc.incident_number.toLowerCase().includes(q);
      const matchZone = inc.zone_name.toLowerCase().includes(q);
      if (!matchTitle && !matchNum && !matchZone) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert('Title and description are required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const factors = formData.contributing_factors
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const actions = formData.corrective_actions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createIncident({
        zone_id: formData.zone_id,
        incident_type: formData.incident_type as any,
        severity: formData.severity,
        title: formData.title,
        description: formData.description,
        contributing_factors: factors.length > 0 ? factors : ['Unspecified root condition'],
        corrective_actions: actions.length > 0 ? actions : ['Review standard operating protocol'],
        reported_by: formData.reported_by,
      });

      setShowCreateModal(false);
      setFormData({
        zone_id: 'welding-zone-b',
        incident_type: 'near_miss',
        severity: 'HIGH',
        title: '',
        description: '',
        contributing_factors: '',
        corrective_actions: '',
        reported_by: 'Marcus Vance (Lead Inspector)',
      });
      onIncidentCreated();
    } catch (err) {
      console.error('Failed to create incident:', err);
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
            Industrial Incident Log & Compliance Records
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal OSHA 300 / ISO 45001 log of near-misses, equipment anomalies, and root-cause corrective actions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Incident</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search incident number, keyword, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded focus:outline-none focus:border-cyan-400"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400 w-full sm:w-auto"
        >
          <option value="ALL">All Event Classifications</option>
          <option value="near_miss">Near Miss (No Injury)</option>
          <option value="equipment_damage">Equipment Damage</option>
          <option value="restricted_entry_hazard">Restricted Hazard Breach</option>
          <option value="ppe_noncompliance">PPE Non-Compliance</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-950/60">
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-400">{inc.incident_number}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">
                    {inc.incident_type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{inc.zone_name}</td>
                  <td className="py-3 px-4">
                    <RiskBadge severity={inc.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        inc.status === 'CLOSED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(inc.occurred_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedIncidentForPrint(inc)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Sheet</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Log Formal Safety Incident / Near-Miss</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Sector:</label>
                  <select
                    value={formData.zone_id}
                    onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Classification:</label>
                  <select
                    value={formData.incident_type}
                    onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400"
                  >
                    <option value="near_miss">Near Miss (No Injury)</option>
                    <option value="equipment_damage">Equipment Damage</option>
                    <option value="restricted_entry_hazard">Restricted Hazard Breach</option>
                    <option value="ppe_noncompliance">PPE Non-Compliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Severity Rating:</label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as SeverityLevel })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Reporting Officer:</label>
                  <input
                    type="text"
                    value={formData.reported_by}
                    onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Incident Headline / Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Optical light-curtain misalignment during robotic fixture swap"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Factual Incident Description:</label>
                <textarea
                  rows={3}
                  placeholder="Describe observed sequence of events, personnel involved, and physical containment status..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Root Contributing Factors (one per line):</label>
                <textarea
                  rows={2}
                  placeholder="Factor 1&#10;Factor 2"
                  value={formData.contributing_factors}
                  onChange={(e) => setFormData({ ...formData, contributing_factors: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Corrective Actions Mandated (one per line):</label>
                <textarea
                  rows={2}
                  placeholder="Action 1&#10;Action 2"
                  value={formData.corrective_actions}
                  onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Commit to Safety Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {selectedIncidentForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-950 rounded-lg max-w-3xl w-full p-8 space-y-6 shadow-2xl my-8 font-sans border border-slate-300">
            {/* Top Bar for Screen */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 print:hidden">
              <span className="font-mono text-xs uppercase font-bold text-slate-700">
                OSHA 1910 / ISO 45001 Official Safety Audit Document
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setSelectedIncidentForPrint(null)}
                  className="p-1.5 text-slate-600 hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    Industrial Safety Incident Report
                  </h1>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    SafeForge Industrial Facility · Heavy Manufacturing Sector 4
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-sm block">{selectedIncidentForPrint.incident_number}</span>
                  <span className="text-slate-600">
                    {new Date(selectedIncidentForPrint.occurred_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Incident Classification Grid */}
            <div className="grid grid-cols-3 gap-4 border p-3 rounded bg-slate-50 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">CLASSIFICATION</span>
                <span className="font-bold uppercase text-slate-900">
                  {selectedIncidentForPrint.incident_type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SECTOR LOCATION</span>
                <span className="font-bold text-slate-900">{selectedIncidentForPrint.zone_name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SEVERITY RATING</span>
                <span className="font-bold text-slate-900">{selectedIncidentForPrint.severity}</span>
              </div>
            </div>

            {/* Narrative */}
            <div className="space-y-1">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                Factual Incident Narrative
              </h2>
              <p className="text-xs leading-relaxed text-slate-800 p-3 border rounded bg-slate-50">
                {selectedIncidentForPrint.description}
              </p>
            </div>

            {/* Root Factors */}
            <div className="space-y-1">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                Root Contributing Factors
              </h2>
              <ul className="list-disc pl-5 text-xs space-y-1 text-slate-800">
                {selectedIncidentForPrint.contributing_factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Corrective Actions */}
            <div className="space-y-1">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                Mandated Corrective & Preventive Actions
              </h2>
              <ul className="list-disc pl-5 text-xs space-y-1 text-slate-800">
                {selectedIncidentForPrint.corrective_actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            {/* Sign-Off Block */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">REPORTED BY:</span>
                <span className="font-bold">{selectedIncidentForPrint.reported_by}</span>
                <div className="mt-4 border-b border-slate-400 w-3/4" />
                <span className="text-[10px] text-slate-500">Signature / Date</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">LEAD EHS INVESTIGATOR:</span>
                <span className="font-bold">
                  {selectedIncidentForPrint.investigator || 'Dr. Rebecca Chen (EHS Director)'}
                </span>
                <div className="mt-4 border-b border-slate-400 w-3/4" />
                <span className="text-[10px] text-slate-500">Approval Signature / Date</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
