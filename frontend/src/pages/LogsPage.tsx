import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';

export function LogsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetType, setTargetType] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.listLogs({ page, pageSize: 30, targetType });
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const jump = (targetTypeValue: string, targetId: string) => {
    if (targetTypeValue === 'result') navigate(`/results/${targetId}`);
    if (targetTypeValue === 'task') navigate('/generate');
    if (targetTypeValue === 'character') navigate('/characters');
  };

  useEffect(() => {
    void load();
  }, [page]);

  return (
    <div className="page">
      <h2>Logs</h2>
      <div className="card row">
        <input value={targetType} onChange={(e) => setTargetType(e.target.value)} placeholder="target type" />
        <button onClick={() => void load()}>Apply</button>
      </div>
      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Target</th>
                <th>Message</th>
                <th>Meta</th>
                <th>At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.eventType}</td>
                  <td>
                    <button onClick={() => jump(item.targetType, item.targetId)}>
                      {item.targetType}:{item.targetId}
                    </button>
                  </td>
                  <td>{item.message}</td>
                  <td className="mono">{JSON.stringify(item.metadata)}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
