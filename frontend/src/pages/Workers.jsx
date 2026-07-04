import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { workerApi } from '../api';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await workerApi.list();
      setWorkers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Workers">
      {loading && <Spinner />}
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {!loading && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Worker key</th>
                <th>Hostname</th>
                <th>Status</th>
                <th>Concurrency</th>
                <th>Last heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td className="font-mono text-xs">{w.worker_key}</td>
                  <td className="text-slate-500">{w.hostname}</td>
                  <td>
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="text-slate-500">{w.concurrency}</td>
                  <td className="text-slate-400">
                    {w.last_seen_at ? new Date(w.last_seen_at).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-6">
                    No workers have registered yet. Start the worker process to see it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Workers;
