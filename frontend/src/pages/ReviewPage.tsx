import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { useReviewActions } from '../hooks/useReviewActions';
import { api } from '../services/api';
import type { PageResp, Result } from '../types/models';

export function ReviewPage() {
  const actions = useReviewActions();
  const generateActions = useGenerateActions();
  const [items, setItems] = useState<Result[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listResults({ page: 1, pageSize: 100, reviewStatus: 'pending_review' })) as PageResp<Result>;
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const allSelected = useMemo(() => selected.length > 0 && selected.length === items.length, [selected, items]);

  return (
    <div className="page">
      <h2>Review</h2>
      <div className="card row">
        <button className="primary" onClick={() => void actions.batchApprove(selected).then(() => load())} disabled={!selected.length}>
          Batch Approve
        </button>
        <button className="danger" onClick={() => void actions.batchReject(selected).then(() => load())} disabled={!selected.length}>
          Batch Reject
        </button>
      </div>
      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => setSelected(e.target.checked ? items.map((item) => item.id) : [])}
                  />
                </th>
                <th>ID</th>
                <th>Preview</th>
                <th>Task</th>
                <th>Actions</th>
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
                  <td className="mono">
                    <Link to={`/results/${item.id}`}>{item.id}</Link>
                  </td>
                  <td>
                    <img src={item.imageUrl} width={80} />
                  </td>
                  <td className="mono">{item.taskId}</td>
                  <td className="row">
                    <button onClick={() => void actions.approve(item.id).then(() => load())}>Approve</button>
                    <button className="danger" onClick={() => void actions.reject(item.id).then(() => load())}>
                      Reject
                    </button>
                    <button onClick={() => void generateActions.rework(item.id).then(() => load())}>Rework</button>
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
