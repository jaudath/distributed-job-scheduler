# Design Decisions

## Why MySQL as the queue instead of Redis/RabbitMQ/Kafka?

The assignment explicitly rules out Docker/Kubernetes/microservices and asks
for a simple, easy-to-run project on plain Node.js + MySQL. Using
`SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction gives the same
"exactly one consumer claims this row" guarantee a dedicated broker would,
without adding another moving part a reviewer has to install. The trade-off
is throughput (polling is not push-based), which is acceptable for a project
of this scope and is a well-known, production-used pattern (e.g. Postgres/
MySQL-backed queues like `pg-boss` or Rails' `good_job`).

## Why a separate `worker` process instead of running workers inside the API?

Keeping the worker separate mirrors real distributed job schedulers: the API
is stateless and horizontally scalable independently of execution capacity,
and you can run `N` worker processes (even on different machines, as long as
they point at the same MySQL instance) to scale throughput without touching
the API. It also makes the "graceful shutdown drains in-flight jobs" and
"heartbeat" requirements natural to demonstrate — you start/stop the worker
process directly and watch its row in the `workers` table change state.

## Why polling instead of a push mechanism?

MySQL doesn't have a native pub/sub notification primitive like Postgres'
`LISTEN/NOTIFY`. A short polling interval (2s by default, configurable via
`WORKER_POLL_INTERVAL_MS`) keeps latency low without needing an extra
component. Combined with `SKIP LOCKED`, polling scales fine to many worker
processes because they never block each other while claiming.

## Why store retry strategy on a reusable `RetryPolicy` rather than per-job?

Retry behavior (fixed/linear/exponential backoff, max attempts, delay bounds)
is naturally a property of a **queue** (e.g. "the emails queue always retries
3 times with exponential backoff"), not of each individual job. Making it a
first-class, reusable model means one policy can be attached to many queues
and edited in one place — this is exactly what the "Queue configuration"
requirement in the spec calls for.

## Why a `ScheduledJob` template table in addition to `Job.cron_expression`?

A `Job` row represents one concrete execution attempt with its own status/
attempts/results. A recurring job needs to spawn a *new* `Job` row every time
it fires while remembering "when do I fire next" — that bookkeeping doesn't
belong on any single `Job` row, so it lives on a separate `ScheduledJob`
template that the scheduler sweep reads and advances.

## Why JSON columns for `payload`/`result`/`payload_snapshot`?

Job payloads are inherently free-form (an email job needs `to`/`subject`, a
report job needs different fields entirely). A JSON column avoids either a
rigid schema per job type or an unstructured `TEXT` column with manual
(de)serialization scattered across the codebase. Model-level getters
(`utils/jsonField.js`) normalize the value to a real JS object regardless of
how the underlying MySQL driver returns it, so the rest of the codebase
never has to think about this.

## Why `bcryptjs` instead of native `bcrypt`?

`bcryptjs` is a pure-JS implementation with zero native build dependencies,
which avoids the classic "node-gyp fails on Windows" problem for a project
whose target environment is explicitly Windows + VS Code.

## What was intentionally left out (bonus features)

Per the assignment ("skip bonus features unless very easy"), the following
were **not** implemented: multi-tenant RBAC beyond a simple `admin`/`member`
role flag, WebSocket/real-time push (the dashboard polls every few seconds
instead), rate limiting, and job priority pre-emption of already-running
jobs. Priority is honored at claim time (lower number = claimed first) but a
low-priority job that's already running is not interrupted.
