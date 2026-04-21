import { useCallback, useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';

export function MasksPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [name, setName] = useState('');
  const [part, setPart] = useState('weapon');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.listMasks({ page, pageSize: 20 });
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load masks');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <h2>Masks</h2>
      <div className="card row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="mask name" />
        <input value={part} onChange={(e) => setPart(e.target.value)} placeholder="part" />
        <button
          className="primary"
          onClick={() =>
            void api.createMask({ name, part, maskPath: `masks/${name || 'custom'}.png` }).then(() => {
              setName('');
              void load();
            })
          }
        >
          Add Mask
        </button>
      </div>

      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Part</th>
                <th>Mask Path</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.part}</td>
                  <td className="mono">{item.maskPath}</td>
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
