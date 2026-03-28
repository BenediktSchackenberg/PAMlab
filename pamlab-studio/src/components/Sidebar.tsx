import type { Page } from '../types';

const navItems: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'workflow', icon: '🔧', label: 'Workflow Builder' },
  { id: 'scenarios', icon: '📋', label: 'Scenarios' },
  { id: 'editor', icon: '📝', label: 'Code Editor' },
  { id: 'explorer', icon: '🔍', label: 'API Explorer' },
  { id: 'events', icon: '⚡', label: 'Event Stream' },
  { id: 'results', icon: '📊', label: 'Results' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ activePage, onNavigate }: { activePage: Page; onNavigate: (p: Page) => void }) {
  return (
    <div className="w-60 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">🔐 PAMlab Studio</h1>
        <p className="text-xs text-gray-500 mt-1">Access Management Dev Tools</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-3 text-sm transition-colors ${
              activePage === item.id
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
        PAMlab v1.0 • Dev Mode
      </div>
    </div>
  );
}
