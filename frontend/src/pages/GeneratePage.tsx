import { useCallback, useEffect, useMemo, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { api } from '../services/api';
import type { Character, Outfit, PageResp, Result, Task } from '../types/models';

type BaseImage = {
  id: string;
  characterId?: string;
  versionLabel?: string;
};

type Style = {
  id: string;
  name: string;
};

type Mask = {
  id: string;
  name: string;
};

type TaskType = 'batch_outfit_generate' | 'full_outfit_edit' | 'local_edit';

export function GeneratePage() {
  const actions = useGenerateActions();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [baseImages, setBaseImages] = useState<BaseImage[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [masks, setMasks] = useState<Mask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [characterId, setCharacterId] = useState('');
  const [baseImageVersionId, setBaseImageVersionId] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('batch_outfit_generate');
  const [selectedOutfits, setSelectedOutfits] = useState<string[]>([]);
  const [styleId, setStyleId] = useState('');
  const [maskTemplateId, setMaskTemplateId] = useState('');
  const [sourceResultId, setSourceResultId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [batchByOutfits, setBatchByOutfits] = useState(true);

  const [model, setModel] = useState('gpt-image-1');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('high');
  const [background, setBackground] = useState('transparent');
  const [fidelity, setFidelity] = useState('high');

  const filteredBaseImages = useMemo(
    () => baseImages.filter((b) => !characterId || b.characterId === characterId),
    [baseImages, characterId],
  );

  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === characterId),
    [characters, characterId],
  );

  const selectedStyle = useMemo(() => styles.find((s) => s.id === styleId), [styles, styleId]);

  const selectedOutfitNames = useMemo(
    () => outfits.filter((o) => selectedOutfits.includes(o.id)).map((o) => o.name),
    [outfits, selectedOutfits],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [charRes, outfitRes, taskRes, baseRes, styleRes, maskRes, resultRes] = await Promise.all([
        api.listCharacters({ page: 1, pageSize: 100 }),
        api.listOutfits({ page: 1, pageSize: 100 }),
        api.listTasks({ page: 1, pageSize: 20 }),
        api.listBaseImages({ page: 1, pageSize: 200 }),
        api.listStyles({ page: 1, pageSize: 200 }),
        api.listMasks({ page: 1, pageSize: 200 }),
        api.listResults({ page: 1, pageSize: 200 }),
      ]);

      const chars = (charRes as PageResp<Character>).items;
      const baseItems = (baseRes as PageResp<BaseImage>).items;

      setCharacters(chars);
      setOutfits((outfitRes as PageResp<Outfit>).items);
      setTasks((taskRes as PageResp<Task>).items);
      setBaseImages(baseItems);
      setStyles((styleRes as PageResp<Style>).items);
      const resultItems = (resultRes as PageResp<Result>).items;

      setMasks((maskRes as PageResp<Mask>).items);
      setResults(resultItems);

      const firstChar = chars[0];
      const nextCharacterId = characterId || firstChar?.id || '';
      if (!characterId && firstChar) {
        setCharacterId(firstChar.id);
      }

      if (!styleId && (styleRes as PageResp<Style>).items[0]) {
        setStyleId((styleRes as PageResp<Style>).items[0].id);
      }

      if (!maskTemplateId && (maskRes as PageResp<Mask>).items[0]) {
        setMaskTemplateId((maskRes as PageResp<Mask>).items[0].id);
      }

      const firstBaseForCharacter = baseItems.find((b) => b.characterId === nextCharacterId);
      if (!baseImageVersionId && firstBaseForCharacter) {
        setBaseImageVersionId(firstBaseForCharacter.id);
      }

      if (!sourceResultId && resultItems[0]) {
        setSourceResultId(resultItems[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load generate page');
    } finally {
      setLoading(false);
    }
  }, [baseImageVersionId, characterId, maskTemplateId, sourceResultId, styleId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!characterId) return;
    if (baseImageVersionId && filteredBaseImages.some((b) => b.id === baseImageVersionId)) return;
    setBaseImageVersionId(filteredBaseImages[0]?.id || '');
  }, [characterId, filteredBaseImages, baseImageVersionId]);

  const taskPreviewCount = useMemo(() => {
    if (taskType === 'batch_outfit_generate' && batchByOutfits && selectedOutfits.length > 0) {
      return selectedOutfits.length;
    }
    return 1;
  }, [taskType, batchByOutfits, selectedOutfits]);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payload: Record<string, unknown> = {
        characterId,
        baseImageVersionId,
        outfitIds: selectedOutfits,
        styleId,
        prompt,
        negativePrompt,
        params: { model, size, quality, background, fidelity },
      };

      if (taskType === 'local_edit') {
        payload.maskTemplateId = maskTemplateId;
        payload.sourceResultId = sourceResultId;
        await actions.localEdit(payload);
      } else if (taskType === 'full_outfit_edit') {
        await actions.fullOutfitEdit(payload);
      } else {
        await actions.generate(payload);
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h2>Generate</h2>
      <AsyncState loading={loading} error={error}>
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
              <option value="batch_outfit_generate">batch_outfit_generate</option>
              <option value="full_outfit_edit">full_outfit_edit</option>
              <option value="local_edit">local_edit</option>
            </select>
            <select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
              <option value="">Select character</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={baseImageVersionId} onChange={(e) => setBaseImageVersionId(e.target.value)}>
              <option value="">Select base image</option>
              {filteredBaseImages.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.versionLabel || b.id}
                </option>
              ))}
            </select>
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)}>
              <option value="">Select style</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {taskType === 'local_edit' && (
            <div className="row" style={{ marginBottom: 8 }}>
              <select value={maskTemplateId} onChange={(e) => setMaskTemplateId(e.target.value)}>
                <option value="">Select mask template</option>
                {masks.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select value={sourceResultId} onChange={(e) => setSourceResultId(e.target.value)}>
                <option value="">Select source result</option>
                {results.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="row" style={{ marginBottom: 8 }}>
            <input placeholder="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <input
              placeholder="negative prompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          <div className="row" style={{ marginBottom: 8 }}>
            <input placeholder="model" value={model} onChange={(e) => setModel(e.target.value)} />
            <input placeholder="size" value={size} onChange={(e) => setSize(e.target.value)} />
            <input placeholder="quality" value={quality} onChange={(e) => setQuality(e.target.value)} />
            <input placeholder="background" value={background} onChange={(e) => setBackground(e.target.value)} />
            <input placeholder="fidelity" value={fidelity} onChange={(e) => setFidelity(e.target.value)} />
          </div>

          <div className="row" style={{ marginTop: 8, marginBottom: 8 }}>
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

          {taskType === 'batch_outfit_generate' && (
            <div className="row" style={{ marginBottom: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={batchByOutfits}
                  onChange={(e) => setBatchByOutfits(e.target.checked)}
                />{' '}
                按所选套装批量生成（将按 outfitIds 提交）
              </label>
            </div>
          )}

          <div className="card" style={{ marginTop: 8 }}>
            <h3>Prompt Preview</h3>
            <div>character: {selectedCharacter?.name || '-'}</div>
            <div>style: {selectedStyle?.name || '-'}</div>
            <div>outfits: {selectedOutfitNames.join(', ') || '-'}</div>
            <div>prompt: {prompt || '-'}</div>
            <div>negativePrompt: {negativePrompt || '-'}</div>
            <div>
              params: model={model || '-'}, size={size || '-'}, quality={quality || '-'}, background={background || '-'},
              fidelity={fidelity || '-'}
            </div>
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <button className="primary" disabled={submitting} onClick={() => void submit()}>
              {submitting ? 'Submitting...' : 'Submit Task'}
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
