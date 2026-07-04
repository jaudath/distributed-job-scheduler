/**
 * Pluggable job execution handlers, keyed by Job.type.
 *
 * Each handler receives the job's payload and must return a JSON-serializable
 * result, or throw/reject to signal failure (which triggers the retry policy).
 *
 * Add new job types here as the platform grows. Unknown types fall back to
 * `default`, which simulates a short unit of work.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handlers = {
  send_email: async (payload) => {
    if (!payload || !payload.to) {
      throw new Error('send_email requires a "to" address in the payload');
    }
    await sleep(300 + Math.random() * 400);
    return { delivered: true, to: payload.to, subject: payload.subject || '(no subject)' };
  },

  generate_report: async (payload) => {
    await sleep(500 + Math.random() * 700);
    return { report: `${payload?.reportType || 'generic'}-report`, rows: Math.floor(Math.random() * 1000) };
  },

  webhook_call: async (payload) => {
    if (!payload || !payload.url) {
      throw new Error('webhook_call requires a "url" in the payload');
    }
    await sleep(200 + Math.random() * 300);
    return { called: payload.url, status: 200 };
  },

  data_export: async (payload) => {
    await sleep(400 + Math.random() * 600);
    return { exported: true, format: payload?.format || 'csv' };
  },

  default: async (payload) => {
    await sleep(150 + Math.random() * 250);

    // Allows deterministic failure injection for testing retries/DLQ, e.g.
    // { "shouldFail": true } in the job payload.
    if (payload && payload.shouldFail) {
      throw new Error('Simulated failure requested via payload.shouldFail');
    }

    return { processed: true };
  }
};

const runHandler = async (job) => {
  const handler = handlers[job.type] || handlers.default;
  return handler(job.payload || {});
};

module.exports = { runHandler };
