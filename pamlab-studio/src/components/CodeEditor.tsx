import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { Page, ApiResult, StepResultType } from '../types';
import { parseScript } from '../services/scriptParser';
import { apiFetch } from '../services/api';
import { prepareTestRun, executeCleanup, trackCreatedResources, type CleanupPlan } from '../services/testRunner';
import { convertScriptToProduction, loadProductionConfig } from '../services/productionConfig';
import { resolveStepReferences, extractIds, type StepResults } from '../services/stepResolver';

export default function CodeEditor({ script, onScriptChange, onResults, onNavigate: _onNavigate }: {
  script: string;
  onScriptChange: (s: string) => void;
  onResults: (steps: StepResultType[], traffic: ApiResult[]) => void;
  onNavigate?: (p: Page) => void;
}) {
  void _onNavigate;
  const [running, setRunning] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugStep, setDebugStep] = useState(0);
  const [debugCalls, setDebugCalls] = useState<ReturnType<typeof parseScript>>([]);
  const [saved, setSaved] = useState(false);
  const [localSteps, setLocalSteps] = useState<StepResultType[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [cleanupPlan, setCleanupPlan] = useState<CleanupPlan | null>(null);
  const [cleanupLog, setCleanupLog] = useState<string[]>([]);
  const [cleaningUp, setCleaningUp] = useState(false);

  // ── Production Export ────────────────────────────────────────────
  const handleExportProduction = useCallback(() => {
    const configs = loadProductionConfig();
    if (!configs) {
      alert('Configure production systems in Settings → Production Config first');
      return;
    }
    const productionScript = convertScriptToProduction(script, configs);
    const blob = new Blob([productionScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pamlab-production.ps1';
    a.click();
    URL.revokeObjectURL(url);
  }, [script]);

  // ── Run: execute all steps ───────────────────────────────────────
  const handleRun = async () => {
    setRunning(true);
    setDebugMode(false);
    setShowPanel(true);
    const calls = parseScript(script);

    if (calls.length === 0) {
      const empty: StepResultType[] = [{
        step: 1,
        description: 'No API calls found in script',
        success: false,
        result: { method: '-', url: '-', status: 0, statusText: 'Parse Error', time: 0, error: 'Could not find Invoke-RestMethod calls. Check PowerShell syntax.' },
      }];
      setLocalSteps(empty);
      onResults(empty, []);
      setRunning(false);
      return;
    }

    const steps: StepResultType[] = [];
    const traffic: ApiResult[] = [];
    const stepResults: StepResults = {};

    for (let i = 0; i < calls.length; i++) {
      const call = resolveStepReferences(calls[i], stepResults);
      try {
        const res = await apiFetch(call.url, call.method, call.body);
        const result: ApiResult = {
          method: call.method,
          url: call.url,
          status: res.status,
          statusText: res.statusText,
          time: res.time,
          requestBody: call.body,
          responseBody: res.data,
        };
        traffic.push(result);
        steps.push({
          step: i + 1,
          description: `${call.method} ${call.url}`,
          success: res.status >= 200 && res.status < 400,
          result,
        });
        // Track step results for cross-step references
        if (res.status >= 200 && res.status < 400 && res.data) {
          stepResults[i + 1] = extractIds(res.data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errResult: ApiResult = { method: call.method, url: call.url, status: 0, statusText: 'Network Error', time: 0, error: msg };
        traffic.push(errResult);
        steps.push({ step: i + 1, description: `${call.method} ${call.url}`, success: false, result: errResult });
      }
      setLocalSteps([...steps]);
      onResults([...steps], [...traffic]);
    }
    setRunning(false);
  };

  // ── Test Run: replace user data with random test data ─────────────
  const handleTestRun = async () => {
    setRunning(true);
    setDebugMode(false);
    setShowPanel(true);
    setCleanupPlan(null);
    setCleanupLog([]);

    const { script: modifiedScript, cleanup } = prepareTestRun(script);
    const calls = parseScript(modifiedScript);

    if (calls.length === 0) {
      const empty: StepResultType[] = [{
        step: 1, description: 'No API calls found in script', success: false,
        result: { method: '-', url: '-', status: 0, statusText: 'Parse Error', time: 0, error: 'Could not find Invoke-RestMethod calls.' },
      }];
      setLocalSteps(empty);
      onResults(empty, []);
      setRunning(false);
      return;
    }

    const steps: StepResultType[] = [];
    const traffic: ApiResult[] = [];
    const stepResults: StepResults = {};

    for (let i = 0; i < calls.length; i++) {
      const call = resolveStepReferences(calls[i], stepResults);
      try {
        const res = await apiFetch(call.url, call.method, call.body);
        const result: ApiResult = {
          method: call.method, url: call.url, status: res.status, statusText: res.statusText,
          time: res.time, requestBody: call.body, responseBody: res.data,
        };
        traffic.push(result);
        steps.push({ step: i + 1, description: `${call.method} ${call.url}`, success: res.status >= 200 && res.status < 400, result });
        // Track step results for cross-step references
        if (res.status >= 200 && res.status < 400 && res.data) {
          stepResults[i + 1] = extractIds(res.data);
        }
        // Track created resources for cleanup
        if (res.status >= 200 && res.status < 400 && res.data) {
          trackCreatedResources(call.url, call.method, res.data, cleanup);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errResult: ApiResult = { method: call.method, url: call.url, status: 0, statusText: 'Network Error', time: 0, error: msg };
        traffic.push(errResult);
        steps.push({ step: i + 1, description: `${call.method} ${call.url}`, success: false, result: errResult });
      }
      setLocalSteps([...steps]);
      onResults([...steps], [...traffic]);
    }

    setCleanupPlan(cleanup);
    setRunning(false);
  };

  // ── Cleanup: remove test-created resources ───────────────────────
  const handleCleanup = async () => {
    if (!cleanupPlan) return;
    setCleaningUp(true);
    try {
      const log = await executeCleanup(cleanupPlan, apiFetch);
      setCleanupLog(log);
      setCleanupPlan(null);
    } catch (err) {
      setCleanupLog([`Cleanup error: ${err instanceof Error ? err.message : String(err)}`]);
    }
    setCleaningUp(false);
  };

  // ── Debug: step-through mode ─────────────────────────────────────
  const handleDebugStart = () => {
    const calls = parseScript(script);
    if (calls.length === 0) {
      const empty: StepResultType[] = [{ step: 1, description: 'No API calls found', success: false }];
      setLocalSteps(empty);
      onResults(empty, []);
      return;
    }
    setDebugCalls(calls);
    setDebugStep(0);
    setDebugMode(true);
    setShowPanel(true);
    const pending = calls.map((c, i) => ({
      step: i + 1,
      description: `⏸ ${c.method} ${c.url}`,
      success: false,
    }));
    setLocalSteps(pending);
    onResults(pending, []);
  };

  const handleDebugNext = async () => {
    if (debugStep >= debugCalls.length) return;
    const call = debugCalls[debugStep];
    try {
      const res = await apiFetch(call.url, call.method, call.body);
      const result: ApiResult = {
        method: call.method,
        url: call.url,
        status: res.status,
        statusText: res.statusText,
        time: res.time,
        requestBody: call.body,
        responseBody: res.data,
      };
      const updated = debugCalls.map((c, i) => ({
        step: i + 1,
        description: `${i < debugStep ? '✅' : i === debugStep ? (res.status < 400 ? '✅' : '❌') : '⏸'} ${c.method} ${c.url}`,
        success: i <= debugStep ? (i === debugStep ? res.status < 400 : true) : false,
        result: i === debugStep ? result : localSteps[i]?.result,
      }));
      setLocalSteps(updated);
      onResults(updated, [result]);
    } catch { /* skip */ }
    if (debugStep + 1 >= debugCalls.length) {
      setDebugMode(false);
    }
    setDebugStep(s => s + 1);
  };

  // ── Save: store to localStorage ──────────────────────────────────
  const handleSave = () => {
    localStorage.setItem('pamlab-script', script);
    localStorage.setItem('pamlab-script-ts', new Date().toISOString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Export: download as .ps1 file ────────────────────────────────
  const handleExport = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pamlab-workflow.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Global keyboard shortcut listeners ───────────────────────────
  useEffect(() => {
    const onRun = () => handleRun();
    const onSave = () => handleSave();
    const onExport = () => handleExport();
    const onExportProd = () => handleExportProduction();
    window.addEventListener('pamlab:run', onRun);
    window.addEventListener('pamlab:save', onSave);
    window.addEventListener('pamlab:export', onExport);
    window.addEventListener('pamlab:export-production', onExportProd);
    return () => {
      window.removeEventListener('pamlab:run', onRun);
      window.removeEventListener('pamlab:save', onSave);
      window.removeEventListener('pamlab:export', onExport);
      window.removeEventListener('pamlab:export-production', onExportProd);
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-400 mr-auto">📝 script.ps1</span>

        {debugMode ? (
          <>
            <span className="text-xs text-yellow-400 mr-2">🐛 Step {debugStep + 1}/{debugCalls.length}</span>
            <button onClick={handleDebugNext} disabled={debugStep >= debugCalls.length}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors">
              ⏭ Next
            </button>
            <button onClick={() => setDebugMode(false)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
              ⏹ Stop
            </button>
          </>
        ) : (
          <>
            <button onClick={handleRun} disabled={running}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors">
              {running ? '⏳ Running...' : '▶️ Run'}
            </button>
            <button onClick={handleTestRun} disabled={running}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors">
              🧪 Test Run
            </button>
            <button onClick={handleDebugStart} disabled={running}
              className="px-3 py-1.5 bg-yellow-600/80 hover:bg-yellow-600 disabled:opacity-50 text-white rounded text-sm transition-colors">
              🐛 Debug
            </button>
            <button onClick={handleSave}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
              {saved ? '✅ Saved!' : '💾 Save'}
            </button>
            <button onClick={handleExport}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
              📤 Export
            </button>
            <button onClick={handleExportProduction}
              className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded text-sm transition-colors">
              🏭 Production
            </button>
          </>
        )}
      </div>

      {/* Split: Editor + Results Panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className={showPanel ? 'w-1/2' : 'flex-1'}>
          <Editor
            height="100%"
            defaultLanguage="powershell"
            theme="vs-dark"
            value={script}
            onChange={(v) => onScriptChange(v || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              padding: { top: 10 },
            }}
          />
        </div>

        {/* Inline results panel */}
        {showPanel && localSteps.length > 0 && (
          <div className="w-1/2 border-l border-gray-700 bg-gray-900 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
              <span className="text-sm font-medium text-gray-300">
                {running ? '⏳ Executing...' : `✅ ${localSteps.filter(s => s.success).length}/${localSteps.length} passed`}
              </span>
              <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-gray-300 text-xs">✕ Close</button>
            </div>
            <div className="p-3 space-y-2">
              {/* Cleanup controls */}
              {cleanupPlan && (
                <div className="rounded-lg p-3 border border-purple-700 bg-purple-900/20">
                  <div className="flex items-center gap-2">
                    <button onClick={handleCleanup} disabled={cleaningUp}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors">
                      {cleaningUp ? '⏳ Cleaning...' : '🧹 Cleanup Test Data'}
                    </button>
                    <span className="text-xs text-gray-400">
                      {cleanupPlan.adUsers.length} users, {cleanupPlan.adGroupMemberships.length} memberships, {cleanupPlan.fudoUsers.length} fudo users
                    </span>
                  </div>
                </div>
              )}
              {cleanupLog.length > 0 && (
                <div className="rounded-lg p-3 border border-blue-700 bg-blue-900/20 text-xs text-blue-300">
                  <div className="font-medium mb-1">🧹 Cleanup Log:</div>
                  {cleanupLog.map((l, i) => <div key={i}>• {l}</div>)}
                </div>
              )}
              {localSteps.map((s, i) => (
                <div key={i} className={`rounded-lg p-3 border text-sm ${s.success ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
                  <div className="flex items-center gap-2">
                    <span>{s.success ? '✅' : '❌'}</span>
                    <span className="font-mono text-xs text-gray-300">{s.description}</span>
                  </div>
                  {s.result && (
                    <div className="mt-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${s.result.status < 400 ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                        {s.result.status} {s.result.statusText}
                      </span>
                      <span className="text-gray-500 ml-2">{s.result.time}ms</span>
                      {s.result.responseBody != null && (
                        <pre className="mt-2 p-2 bg-gray-950 rounded text-gray-400 overflow-x-auto max-h-32">
                          {JSON.stringify(s.result.responseBody, null, 2).slice(0, 500)}
                        </pre>
                      )}
                      {s.result.error && (
                        <div className="mt-1 text-red-400">{s.result.error}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
