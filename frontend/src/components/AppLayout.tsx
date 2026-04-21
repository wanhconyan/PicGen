import { NavLink } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

const links = [
  ['/', 'Dashboard'],
  ['/characters', 'Characters'],
  ['/outfits', 'Outfits'],
  ['/generate', 'Generate'],
  ['/results', 'Results'],
  ['/review', 'Review'],
  ['/review/history', 'Review History'],
  ['/edit-studio', 'Edit Studio'],
  ['/export', 'Export'],
  ['/export/history', 'Export History'],
  ['/masks', 'Masks'],
  ['/base-images', 'Base Images'],
  ['/logs', 'Logs'],
  ['/settings', 'Settings'],
] as const;

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>PicGen Final</h1>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {label}
          </NavLink>
        ))}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
