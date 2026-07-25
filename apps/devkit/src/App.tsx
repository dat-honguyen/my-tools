import { useMemo, useState } from 'react';
import { TOOLS } from './tool-registry';

export function App() {
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState(TOOLS[0]?.id ?? '');

  const filteredTools = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query === '' ? TOOLS : TOOLS.filter((tool) => tool.label.toLowerCase().includes(query));
  }, [filter]);

  const selectedTool = TOOLS.find((tool) => tool.id === selectedId);
  const SelectedComponent = selectedTool?.component;

  return (
    <div className="devkit-terminal">
      <div className="devkit-terminal-header">
        <div className="devkit-window-controls">
          <div className="devkit-control close" />
          <div className="devkit-control minimize" />
          <div className="devkit-control maximize" />
        </div>
        <div className="devkit-terminal-title">datisa.dev - Universal DevKit</div>
      </div>
      <div className="devkit-body">
        <aside className="devkit-sidebar">
          <input
            type="text"
            className="devkit-filter"
            placeholder="Filter tools…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <ul className="devkit-tool-list">
            {filteredTools.map((tool) => (
              <li key={tool.id}>
                <button
                  type="button"
                  className={`devkit-tool-item${tool.id === selectedId ? ' active' : ''}`}
                  onClick={() => setSelectedId(tool.id)}
                >
                  {tool.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="devkit-detail">
          {SelectedComponent ? <SelectedComponent /> : <p className="devkit-empty-state">Select a tool from the list.</p>}
        </main>
      </div>
    </div>
  );
}
