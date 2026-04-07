import { useState } from 'react';
import { apiEndpoints } from '../data/endpoints';
import { apiFetch, getSettings } from '../services/api';

export default function ApiExplorer() {
  const [selected, setSelected] = useState<{ api: number; ep: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const settings = getSettings();
  const baseUrls: Record<string, string> = {
    'Fudo PAM': settings.fudoUrl,
    'Matrix42 ESM': settings.matrixUrl,
    'Active Directory': settings.adUrl,
    'Microsoft Entra ID': settings.azureAdUrl,
    'ServiceNow ITSM': settings.snowUrl,
    'Jira Service Management': settings.jsmUrl,
    'BMC Remedy / Helix': settings.remedyUrl,
    'CyberArk PVWA': settings.cyberarkUrl,
  };

  const tryIt = async (apiName: string, method: string, path: string) => {
    setLoading(true);
    const base = baseUrls[apiName] || '';
    const res = await apiFetch(base + path, method);
    setResult(JSON.stringify(res.data, null, 2));
    setLoading(false);
  };

  const ep = selected ? apiEndpoints[selected.api].endpoints[selected.ep] : null;
  const apiName = selected ? apiEndpoints[selected.api].api : '';

  return (
    <div className="flex h-[calc(100vh-0px)]">
      <div className="w-72 bg-gray-950 border-r border-gray-800 overflow-y-auto p-4">
        <h2 className="text-lg font-bold text-gray-100 mb-4">API Explorer</h2>
        {apiEndpoints.map((group, gi) => (
          <div key={group.api} className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.api}</h3>
            {group.endpoints.map((endpoint, ei) => (
              <button
                key={ei}
                onClick={() => { setSelected({ api: gi, ep: ei }); setResult(null); }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 flex items-center gap-2 ${
                  selected?.api === gi && selected?.ep === ei ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span className={`font-bold ${endpoint.method === 'GET' ? 'text-green-400' : endpoint.method === 'POST' ? 'text-blue-400' : endpoint.method === 'DELETE' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {endpoint.method}
                </span>
                <span className="font-mono truncate">{endpoint.path}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {!ep ? (
          <p className="text-gray-500">Select an endpoint from the tree to view details.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded text-sm font-bold ${ep.method === 'GET' ? 'bg-green-900/40 text-green-400' : ep.method === 'POST' ? 'bg-blue-900/40 text-blue-400' : ep.method === 'DELETE' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                  {ep.method}
                </span>
                <code className="text-gray-200 font-mono">{ep.path}</code>
              </div>
              <p className="text-sm text-gray-400">{ep.description}</p>
            </div>

            {ep.parameters && (
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Parameters</h4>
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-500"><th className="text-left pb-2">Name</th><th className="text-left pb-2">Type</th><th className="text-left pb-2">Required</th><th className="text-left pb-2">Description</th></tr></thead>
                  <tbody>
                    {ep.parameters.map((p) => (
                      <tr key={p.name} className="border-t border-gray-700/50">
                        <td className="py-2 font-mono text-blue-400">{p.name}</td>
                        <td className="py-2 text-gray-400">{p.type}</td>
                        <td className="py-2">{p.required ? <span className="text-red-400">Yes</span> : <span className="text-gray-600">No</span>}</td>
                        <td className="py-2 text-gray-400">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {ep.exampleRequest ? (
              <div><h4 className="text-sm font-semibold text-gray-300 mb-2">Example Request</h4>
                <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-300 font-mono border border-gray-700 overflow-auto">{JSON.stringify(ep.exampleRequest, null, 2)}</pre>
              </div>
            ) : null}
            {ep.exampleResponse ? (
              <div><h4 className="text-sm font-semibold text-gray-300 mb-2">Example Response</h4>
                <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-300 font-mono border border-gray-700 overflow-auto">{JSON.stringify(ep.exampleResponse, null, 2)}</pre>
              </div>
            ) : null}

            <button
              onClick={() => tryIt(apiName, ep.method, ep.path)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? '⏳ Loading...' : '🚀 Try it'}
            </button>

            {result && (
              <div><h4 className="text-sm font-semibold text-gray-300 mb-2">Response</h4>
                <pre className="bg-gray-800 rounded-lg p-4 text-xs text-green-400 font-mono border border-gray-700 overflow-auto max-h-96">{result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
