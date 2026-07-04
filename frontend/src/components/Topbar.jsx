import React from 'react';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-sm text-right">
          <div className="font-medium text-slate-700">{user?.name}</div>
          <div className="text-slate-400 text-xs">{user?.email}</div>
        </div>
        <button onClick={logout} className="btn-secondary text-sm">
          Log out
        </button>
      </div>
    </header>
  );
};

export default Topbar;
