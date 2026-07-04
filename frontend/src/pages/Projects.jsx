import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { projectApi } from '../api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectApi.list();
      setProjects(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await projectApi.create(form);
      setForm({ name: '', description: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its queues/jobs?')) return;
    await projectApi.remove(id);
    await load();
  };

  return (
    <Layout title="Projects">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading && <Spinner />}
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

          {!loading && (
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td className="text-slate-500">{p.description || '—'}</td>
                      <td className="text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 text-xs font-medium">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-400 py-6">
                        No projects yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card h-fit">
          <h3 className="font-semibold text-slate-700 mb-4">New project</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Name</label>
              <input
                className="input mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Description</label>
              <textarea
                className="input mt-1"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating...' : 'Create project'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
