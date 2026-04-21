import type { ReactNode } from 'react';

type Props = {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  children: ReactNode;
};

export function AsyncState({ loading, error, empty, children }: Props) {
  if (loading) {
    return <div className="card">Loading...</div>;
  }
  if (error) {
    return <div className="card">Error: {error}</div>;
  }
  if (empty) {
    return <div className="card">No data.</div>;
  }
  return <>{children}</>;
}
