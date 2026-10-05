import React from 'react';
import {
  LayoutDashboard,
  Video,
  Gauge,
  MapPin,
  BellRing,
  LineChart,
  BotMessageSquare,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlertCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Video, indicator: 'CV' },
    { id: 'risk-intelligence', label: 'Risk Intelligence', icon: Gauge },
    { id: 'zones', label: 'Factory Zone Map', icon: MapPin },
    {
      id: 'alerts',
      label: 'Alerts Center',
      icon: BellRing,
      count: activeAlertCount,
    },
    { id: 'predictions', label: 'Predictive Analytics', icon: LineChart, indicator: 'ML' },
    { id: 'copilot', label: 'AI Safety Copilot', icon: BotMessageSquare, indicator: 'AI' },
    { id: 'incidents', label: 'Incident Records', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Platform Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded transition-colors text-left cursor-pointer group ${
                isActive
                  ? 'bg-slate-800/90 text-cyan-300 border-l-2 border-cyan-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.indicator && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                      item.indicator === 'AI'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                        : item.indicator === 'ML'
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/50'
                        : 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                    }`}
                  >
                    {item.indicator}
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 font-semibold">
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Safety Compliance & Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="p-2.5 border border-slate-800 bg-slate-950/60 rounded text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>ISO 45001 / OSHA 1910</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Decision-support platform. Human verification mandatory prior to mechanical interventions.
          </p>
        </div>
      </div>
    </aside>
  );
};
