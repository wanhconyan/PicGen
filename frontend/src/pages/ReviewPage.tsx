import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { api } from '../services/api';
import type { PageResp, Result, ReviewScores } from '../types/models';

const scoreFields: Array<{ key: keyof ReviewScores; label: string }> = [
  { key: 'identityStability', label: 'Identity Stability' },
  { key: 'handIntegrity', label: 'Hand Integrity' },
  { key: 'outfitReadability', label: 'Outfit Readability' },
  { key: 'weaponCompleteness', label: 'Weapon Completeness' },
  { key: 'commercialReadiness', label: 'Commercial Readiness' },
];

const defaultScores: ReviewScores = {
  identityStability: 0,
  handIntegrity: 0,
  outfitReadability: 0,
  weaponCompleteness: 0,
  commercialReadiness: 0,
};

export function ReviewPage() {
  const navigate = useNavigate();
  const generateActions = useGenerateActions();
  const [items, setItems] = useState<Result[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scores, setScores] = useState<ReviewScores>(defaultScores);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await api.listResults({ page: 1, pageSize: 100, reviewStatus: 'pending_review' })) as PageResp<Result>;
      setItems(res.items);
      setSelectedId((prev) => {
        if (prev && res.items.some((item) => item.id === prev)) return prev;
        return res.items[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  const submitDecision = async (decision: 'approve' | 'reject') => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await api.reviewDecision({ resultId: selectedItem.id, decision, comment, scores });
      setComment('');
      setScores(defaultScores);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review decision');
    } finally {
      setSubmitting(false);
    }
  };

  const setPreferred = async () => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await api.setPreferredResult(selectedItem.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set preferred result');
    } finally {
      setSubmitting(false);
    }
  };

  const rework = async () => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await generateActions.rework(selectedItem.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rework result');
    } finally {
      setSubmitting(false);
    }
  };

  const goEditStudio = () => {
    if (!selectedItem) return;
    navigate(`/edit-studio?sourceResultId=${selectedItem.id}`);
  };

  return (
    <div className="page">
      <h2>Review</h2>
      <AsyncState loading={loading} error={error} empty={!items.length}>
        <div
          className="card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.4fr) minmax(320px, 1fr)',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 8, maxHeight: 640, overflowY: 'auto' }}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr',
                  gap: 8,
                  textAlign: 'left',
                  border: selectedId === item.id ? '2px solid #4f46e5' : '1px solid #333',
                  borderRadius: 8,
                  padding: 8,
                  background: item.isPreferred ? 'rgba(79,70,229,0.12)' : 'transparent',
                }}
              >
                <img src={item.thumbUrl || item.imageUrl} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 6 }} />
                <div>
                  <div className="mono" style={{ fontSize: 12 }}>{item.id}</div>
                  <div className="mono" style={{ fontSize: 12 }}>task: {item.taskId}</div>
                  <div style={{ fontSize: 12 }}>score: {item.score ?? '-'}</div>
                  {item.isPreferred ? <div style={{ fontSize: 12, color: '#4f46e5' }}>Preferred</div> : null}
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {selectedItem ? (
              <>
                <img src={selectedItem.imageUrl} style={{ width: '100%', maxHeight: 560, objectFit: 'contain', borderRadius: 8 }} />
                <div className="card" style={{ padding: 12 }}>
                  <div className="mono">resultId: <Link to={`/results/${selectedItem.id}`}>{selectedItem.id}</Link></div>
                  <div className="mono">taskId: {selectedItem.taskId}</div>
                  <div className="mono">characterId: {selectedItem.characterId ?? '-'}</div>
                  <div className="mono">outfitId: {selectedItem.outfitId ?? '-'}</div>
                  <div className="mono">score: {selectedItem.score ?? '-'}</div>
                  <div className="mono">preferred: {selectedItem.isPreferred ? 'yes' : 'no'}</div>
                </div>
              </>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div className="card" style={{ padding: 12 }}>
              <h3 style={{ marginTop: 0 }}>Review Panel</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {scoreFields.map((field) => (
                  <label key={field.key} style={{ display: 'grid', gap: 4 }}>
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={scores[field.key]}
                      onChange={(e) => setScores((prev) => ({ ...prev, [field.key]: Number(e.target.value) || 0 }))}
                    />
                  </label>
                ))}
                <label style={{ display: 'grid', gap: 4 }}>
                  <span>Review Comment</span>
                  <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="card row" style={{ padding: 12, flexWrap: 'wrap' }}>
              <button className="primary" disabled={!selectedItem || submitting} onClick={() => void submitDecision('approve')}>
                通过
              </button>
              <button className="danger" disabled={!selectedItem || submitting} onClick={() => void submitDecision('reject')}>
                淘汰
              </button>
              <button disabled={!selectedItem || submitting} onClick={() => void setPreferred()}>
                设为首选
              </button>
              <button disabled={!selectedItem || submitting} onClick={() => goEditStudio()}>
                回退编辑器
              </button>
              <button disabled={!selectedItem || submitting} onClick={() => void rework()}>
                重新生成
              </button>
            </div>
          </div>
        </div>
      </AsyncState>
    </div>
  );
}
