import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { logApi } from '../api';

const LEVEL_COLORS = {
  info: 'text-slate-600',
  warn: 'text-amber-600',
  error: 'text-red-600'
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('');
  const [jobId, setJobId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (level) params.level = level;
      if (jobId) params.jobId = jobId;
      const res = await logApi.list(params);
      setLogs(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, jobId]);

  return (
    <Layout title="Execution Logs">
      <div className="flex gap-3 mb-4">
        <select className="input max-w-[160px]" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <input
          className="input max-w-[160px]"
          placeholder="Filter by job ID"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
        />
      </div>

      {loading && <Spinner />}
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {!loading && (
        <div className="card">
          <div className="font-mono text-xs divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-2 flex gap-3">
                <span className="text-slate-400 shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                <span className={`shrink-0 uppercase font-semibold ${LEVEL_COLORS[log.level]}`}>{log.level}</span>
                <span className="text-slate-400 shrink-0">job#{log.job_id}</span>
                <span className="text-slate-700">{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center text-slate-400 py-6">No logs match this filter.</div>}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Logs;
