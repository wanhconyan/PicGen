import { useCallback, useEffect, useMemo, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { PaginationBar } from '../components/PaginationBar';
import { api } from '../services/api';
import type { Character, PageResp } from '../types/models';

type BaseImage = {
  id: string;
  characterId: string;
  resultId: string;
  imageUrl: string;
  isPrimary: boolean;
};

type Style = {
  id: string;
  name: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'system';
  content: string;
};

export function BaseImagesPage() {
  const [items, setItems] = useState<BaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [characterId, setCharacterId] = useState('');
  const [styleId, setStyleId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listBaseImages({ page, pageSize: 20 })) as PageResp<BaseImage>;
      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load base images');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadMeta = useCallback(async () => {
    try {
      const [charRes, styleRes] = await Promise.all([
        api.listCharacters({ page: 1, pageSize: 200 }),
        api.listStyles({ page: 1, pageSize: 200 }),
      ]);
      const chars = (charRes as PageResp<Character>).items;
      const styleItems = (styleRes as PageResp<Style>).items;
      setCharacters(chars);
      setStyles(styleItems);
      if (!characterId && chars[0]) {
        setCharacterId(chars[0].id);
      }
    } catch {
      // ignore meta loading errors here and rely on form submission errors
    }
  }, [characterId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const selectedCharacterName = useMemo(
    () => characters.find((c) => c.id === characterId)?.name || '-',
    [characters, characterId],
  );

  const selectedStyleName = useMemo(() => {
    if (!styleId) return '默认';
    return styles.find((s) => s.id === styleId)?.name || '-';
  }, [styles, styleId]);

  const appendSystem = (content: string) => {
    setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'system', content }]);
  };

  const sendPrompt = async () => {
    const text = prompt.trim();
    if (!text || !characterId || submitting) return;

    setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setPrompt('');

    try {
      setSubmitting(true);
      appendSystem('提交中：正在创建生成任务...');
      const task = await api.generate({
        characterId,
        styleId: styleId || undefined,
        prompt: text,
        outfitIds: [],
      });

      const resultIds = (task as { resultIds?: string[] }).resultIds ?? [];
      if (!resultIds.length) {
        throw new Error('生成任务成功但没有返回 resultIds');
      }

      const resultId = resultIds[0];
      appendSystem(`任务成功：获取结果 ${resultId}...`);

      const result = (await api.getResult(resultId)) as { imageUrl?: string };
      const imageUrl = result.imageUrl;
      if (!imageUrl) {
        throw new Error('结果中缺少 imageUrl');
      }

      await api.createBaseImage({
        characterId,
        resultId,
        imageUrl,
        isPrimary: true,
      });

      appendSystem('已成功写入 base_images。');
      await load();
    } catch (e) {
      appendSystem(`失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Base Images</h2>
        <button className="primary" onClick={() => setDialogOpen((v) => !v)}>
          对话生成基模
        </button>
      </div>

      {dialogOpen && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3>对话式提示词生成基模</h3>
          <div className="row" style={{ marginBottom: 8 }}>
            <select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
              <option value="">选择角色</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)}>
              <option value="">默认风格（可空）</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card" style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
            {chatMessages.length === 0 ? (
              <div className="muted">请输入提示词并发送，系统将生成并写入基模。</div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: 8 }}>
                  <strong>{msg.role === 'user' ? '你' : '系统'}：</strong>
                  <span>{msg.content}</span>
                </div>
              ))
            )}
          </div>

          <div className="row">
            <input
              placeholder="输入提示词，回车发送"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void sendPrompt();
                }
              }}
            />
            <button className="primary" disabled={submitting || !characterId || !prompt.trim()} onClick={() => void sendPrompt()}>
              {submitting ? '发送中...' : '发送'}
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            当前：角色={selectedCharacterName}，风格={selectedStyleName}
          </div>
        </div>
      )}

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
