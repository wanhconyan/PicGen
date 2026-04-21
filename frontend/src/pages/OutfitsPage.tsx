import { useCallback, useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';
import type { Outfit, PageResp } from '../types/models';

export function OutfitsPage() {
  const [items, setItems] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listOutfits({ page, pageSize: 10, keyword })) as PageResp<Outfit>;
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <h2>Outfits</h2>
      <div className="card row">
        <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button
          className="primary"
          onClick={() =>
            void api.createOutfit({ name, prompt }).then(() => {
              setName('');
              setPrompt('');
              void load();
            })
          }
        >
          Add Outfit
        </button>
      </div>

      <div className="card row">
        <input placeholder="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button onClick={() => void load()}>Search</button>
      </div>

      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Prompt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.prompt}</td>
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
