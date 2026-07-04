import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { dlqApi } from '../api';

const DeadLetterQueue = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dlqApi.list({ resolved: 'false' });
      setEntries(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dead letter queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await dlqApi.retry(id);
      await load();
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <Layout title="Dead Letter Queue">
      {loading && <Spinner />}
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {!loading && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    Job #{entry.job_id} · {entry.Job?.type}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{entry.reason}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Queue: {entry.Queue?.name} · Total attempts: {entry.total_attempts} · Failed at{' '}
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRetry(entry.id)}
                  disabled={retryingId === entry.id}
                  className="btn-primary text-sm"
                >
                  {retryingId === entry.id ? 'Retrying...' : 'Retry job'}
                </button>
              </div>
              {entry.payload_snapshot && (
                <pre className="mt-3 bg-slate-50 rounded-lg p-3 text-xs overflow-x-auto">
                  {JSON.stringify(entry.payload_snapshot, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {entries.length === 0 && (
            <div className="card text-center text-slate-400 py-8">
              No unresolved dead letter entries. Your pipeline is healthy!
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default DeadLetterQueue;
