import { useEffect, useMemo, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { api } from '../services/api';
import type { Character, Outfit, PageResp, Task } from '../types/models';

export function GeneratePage() {
  const actions = useGenerateActions();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState('');
  const [selectedOutfits, setSelectedOutfits] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');

  const taskPreviewCount = useMemo(() => selectedOutfits.length || 1, [selectedOutfits]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [charRes, outfitRes, taskRes] = await Promise.all([
        api.listCharacters({ page: 1, pageSize: 100 }),
        api.listOutfits({ page: 1, pageSize: 100 }),
        api.listTasks({ page: 1, pageSize: 20 }),
      ]);
      setCharacters((charRes as PageResp<Character>).items);
      setOutfits((outfitRes as PageResp<Outfit>).items);
      setTasks((taskRes as PageResp<Task>).items);
      if (!characterId && (charRes as PageResp<Character>).items[0]) {
        setCharacterId((charRes as PageResp<Character>).items[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load generate page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page">
      <h2>Generate</h2>
      <AsyncState loading={loading} error={error}>
        <div className="card">
          <div className="row">
            <select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
              <option value="">Select character</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input placeholder="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            {outfits.map((o) => (
              <label key={o.id} className="badge">
                <input
                  type="checkbox"
                  checked={selectedOutfits.includes(o.id)}
                  onChange={(e) =>
                    setSelectedOutfits((prev) =>
                      e.target.checked ? [...prev, o.id] : prev.filter((id) => id !== o.id),
                    )
                  }
                />{' '}
                {o.name}
              </label>
            ))}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="primary"
              onClick={() =>
                void actions
                  .generate({ characterId, outfitIds: selectedOutfits, prompt })
                  .then(() => load())
                  .catch((e: Error) => setError(e.message))
              }
            >
              Submit Batch Task
            </button>
            <span>Task preview: {taskPreviewCount}</span>
          </div>
        </div>

        <div className="card">
          <h3>Recent Tasks</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Character</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="mono">{task.id}</td>
                  <td>{task.type}</td>
                  <td>{task.status}</td>
                  <td>{task.characterId}</td>
                  <td>{new Date(task.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </div>
  );
}
