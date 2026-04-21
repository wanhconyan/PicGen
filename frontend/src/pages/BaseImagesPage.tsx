import { useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';

export function BaseImagesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.listBaseImages({ page, pageSize: 20 });
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load base images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  return (
    <div className="page">
      <h2>Base Images</h2>
      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Character</th>
                <th>Result</th>
                <th>Primary</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td>{item.characterId}</td>
                  <td className="mono">{item.resultId}</td>
                  <td>{item.isPrimary ? 'yes' : 'no'}</td>
                  <td>
                    <img src={item.imageUrl} width={80} />
                  </td>
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
