import { useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { api } from '../services/api';
import type { PageResp, Result } from '../types/models';

export function EditStudioPage() {
  const actions = useGenerateActions();
  const [results, setResults] = useState<Result[]>([]);
  const [masks, setMasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceResultId, setSourceResultId] = useState('');
  const [maskTemplateId, setMaskTemplateId] = useState('');
  const [prompt, setPrompt] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resultRes, maskRes] = await Promise.all([
        api.listResults({ page: 1, pageSize: 100 }),
        api.listMasks({ page: 1, pageSize: 100 }),
      ]);
      const resultItems = (resultRes as PageResp<Result>).items;
      setResults(resultItems);
      setMasks((maskRes as any).items ?? []);
      if (!sourceResultId && resultItems[0]) setSourceResultId(resultItems[0].id);
      if (!maskTemplateId && (maskRes as any).items?.[0]) setMaskTemplateId((maskRes as any).items[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load edit studio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page">
      <h2>Edit Studio</h2>
      <AsyncState loading={loading} error={error}>
        <div className="card row">
          <select value={sourceResultId} onChange={(e) => setSourceResultId(e.target.value)}>
            {results.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
          <select value={maskTemplateId} onChange={(e) => setMaskTemplateId(e.target.value)}>
            {masks.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="edit prompt" />
          <button
            className="primary"
            onClick={() => void actions.localEdit({ sourceResultId, maskTemplateId, prompt }).then(() => load())}
          >
            Local Edit
          </button>
          <button
            onClick={() =>
              void actions
                .fullOutfitEdit({
                  sourceResultId,
                  prompt,
                  characterId: results.find((r) => r.id === sourceResultId)?.characterId,
                })
                .then(() => load())
            }
          >
            Full Outfit Edit
          </button>
        </div>
      </AsyncState>
    </div>
  );
}
