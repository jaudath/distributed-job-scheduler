import React from 'react';

const StatCard = ({ label, value, accent = 'text-slate-800' }) => (
  <div className="card">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${accent}`}>{value}</div>
  </div>
);

export default StatCard;
