import { useCallback, useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';
import type { ExportItem, PageResp } from '../types/models';

export function ExportHistoryPage() {
  const [items, setItems] = useState<ExportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listExports({ page, pageSize: 20, keyword })) as PageResp<ExportItem>;
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load export history');
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <h2>Export History</h2>
      <div className="card row">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="search" />
        <button onClick={() => void load()}>Apply</button>
      </div>

      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Result</th>
                <th>Path</th>
                <th>File</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td className="mono">{item.resultId}</td>
                  <td>{item.path}</td>
                  <td>{item.fileName}</td>
                  <td>{item.status}</td>
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
