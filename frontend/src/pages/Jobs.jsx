import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { jobApi, queueApi } from '../api';

const emptyForm = {
  queue_id: '',
  type: '',
  job_kind: 'immediate',
  payload: '{}',
  run_at: '',
  cron_expression: '',
  batch_items: '[{}, {}]',
  max_attempts: 3
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({ status: '', queueId: '' });
  const [form, setForm] = useState(emptyForm);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.queueId) params.queueId = filters.queueId;
      const res = await jobApi.list(params);
      setJobs(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadQueues = async () => {
    const res = await queueApi.list();
    setQueues(res.data.data);
  };

  useEffect(() => {
    loadQueues();
  }, []);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.queue_id || !form.type.trim()) {
      setFormError('Queue and job type are required');
      return;
    }

    setCreating(true);
    try {
      if (form.job_kind === 'batch') {
        const items = JSON.parse(form.batch_items);
        await jobApi.createBatch({
          queue_id: form.queue_id,
          type: form.type,
          items,
          max_attempts: form.max_attempts
        });
      } else {
        await jobApi.create({
          queue_id: form.queue_id,
          type: form.type,
          job_kind: form.job_kind,
          payload: JSON.parse(form.payload || '{}'),
          run_at: form.job_kind === 'delayed' || form.job_kind === 'scheduled' ? form.run_at : undefined,
          cron_expression: form.job_kind === 'recurring' ? form.cron_expression : undefined,
          max_attempts: form.max_attempts
        });
      }
      setForm(emptyForm);
      await loadJobs();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id) => {
    await jobApi.cancel(id);
    await loadJobs();
  };

  return (
    <Layout title="Jobs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <select
              className="input"
              value={filters.queueId}
              onChange={(e) => setFilters({ ...filters, queueId: e.target.value })}
            >
              <option value="">All queues</option>
              {queues.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {['queued', 'scheduled', 'claimed', 'running', 'completed', 'failed', 'dead_letter', 'cancelled'].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </div>

          {loading && <Spinner />}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {!loading && (
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Kind</th>
                    <th>Queue</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td className="text-slate-400">#{j.id}</td>
                      <td className="font-medium">{j.type}</td>
                      <td className="capitalize text-slate-500">{j.job_kind}</td>
                      <td className="text-slate-500">{j.Queue?.name}</td>
                      <td>
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="text-slate-500">
                        {j.attempts}/{j.max_attempts}
                      </td>
                      <td>
                        {!['completed', 'dead_letter', 'cancelled'].includes(j.status) && (
                          <button onClick={() => handleCancel(j.id)} className="text-red-500 text-xs font-medium">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-400 py-6">
                        No jobs match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card h-fit">
          <h3 className="font-semibold text-slate-700 mb-4">Submit a job</h3>
          {formError && (
            <div className="mb-3 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Queue</label>
              <select
                className="input mt-1"
                value={form.queue_id}
                onChange={(e) => setForm({ ...form, queue_id: e.target.value })}
                required
              >
                <option value="">Select a queue</option>
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Job type</label>
              <input
                className="input mt-1"
                placeholder="send_email, generate_report, ..."
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Kind</label>
              <select
                className="input mt-1"
                value={form.job_kind}
                onChange={(e) => setForm({ ...form, job_kind: e.target.value })}
              >
                <option value="immediate">Immediate</option>
                <option value="delayed">Delayed</option>
                <option value="scheduled">Scheduled</option>
                <option value="recurring">Recurring (cron)</option>
                <option value="batch">Batch</option>
              </select>
            </div>

            {form.job_kind === 'batch' ? (
              <div>
                <label className="text-sm font-medium text-slate-600">Batch items (JSON array of payloads)</label>
                <textarea
                  className="input mt-1 font-mono text-xs"
                  rows={4}
                  value={form.batch_items}
                  onChange={(e) => setForm({ ...form, batch_items: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-slate-600">Payload (JSON)</label>
                <textarea
                  className="input mt-1 font-mono text-xs"
                  rows={3}
                  value={form.payload}
                  onChange={(e) => setForm({ ...form, payload: e.target.value })}
                />
              </div>
            )}

            {(form.job_kind === 'delayed' || form.job_kind === 'scheduled') && (
              <div>
                <label className="text-sm font-medium text-slate-600">Run at</label>
                <input
                  type="datetime-local"
                  className="input mt-1"
                  value={form.run_at}
                  onChange={(e) => setForm({ ...form, run_at: e.target.value })}
                  required
                />
              </div>
            )}

            {form.job_kind === 'recurring' && (
              <div>
                <label className="text-sm font-medium text-slate-600">Cron expression</label>
                <input
                  className="input mt-1 font-mono text-xs"
                  placeholder="*/5 * * * *"
                  value={form.cron_expression}
                  onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600">Max attempts</label>
              <input
                type="number"
                min={1}
                className="input mt-1"
                value={form.max_attempts}
                onChange={(e) => setForm({ ...form, max_attempts: Number(e.target.value) })}
              />
            </div>

            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Submitting...' : 'Submit job'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Jobs;
