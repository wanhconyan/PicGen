import { useCallback, useEffect, useMemo, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { api } from '../services/api';

type StyleItem = {
  id: string;
  name: string;
  prompt: string;
  tags?: string[];
};

type FormState = {
  name: string;
  prompt: string;
  tagsText: string;
};

function normalizeTags(tagsText: string): string[] {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function StylesPage() {
  const [styles, setStyles] = useState<StyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [characterAddon, setCharacterAddon] = useState('');
  const [outfitAddon, setOutfitAddon] = useState('');

  const [createForm, setCreateForm] = useState<FormState>({
    name: '',
    prompt: '',
    tagsText: '',
  });

  const [editForm, setEditForm] = useState<FormState>({
    name: '',
    prompt: '',
    tagsText: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listStyles({ page: 1, pageSize: 100 })) as { items: StyleItem[] };
      setStyles(res.items ?? []);
      if (!selectedStyleId && res.items?.[0]?.id) {
        setSelectedStyleId(res.items[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load styles');
    } finally {
      setLoading(false);
    }
  }, [selectedStyleId]);

  const selectedStyle = useMemo(() => styles.find((item) => item.id === selectedStyleId), [styles, selectedStyleId]);

  const previewPrompt = useMemo(() => {
    const parts = [selectedStyle?.prompt ?? '', characterAddon.trim(), outfitAddon.trim()].filter(Boolean);
    return parts.join(', ');
  }, [selectedStyle?.prompt, characterAddon, outfitAddon]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedStyle) {
      setEditForm({ name: '', prompt: '', tagsText: '' });
      return;
    }
    setEditForm({
      name: selectedStyle.name ?? '',
      prompt: selectedStyle.prompt ?? '',
      tagsText: (selectedStyle.tags ?? []).join(', '),
    });
  }, [selectedStyle]);

  return (
    <div className="page">
      <h2>Styles</h2>

      <div className="card">
        <h3>Create Style</h3>
        <div className="row">
          <input
            placeholder="name"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="prompt"
            value={createForm.prompt}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, prompt: e.target.value }))}
          />
          <input
            placeholder="tags (comma separated)"
            value={createForm.tagsText}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, tagsText: e.target.value }))}
          />
          <button
            className="primary"
            onClick={() =>
              void api
                .createStyle({
                  name: createForm.name,
                  prompt: createForm.prompt,
                  tags: normalizeTags(createForm.tagsText),
                })
                .then(async () => {
                  setCreateForm({ name: '', prompt: '', tagsText: '' });
                  await load();
                })
                .catch((e: Error) => setError(e.message))
            }
          >
            Add Style
          </button>
        </div>
      </div>

      <AsyncState loading={loading} error={error} empty={!styles.length}>
        <div className="card">
          <h3>Style List</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tags</th>
                <th>Prompt</th>
              </tr>
            </thead>
            <tbody>
              {styles.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedStyleId(item.id)}
                  style={{ cursor: 'pointer', background: item.id === selectedStyleId ? 'rgba(56, 189, 248, 0.12)' : 'transparent' }}
                >
                  <td>{item.name}</td>
                  <td>{(item.tags ?? []).join(', ')}</td>
                  <td>{item.prompt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Edit Selected Style</h3>
          <div className="row">
            <input
              placeholder="name"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={!selectedStyle}
            />
            <input
              placeholder="prompt"
              value={editForm.prompt}
              onChange={(e) => setEditForm((prev) => ({ ...prev, prompt: e.target.value }))}
              disabled={!selectedStyle}
            />
            <input
              placeholder="tags (comma separated)"
              value={editForm.tagsText}
              onChange={(e) => setEditForm((prev) => ({ ...prev, tagsText: e.target.value }))}
              disabled={!selectedStyle}
            />
            <button
              className="primary"
              disabled={!selectedStyle}
              onClick={() => {
                if (!selectedStyle) {
                  return;
                }
                void api
                  .updateStyle(selectedStyle.id, {
                    name: editForm.name,
                    prompt: editForm.prompt,
                    tags: normalizeTags(editForm.tagsText),
                  })
                  .then(() => load())
                  .catch((e: Error) => setError(e.message));
              }}
            >
              Save Style
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Prompt Preview</h3>
          <div className="row">
            <input
              placeholder="character addon"
              value={characterAddon}
              onChange={(e) => setCharacterAddon(e.target.value)}
            />
            <input placeholder="outfit addon" value={outfitAddon} onChange={(e) => setOutfitAddon(e.target.value)} />
          </div>
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{previewPrompt || '(empty preview)'}</pre>
        </div>
      </AsyncState>
    </div>
  );
}
