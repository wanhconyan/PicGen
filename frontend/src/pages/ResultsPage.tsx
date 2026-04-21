import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';
import type { PageResp, Result } from '../types/models';

export function ResultsPage() {
  const [items, setItems] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewStatus, setReviewStatus] = useState('');
  const [keyword, setKeyword] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listResults({ page, pageSize: 12, reviewStatus, keyword })) as PageResp<Result>;
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  return (
    <div className="page">
      <h2>Results</h2>
      <div className="card row">
        <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
          <option value="">All review status</option>
          <option value="pending_review">pending_review</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
        <input value={keyword} placeholder="search" onChange={(e) => setKeyword(e.target.value)} />
        <button onClick={() => void load()}>Apply</button>
      </div>
      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Review</th>
                <th>Score</th>
                <th>Task</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">
                    <Link to={`/results/${item.id}`}>{item.id}</Link>
                  </td>
                  <td>
                    <img src={item.imageUrl} width={80} />
                  </td>
                  <td>{item.reviewStatus}</td>
                  <td>{item.score ?? '-'}</td>
                  <td className="mono">{item.taskId}</td>
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
