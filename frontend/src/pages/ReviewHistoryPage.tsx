import { useCallback, useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';
import type { PageResp, Review } from '../types/models';

export function ReviewHistoryPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listReviews({ page, pageSize: 20, decision })) as PageResp<Review>;
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review history');
    } finally {
      setLoading(false);
    }
  }, [page, decision]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <h2>Review History</h2>
      <div className="card row">
        <select value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="">All</option>
          <option value="approve">approve</option>
          <option value="reject">reject</option>
        </select>
        <button onClick={() => void load()}>Apply</button>
      </div>

      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Result</th>
                <th>Decision</th>
                <th>Comment</th>
                <th>At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td className="mono">{item.resultId}</td>
                  <td>{item.decision}</td>
                  <td>{item.comment}</td>
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
