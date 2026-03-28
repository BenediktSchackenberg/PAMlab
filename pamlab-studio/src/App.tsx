import { useState } from 'react';
import type { Page, ApiResult, StepResultType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScenarioBuilder from './components/ScenarioBuilder';
import WorkflowWizard from './components/WorkflowWizard';
import CodeEditor from './components/CodeEditor';
import ResultsPanel from './components/ResultsPanel';
import ApiExplorer from './components/ApiExplorer';
import EventStream from './components/EventStream';
import Settings from './components/Settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [script, setScript] = useState('# Write your PowerShell script here\n');
  const [steps, setSteps] = useState<StepResultType[]>([]);
  const [traffic, setTraffic] = useState<ApiResult[]>([]);

  const handleResults = (s: StepResultType[], t: ApiResult[]) => {
    setSteps(s);
    setTraffic(t);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'scenarios': return <ScenarioBuilder onNavigate={setPage} onLoadScript={setScript} />;
      case 'workflow': return <WorkflowWizard onNavigate={setPage} onLoadScript={setScript} />;
      case 'editor': return <CodeEditor script={script} onScriptChange={setScript} onResults={handleResults} />;
      case 'results': return <ResultsPanel steps={steps} traffic={traffic} />;
      case 'explorer': return <ApiExplorer />;
      case 'events': return <EventStream />;
      case 'settings': return <Settings />;
    }
  };

  return <Layout activePage={page} onNavigate={setPage}>{renderPage()}</Layout>;
}
