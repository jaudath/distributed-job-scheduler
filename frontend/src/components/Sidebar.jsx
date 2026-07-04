import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/projects', label: 'Projects', icon: '📁' },
  { to: '/queues', label: 'Queues', icon: '🗂️' },
  { to: '/jobs', label: 'Jobs', icon: '🧩' },
  { to: '/workers', label: 'Workers', icon: '⚙️' },
  { to: '/dlq', label: 'Dead Letter Queue', icon: '☠️' },
  { to: '/logs', label: 'Logs', icon: '📜' }
];

const Sidebar = () => {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 text-lg font-bold text-white border-b border-slate-800">
        Job Scheduler
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-500 border-t border-slate-800">
        Distributed Job Scheduler v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
