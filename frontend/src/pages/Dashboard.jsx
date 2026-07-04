import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import { statsApi } from '../api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await statsApi.system();
      setMetrics(res.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // live polling every 5s
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <Layout title="Dashboard">
      {loading && <Spinner label="Loading system metrics..." />}
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {metrics && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">Job Pipeline</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <StatCard label="Queued" value={metrics.jobs.queued} />
              <StatCard label="Scheduled" value={metrics.jobs.scheduled} />
              <StatCard label="Claimed" value={metrics.jobs.claimed} />
              <StatCard label="Running" value={metrics.jobs.running} accent="text-blue-600" />
              <StatCard label="Completed" value={metrics.jobs.completed} accent="text-emerald-600" />
              <StatCard label="Failed" value={metrics.jobs.failed} accent="text-red-600" />
              <StatCard label="Dead Letter" value={metrics.jobs.dead_letter} accent="text-rose-700" />
              <StatCard label="Cancelled" value={metrics.jobs.cancelled} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Queues</h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Total</span>
                <span className="font-medium">{metrics.queues.total}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Active</span>
                <span className="font-medium text-emerald-600">{metrics.queues.active}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Paused</span>
                <span className="font-medium text-amber-600">{metrics.queues.paused}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Workers</h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Total</span>
                <span className="font-medium">{metrics.workers.total}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Online</span>
                <span className="font-medium text-emerald-600">{metrics.workers.online}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Offline</span>
                <span className="font-medium text-slate-500">{metrics.workers.offline}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Reliability</h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Pending DLQ entries</span>
                <span className="font-medium text-rose-600">{metrics.deadLetterQueue.pending}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-500">Completed (last hour)</span>
                <span className="font-medium text-emerald-600">{metrics.throughput.completedLastHour}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
