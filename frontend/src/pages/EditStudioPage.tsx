import { useEffect, useMemo, useRef, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { api } from '../services/api';
import type { PageResp, Result } from '../types/models';

type CompareMode = 'source' | 'mask' | 'side-by-side';

export function EditStudioPage() {
  const actions = useGenerateActions();
  const [results, setResults] = useState<Result[]>([]);
  const [masks, setMasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceResultId, setSourceResultId] = useState('');
  const [maskTemplateId, setMaskTemplateId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [compareMode, setCompareMode] = useState<CompareMode>('side-by-side');
  const [hasMaskDrawing, setHasMaskDrawing] = useState(false);
  const [latestResultId, setLatestResultId] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  const querySourceResultId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('sourceResultId') ?? '';
  }, []);

  const sourceResult = useMemo(
    () => results.find((r) => r.id === sourceResultId) ?? null,
    [results, sourceResultId],
  );

  const latestResult = useMemo(() => {
    if (!results.length) return null;
    if (latestResultId) return results.find((r) => r.id === latestResultId) ?? null;
    return results[0] ?? null;
  }, [results, latestResultId]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMaskDrawing(false);
  };

  const setupCanvasSizeFromImage = () => {
    const canvas = canvasRef.current;
    const image = sourceImageRef.current;
    if (!canvas || !image) return;

    const w = Math.max(1, Math.floor(image.clientWidth));
    const h = Math.max(1, Math.floor(image.clientHeight));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      clearCanvas();
    }
  };

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
      if (!sourceResultId) {
        const fromQuery = querySourceResultId && resultItems.find((r) => r.id === querySourceResultId)?.id;
        if (fromQuery) {
          setSourceResultId(fromQuery);
        } else if (resultItems[0]) {
          setSourceResultId(resultItems[0].id);
        }
      }
      if (!maskTemplateId && (maskRes as any).items?.[0]) setMaskTemplateId((maskRes as any).items[0].id);
      if (resultItems[0]) setLatestResultId(resultItems[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load edit studio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setupCanvasSizeFromImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceResultId]);

  const drawAt = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    setHasMaskDrawing(true);
  };

  const startDraw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    drawAt(event);
  };

  const moveDraw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    drawAt(event);
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  return (
    <div className="page">
      <h2>Edit Studio</h2>
      <AsyncState loading={loading} error={error}>
        <div className="card row" style={{ flexWrap: 'wrap' }}>
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
          <select value={compareMode} onChange={(e) => setCompareMode(e.target.value as CompareMode)}>
            <option value="source">source</option>
            <option value="mask">mask</option>
            <option value="side-by-side">side-by-side</option>
          </select>
          <button onClick={clearCanvas}>Clear</button>
          <button
            className="primary"
            onClick={() => {
              const canvas = canvasRef.current;
              const maskData = hasMaskDrawing && canvas ? canvas.toDataURL('image/png') : undefined;
              void actions
                .localEdit({
                  sourceResultId,
                  maskTemplateId,
                  prompt,
                  params: {
                    ...(maskData ? { mask: maskData } : {}),
                  },
                })
                .then(() => load());
            }}
          >
            另存为新版本
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

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(compareMode === 'source' || compareMode === 'side-by-side') && (
              <div>
                <div style={{ marginBottom: 8 }}>Source + Mask</div>
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  {sourceResult?.imageUrl ? (
                    <img
                      ref={sourceImageRef}
                      src={sourceResult.imageUrl}
                      alt="source"
                      style={{ maxWidth: '100%', display: 'block' }}
                      onLoad={setupCanvasSizeFromImage}
                    />
                  ) : (
                    <div>暂无源图</div>
                  )}
                  {sourceResult?.imageUrl && (
                    <canvas
                      ref={canvasRef}
                      style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
                      onMouseDown={startDraw}
                      onMouseMove={moveDraw}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                    />
                  )}
                </div>
              </div>
            )}

            {(compareMode === 'mask' || compareMode === 'side-by-side') && (
              <div>
                <div style={{ marginBottom: 8 }}>Latest Result Preview</div>
                {latestResult?.imageUrl ? (
                  <img src={latestResult.imageUrl} alt="latest result" style={{ maxWidth: '100%', display: 'block' }} />
                ) : (
                  <div>暂无结果</div>
                )}
              </div>
            )}
          </div>
        </div>
      </AsyncState>
    </div>
  );
}
