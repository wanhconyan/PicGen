import { useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { useExportActions } from '../hooks/useExportActions';
import { api } from '../services/api';
import type { PageResp, Result } from '../types/models';

export function ExportPage() {
  const actions = useExportActions();
  const [items, setItems] = useState<Result[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [path, setPath] = useState('exports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listResults({ page: 1, pageSize: 100, reviewStatus: 'approved' })) as PageResp<Result>;
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load export page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page">
      <h2>Export</h2>
      <div className="card row">
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="output path" />
        <button className="primary" disabled={!selected.length} onClick={() => void actions.batchExport(selected, path).then(() => load())}>
          Batch Export Selected
        </button>
      </div>
      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>ID</th>
                <th>Image</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(e) =>
                        setSelected((prev) => (e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)))
                      }
                    />
                  </td>
                  <td className="mono">{item.id}</td>
                  <td>
                    <img src={item.imageUrl} width={80} />
                  </td>
                  <td>
                    <button onClick={() => void actions.createExport(item.id, path)}>Export</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </div>
  );
}
