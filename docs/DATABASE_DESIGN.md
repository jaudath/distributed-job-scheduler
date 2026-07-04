# Database Design

See `ER_DIAGRAM.md` for the full entity-relationship diagram. This document
explains the reasoning behind the schema.

## Tables and their purpose

- **users** — accounts for dashboard login. Passwords are hashed with bcrypt
  (`bcryptjs`), never stored or logged in plaintext.
- **projects** — top-level namespace owned by a user; queues live inside a
  project so multiple teams/apps can share one deployment without their
  queues colliding by name.
- **retry_policies** — reusable retry configuration (`strategy`,
  `max_attempts`, `base_delay_ms`, `max_delay_ms`) that queues reference by
  foreign key, so one policy edit affects every queue using it.
- **queues** — the unit of configuration: priority, concurrency limit,
  active/paused status, and which retry policy applies. A queue belongs to
  exactly one project.
- **jobs** — the central table. Every unit of work, regardless of
  `job_kind` (immediate/delayed/scheduled/recurring/batch), is one row here.
  Status transitions are described in `ARCHITECTURE.md`.
- **scheduled_jobs** — templates that spawn new `jobs` rows on a cron
  schedule. Kept separate from `jobs` because a template's lifecycle (define
  once, fire many times) is fundamentally different from a job's lifecycle
  (fire once, reach a terminal state).
- **workers** — one row per worker *process* (not per machine — you can run
  several worker processes on one machine, each gets its own row via a
  unique `worker_key` combining hostname + PID + a random suffix).
- **worker_heartbeats** — an append-only history of heartbeats
  (`active_jobs`, `cpu_load`, `memory_mb`) sent every `WORKER_HEARTBEAT_INTERVAL_MS`
  (10s by default). Kept separate from `workers` (which holds only the
  latest snapshot) so the dashboard can show a heartbeat history without
  bloating the main worker row.
- **job_executions** — one row per *attempt* of a job. A job retried twice
  has three execution rows (attempts 1, 2, 3), each with its own
  start/finish time, duration, and error message — this is what powers the
  "job monitoring" and retry-strategy views.
- **job_logs** — free-text log lines tied to a job (and optionally to a
  specific execution attempt), used for the Logs page and for debugging why
  a specific attempt failed.
- **dead_letter_queue** — a durable record of jobs that exhausted their
  retries, including a `payload_snapshot` (a copy of the payload at time of
  failure) so the original job payload is recoverable even if it's later
  changed, plus a `resolved` flag so retried entries don't clutter the
  active DLQ view.

## Indexing choices

- Foreign keys (`owner_id`, `project_id`, `queue_id`, `worker_id`, `job_id`,
  `execution_id`, `retry_policy_id`, `claimed_by`) are all indexed since
  every list/detail endpoint filters or joins on them.
- `jobs(queue_id, status, run_at)` is a composite index because the worker's
  claim query and the scheduler's promotion query both filter on exactly
  this combination.
- `jobs(status)` alone is indexed for the dashboard's status-count queries.
- `jobs(batch_id)` is indexed so "show me all jobs in this batch" is fast.
- `users(email)` and `queues(project_id, name)` are unique indexes — the
  first prevents duplicate accounts, the second prevents two queues with the
  same name inside one project (queue names are only required to be unique
  *within* a project, not globally).

## ENUMs vs free-text status columns

Every status-like column (`Job.status`, `Job.job_kind`, `Queue.status`,
`WorkerNode.status`, `RetryPolicy.strategy`, `JobExecution.status`,
`JobLog.level`) is a MySQL `ENUM`, not a free-text string. This makes invalid
states (like a typo'd status) impossible at the database layer, and MySQL
stores `ENUM` values internally as a 1-byte integer index, which is smaller
and faster to filter/group on than an equivalent `VARCHAR`.

## Timestamps

`timestamps: true` is enabled globally in `config/database.js`, so every
table automatically gets `created_at`/`updated_at` (Sequelize is configured
with `underscored: true` so these map to snake_case columns, matching the
rest of the schema's naming convention).
