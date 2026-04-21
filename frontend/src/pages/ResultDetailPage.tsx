import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AsyncState } from '../components/AsyncState';
import { useGenerateActions } from '../hooks/useGenerateActions';
import { useReviewActions } from '../hooks/useReviewActions';
import { api } from '../services/api';
import type { Result } from '../types/models';

export function ResultDetailPage() {
  const { id = '' } = useParams();
  const reviewActions = useReviewActions();
  const generateActions = useGenerateActions();
  const [item, setItem] = useState<Result | null>(null);
  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [result, resultTrace] = await Promise.all([api.getResult(id), api.getResultTrace(id)]);
      setItem(result as Result);
      setTrace(resultTrace);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load result detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
  }, [id]);

  return (
    <div className="page">
      <h2>Result Detail</h2>
      <AsyncState loading={loading} error={error} empty={!item}>
        <div className="card row">
          <img src={item?.imageUrl} width={300} />
          <div>
            <p>
              <b>ID:</b> <span className="mono">{item?.id}</span>
            </p>
            <p>
              <b>Task:</b> <span className="mono">{item?.taskId}</span>
            </p>
            <p>
              <b>Review:</b> {item?.reviewStatus}
            </p>
            <div className="row">
              <button className="primary" onClick={() => void reviewActions.approve(id).then(() => load())}>
                Approve
              </button>
              <button className="danger" onClick={() => void reviewActions.reject(id).then(() => load())}>
                Reject
              </button>
              <button onClick={() => void reviewActions.promoteToBase(id).then(() => load())}>Promote to Base</button>
              <button onClick={() => void generateActions.rework(id).then(() => load())}>Rework</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Trace</h3>
          <pre className="mono">{JSON.stringify(trace, null, 2)}</pre>
        </div>
      </AsyncState>
    </div>
  );
}
