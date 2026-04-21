import { useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';
import type { Character, PageResp } from '../types/models';

export function CharactersPage() {
  const [items, setItems] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [name, setName] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listCharacters({ page, pageSize: 10, keyword })) as PageResp<Character>;
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  return (
    <div className="page">
      <h2>Characters</h2>
      <div className="card row">
        <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          className="primary"
          onClick={() =>
            void api.createCharacter({ name }).then(() => {
              setName('');
              void load();
            })
          }
        >
          Add Character
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
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.status}</td>
                  <td>{item.description}</td>
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
