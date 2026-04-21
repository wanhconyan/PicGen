import { useEffect, useState } from 'react';
import { AsyncState } from '../components/AsyncState';
import { api } from '../services/api';
import { useAppStore } from '../store/appStore';

export function SettingsPage() {
  const setPollingIntervalMs = useAppStore((s) => s.setPollingIntervalMs);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setSettings(data);
      setPollingIntervalMs(Number((data as any).pollingIntervalMs ?? 5000));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page">
      <h2>Settings</h2>
      <AsyncState loading={loading} error={error} empty={!settings}>
        <div className="card row">
          <label>
            Model
            <input value={settings?.model ?? ''} onChange={(e) => setSettings({ ...settings, model: e.target.value })} />
          </label>
          <label>
            Polling(ms)
            <input
              value={settings?.pollingIntervalMs ?? 5000}
              onChange={(e) => setSettings({ ...settings, pollingIntervalMs: Number(e.target.value) || 5000 })}
            />
          </label>
          <label>
            Demo Mode
            <select
              value={String(settings?.demoMode ?? true)}
              onChange={(e) => setSettings({ ...settings, demoMode: e.target.value === 'true' })}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
          <button
            className="primary"
            onClick={() =>
              void api.patchSettings(settings).then(() => {
                setPollingIntervalMs(settings.pollingIntervalMs ?? 5000);
              })
            }
          >
            Save Settings
          </button>
        </div>
        <div className="card">
          <h3>Raw</h3>
          <pre className="mono">{JSON.stringify(settings, null, 2)}</pre>
        </div>
      </AsyncState>
    </div>
  );
}
