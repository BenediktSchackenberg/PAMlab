import { useState, useCallback } from 'react';
import type { Page, Workflow, WorkflowStep } from '../types';
import { connectors, getConnector, getAction } from '../data/connectors';
import { generateScript, generateTestScript } from '../services/workflowGenerator';

// ── Helpers ────────────────────────────────────────────────────────
let _stepId = 0;
const uid = () => `ws-${++_stepId}-${Date.now()}`;

const defaultWorkflow: Workflow = {
  name: '',
  description: '',
  trigger: 'manual',
  steps: [],
};

// ── Component ──────────────────────────────────────────────────────
export default function WorkflowWizard({ onNavigate, onLoadScript }: {
  onNavigate: (p: Page) => void;
  onLoadScript: (s: string) => void;
}) {
  const [wizard, setWizard] = useState<'config' | 'steps' | 'review'>('config');
  const [workflow, setWorkflow] = useState<Workflow>({ ...defaultWorkflow });
  const [addingStep, setAddingStep] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [stepParams, setStepParams] = useState<Record<string, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ── Step management ──────────────────────────────────────────────
  const addStep = useCallback(() => {
    if (!selectedConnector || !selectedAction) return;
    const action = getAction(selectedConnector, selectedAction);
    const step: WorkflowStep = {
      id: uid(),
      connectorId: selectedConnector,
      actionId: selectedAction,
      params: { ...stepParams },
      label: action?.name || '',
    };

    setWorkflow(prev => {
      const steps = [...prev.steps];
      if (editingIndex !== null) {
        steps[editingIndex] = step;
      } else {
        steps.push(step);
      }
      return { ...prev, steps };
    });

    // Reset
    setSelectedConnector('');
    setSelectedAction('');
    setStepParams({});
    setAddingStep(false);
    setEditingIndex(null);
  }, [selectedConnector, selectedAction, stepParams, editingIndex]);

  const removeStep = (index: number) => {
    setWorkflow(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    setWorkflow(prev => {
      const steps = [...prev.steps];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return prev;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...prev, steps };
    });
  };

  const editStep = (index: number) => {
    const step = workflow.steps[index];
    setSelectedConnector(step.connectorId);
    setSelectedAction(step.actionId);
    setStepParams({ ...step.params });
    setEditingIndex(index);
    setAddingStep(true);
  };

  // ── Export ────────────────────────────────────────────────────────
  const exportScript = (mode: 'production' | 'test') => {
    const script = mode === 'production'
      ? generateScript(workflow)
      : generateTestScript(workflow);
    onLoadScript(script);
    onNavigate('editor');
  };

  const downloadScript = () => {
    const script = generateScript(workflow);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase() || 'workflow'}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render: Config ───────────────────────────────────────────────
  const renderConfig = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">1. Workflow Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Workflow Name *</label>
            <input
              value={workflow.name}
              onChange={e => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Employee Onboarding"
              className="w-full max-w-lg bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input
              value={workflow.description}
              onChange={e => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What does this workflow do?"
              className="w-full max-w-lg bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Trigger</label>
            <select
              value={workflow.trigger}
              onChange={e => setWorkflow(prev => ({ ...prev, trigger: e.target.value as Workflow['trigger'] }))}
              className="w-full max-w-lg bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="manual">⚙️ Manual Execution</option>
              <option value="matrix42-ticket">🎫 Matrix42 Ticket Approved</option>
              <option value="servicenow-request">📋 ServiceNow Request</option>
              <option value="jira-request">🔷 Jira SM Request</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={() => setWizard('steps')}
        disabled={!workflow.name}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Next: Add Steps →
      </button>
    </div>
  );

  // ── Render: Steps ────────────────────────────────────────────────
  const renderSteps = () => {
    const connector = connectors.find(c => c.id === selectedConnector);
    const action = connector?.actions.find(a => a.id === selectedAction);

    return (
      <div className="space-y-6">
        {/* Current steps list */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">2. Workflow Steps</h3>

          {workflow.steps.length === 0 ? (
            <p className="text-gray-500 text-sm mb-4">No steps yet. Add your first step below.</p>
          ) : (
            <div className="space-y-2 mb-6">
              {workflow.steps.map((step, i) => {
                const c = getConnector(step.connectorId);
                const a = getAction(step.connectorId, step.actionId);
                return (
                  <div key={step.id} className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <span className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                      {i + 1}
                    </span>
                    <span className={`w-8 h-8 ${c?.color || 'bg-gray-600'} rounded-lg flex items-center justify-center text-sm shrink-0`}>
                      {c?.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-100 font-medium truncate">{step.label || a?.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c?.name} • {a?.method} {a?.path}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30">↑</button>
                      <button onClick={() => moveStep(i, 1)} disabled={i === workflow.steps.length - 1} className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30">↓</button>
                      <button onClick={() => editStep(i)} className="p-1.5 text-blue-400 hover:text-blue-300">✏️</button>
                      <button onClick={() => removeStep(i)} className="p-1.5 text-red-400 hover:text-red-300">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Step Form */}
          {addingStep ? (
            <div className="bg-gray-900 rounded-lg p-4 border border-blue-600/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-blue-400">{editingIndex !== null ? '✏️ Edit Step' : '➕ Add Step'}</h4>
                <button onClick={() => { setAddingStep(false); setEditingIndex(null); setSelectedConnector(''); setSelectedAction(''); setStepParams({}); }} className="text-gray-500 hover:text-gray-300 text-xs">Cancel</button>
              </div>

              {/* Connector selection */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">System</label>
                <div className="grid grid-cols-3 gap-2">
                  {connectors.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedConnector(c.id); setSelectedAction(''); setStepParams({}); }}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedConnector === c.id
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 ${c.color} rounded-md flex items-center justify-center text-xs`}>{c.icon}</span>
                        <span className="text-sm text-gray-200 font-medium">{c.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action selection */}
              {connector && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    {connector.actions.map(a => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedAction(a.id); setStepParams({}); }}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedAction === a.id
                            ? 'border-blue-500 bg-blue-600/10'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-sm text-gray-200 font-medium">{a.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parameters */}
              {action && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Parameters</label>
                  <div className="grid grid-cols-2 gap-3">
                    {action.params.map(p => (
                      <div key={p.id}>
                        <label className="block text-xs text-gray-400 mb-1">
                          {p.label} {p.required && <span className="text-red-400">*</span>}
                        </label>
                        {p.type === 'select' ? (
                          <select
                            value={stepParams[p.id] || p.default || ''}
                            onChange={e => setStepParams(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">— Select —</option>
                            {p.options?.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={p.type === 'number' ? 'number' : 'text'}
                            value={stepParams[p.id] || ''}
                            placeholder={p.placeholder}
                            onChange={e => setStepParams(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add button */}
              <button
                onClick={addStep}
                disabled={!selectedConnector || !selectedAction}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {editingIndex !== null ? '✏️ Update Step' : '➕ Add Step'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingStep(true)}
              className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-blue-500/50 rounded-lg text-gray-500 hover:text-blue-400 text-sm transition-colors"
            >
              ➕ Add Step
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setWizard('config')} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            ← Back
          </button>
          <button
            onClick={() => setWizard('review')}
            disabled={workflow.steps.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Review & Export →
          </button>
        </div>
      </div>
    );
  };

  // ── Render: Review ───────────────────────────────────────────────
  const renderReview = () => {
    const script = generateScript(workflow);
    const lineCount = script.split('\n').length;

    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">3. Review & Export</h3>

          {/* Workflow summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-lg font-bold text-gray-100">{workflow.name}</div>
              <div className="text-xs text-gray-500 mt-1">{workflow.description || 'No description'}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl mb-1">🔗</div>
              <div className="text-lg font-bold text-gray-100">{workflow.steps.length} Steps</div>
              <div className="text-xs text-gray-500 mt-1">{[...new Set(workflow.steps.map(s => getConnector(s.connectorId)?.name))].join(', ')}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl mb-1">📄</div>
              <div className="text-lg font-bold text-gray-100">{lineCount} Lines</div>
              <div className="text-xs text-gray-500 mt-1">PowerShell script</div>
            </div>
          </div>

          {/* Steps timeline */}
          <div className="space-y-1 mb-6">
            {workflow.steps.map((step, i) => {
              const c = getConnector(step.connectorId);
              const a = getAction(step.connectorId, step.actionId);
              return (
                <div key={step.id} className="flex items-center gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <span className={`w-8 h-8 ${c?.color} rounded-full flex items-center justify-center text-sm`}>{c?.icon}</span>
                    {i < workflow.steps.length - 1 && <div className="w-0.5 h-4 bg-gray-700 mt-1"></div>}
                  </div>
                  <div>
                    <div className="text-sm text-gray-200 font-medium">{step.label || a?.name}</div>
                    <div className="text-xs text-gray-500">{c?.name} → {a?.method} {a?.path}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Script preview */}
          <div className="bg-gray-950 rounded-lg border border-gray-700 overflow-hidden mb-4">
            <div className="px-3 py-2 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-500">📄 {workflow.name.replace(/\s+/g, '-').toLowerCase() || 'workflow'}.ps1</span>
              <span className="text-xs text-gray-600">{lineCount} lines</span>
            </div>
            <pre className="p-4 text-xs text-gray-400 overflow-auto max-h-64 font-mono leading-relaxed">
              {script}
            </pre>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setWizard('steps')} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            ← Back
          </button>
          <button onClick={() => exportScript('test')} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            ▶️ Test against Mock APIs
          </button>
          <button onClick={() => exportScript('production')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            📝 Open in Editor
          </button>
          <button onClick={downloadScript} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
            💾 Download .ps1
          </button>
        </div>
      </div>
    );
  };

  // ── Main render ──────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Workflow Builder</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {(['config', 'steps', 'review'] as const).map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-700">→</span>}
              <span className={wizard === step ? 'text-blue-400 font-medium' : ''}>
                {i + 1}. {step === 'config' ? 'Configure' : step === 'steps' ? 'Add Steps' : 'Review'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {wizard === 'config' && renderConfig()}
      {wizard === 'steps' && renderSteps()}
      {wizard === 'review' && renderReview()}
    </div>
  );
}
