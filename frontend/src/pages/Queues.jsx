import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { queueApi, projectApi, retryPolicyApi } from '../api';

const Queues = () => {
  const [queues, setQueues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [retryPolicies, setRetryPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [statsByQueue, setStatsByQueue] = useState({});

  const [form, setForm] = useState({
    project_id: '',
    name: '',
    priority: 5,
    concurrency_limit: 5,
    retry_policy_id: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, pRes, rRes] = await Promise.all([
        queueApi.list(),
        projectApi.list(),
        retryPolicyApi.list()
      ]);
      setQueues(qRes.data.data);
      setProjects(pRes.data.data);
      setRetryPolicies(rRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load queues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadStats = async (queueId) => {
    const res = await queueApi.stats(queueId);
    setStatsByQueue((prev) => ({ ...prev, [queueId]: res.data.data.counts }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.name.trim()) return;
    setCreating(true);
    try {
      await queueApi.create({
        ...form,
        retry_policy_id: form.retry_policy_id || null
      });
      setForm({ project_id: '', name: '', priority: 5, concurrency_limit: 5, retry_policy_id: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create queue');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (queue) => {
    const nextStatus = queue.status === 'active' ? 'paused' : 'active';
    await queueApi.setStatus(queue.id, nextStatus);
    await load();
  };

  return (
    <Layout title="Queues">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading && <Spinner />}
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

          {!loading &&
            queues.map((q) => (
              <div key={q.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{q.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Priority {q.priority} · Concurrency limit {q.concurrency_limit} ·{' '}
                      {q.RetryPolicy ? `${q.RetryPolicy.name} retry policy` : 'no retry policy'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={q.status} />
                    <button onClick={() => toggleStatus(q)} className="btn-secondary text-xs">
                      {q.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => loadStats(q.id)} className="btn-secondary text-xs">
                      Stats
                    </button>
                  </div>
                </div>

                {statsByQueue[q.id] && (
                  <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2 text-center">
                    {Object.entries(statsByQueue[q.id]).map(([status, count]) => (
                      <div key={status} className="bg-slate-50 rounded-lg py-2">
                        <div className="text-xs text-slate-400 capitalize">{status.replace('_', ' ')}</div>
                        <div className="font-semibold text-slate-700">{count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {!loading && queues.length === 0 && (
            <div className="card text-center text-slate-400 py-8">No queues yet.</div>
          )}
        </div>

        <div className="card h-fit">
          <h3 className="font-semibold text-slate-700 mb-4">New queue</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Project</label>
              <select
                className="input mt-1"
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                required
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Name</label>
              <input
                className="input mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Priority (1 highest)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="input mt-1"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Concurrency limit</label>
                <input
                  type="number"
                  min={1}
                  className="input mt-1"
                  value={form.concurrency_limit}
                  onChange={(e) => setForm({ ...form, concurrency_limit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Retry policy</label>
              <select
                className="input mt-1"
                value={form.retry_policy_id}
                onChange={(e) => setForm({ ...form, retry_policy_id: e.target.value })}
              >
                <option value="">None</option>
                {retryPolicies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.strategy})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating...' : 'Create queue'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Queues;
