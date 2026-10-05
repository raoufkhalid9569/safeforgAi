import React, { useState, useRef, useEffect } from 'react';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Database,
} from 'lucide-react';
import { api } from '../../services/api';
import { Zone } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source_data?: any;
  provider?: string;
  is_fallback?: boolean;
}

interface CopilotViewProps {
  zones: Zone[];
  selectedZoneId?: string;
  onSelectTab: (tab: string) => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({
  zones,
  selectedZoneId = 'welding-zone-b',
  onSelectTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: `### SafeForge Industrial Safety Copilot Online

I am your EHS intelligence assistant, grounded in **OSHA 1910** regulations and **ISO 45001** occupational safety frameworks.

I have direct access to your live factory floor sensors, optical vision detections, active alerts, and incident records.

**How can I assist your safety inspection today?**`,
      timestamp: new Date().toLocaleTimeString(),
      provider: 'SafeForge Hybrid Engine',
      is_fallback: false,
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.askCopilot({
        message: textToSend,
        context_zone_id: selectedZoneId,
      });

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString(),
        source_data: res.source_data,
        provider: res.provider,
        is_fallback: res.is_fallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Copilot request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Encountered an operational error executing query. Please verify server connectivity.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const suggestedQuestions = [
    'Why is the welding zone currently high risk?',
    'Which unresolved critical alerts require review?',
    'Summarize today shift safety performance',
    'Generate an incident report for INC-2026-041',
    'What preventive actions should the EHS team take right now?',
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Safety Copilot & Contextual Reasoning
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounded in active telemetry, optical violations, risk rule invariants, and ISO 45001 safety mandates.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded flex items-center gap-1.5">
            <BotMessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dual Pipeline (Gemini 3.8 Flash + Rule Engine)</span>
          </span>
        </div>
      </div>

      {/* Suggested Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0">
          PROMPTS:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white rounded shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-2xl rounded p-4 space-y-2 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-900/40 text-cyan-100 border border-cyan-700/50'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5 mb-1.5">
                <span className="font-semibold uppercase text-slate-300">
                  {msg.sender === 'user' ? 'EHS Professional' : 'SafeForge Copilot'}
                </span>
                <div className="flex items-center gap-2">
                  {msg.provider && (
                    <span className="text-[9px] px-1 bg-slate-950 text-cyan-300 border border-slate-800">
                      {msg.provider}
                    </span>
                  )}
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {/* Message Content Rendered */}
              <div className="whitespace-pre-wrap font-sans text-xs space-y-1">
                {msg.text}
              </div>

              {/* Collapsible Source Data Attribution */}
              {msg.source_data && (
                <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-[11px]">
                  <button
                    onClick={() => toggleSource(msg.id)}
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Database className="w-3 h-3" />
                    <span>
                      {expandedSources[msg.id]
                        ? 'Hide Retrieved Application Context'
                        : 'Inspect Retrieved Grounded Data Sources'}
                    </span>
                    {expandedSources[msg.id] ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {expandedSources[msg.id] && (
                    <div className="mt-2 p-2.5 bg-slate-950 rounded border border-slate-800/80 text-[10px] text-slate-300 space-y-1.5 overflow-x-auto">
                      <div>
                        <span className="text-slate-500 uppercase">Active Alerts Queried:</span>
                        <div className="text-slate-200">
                          {msg.source_data.retrieved_alerts?.map((a: any) => `[${a.severity}] ${a.id} `).join(' · ') || 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase">Sensors Sampled:</span>
                        <div className="text-slate-200">
                          {msg.source_data.retrieved_sensors?.map((s: any) => `${s.type}: ${s.value}${s.unit}`).join(' · ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-slate-900 border border-slate-800 rounded p-4 text-xs font-mono text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Grounded safety intelligence engine reasoning across database invariants...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask SafeForge safety advisor (e.g., 'Why is the welding zone high risk?')..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono rounded focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          <span>Ask Copilot</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
