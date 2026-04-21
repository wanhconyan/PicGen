import { useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { api } from '../services/api';
import { useAppStore } from '../store/appStore';
import type { PageResp } from '../types/models';

export function DashboardPage() {
  const pollingIntervalMs = useAppStore((s) => s.pollingIntervalMs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ tasks: 0, results: 0, reviews: 0, exports: 0, logs: 0 });

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const [tasks, results, reviews, exportsData, logs] = (await Promise.all([
          api.listTasks({ page: 1, pageSize: 1 }),
          api.listResults({ page: 1, pageSize: 1 }),
          api.listReviews({ page: 1, pageSize: 1 }),
          api.listExports({ page: 1, pageSize: 1 }),
          api.listLogs({ page: 1, pageSize: 1 }),
        ])) as [PageResp<unknown>, PageResp<unknown>, PageResp<unknown>, PageResp<unknown>, PageResp<unknown>];
        setStats({
          tasks: tasks.pagination.total,
          results: results.pagination.total,
          reviews: reviews.pagination.total,
          exports: exportsData.pagination.total,
          logs: logs.pagination.total,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void run();
    const timer = window.setInterval(() => void run(), pollingIntervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [pollingIntervalMs]);

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <div className="card row">
        <button className="primary" onClick={() => void api.seedDemo()}>
          Seed Demo Data
        </button>
        <span>Polling: {pollingIntervalMs}ms</span>
      </div>
      <AsyncState loading={loading} error={error}>
        <div className="kv">
          {Object.entries(stats).map(([key, val]) => (
            <div className="card" key={key}>
              <div className="badge">{key}</div>
              <h3>{val}</h3>
            </div>
          ))}
        </div>
      </AsyncState>
    </div>
  );
}
