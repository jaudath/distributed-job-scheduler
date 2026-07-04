# API Documentation

Base URL: `http://localhost:5000/api`

All responses share this envelope:

```json
{ "success": true, "message": "OK", "data": {}, "meta": {} }
```

`meta` is only present on paginated list endpoints. Errors use
`"success": false` with a `message` and, for validation errors, an `errors`
array of `{ field, message }`.

Every route below except `/auth/register` and `/auth/login` requires header:
`Authorization: Bearer <token>`.

## Auth

| Method | Path             | Body                              | Notes                       |
|--------|------------------|------------------------------------|------------------------------|
| POST   | /auth/register   | `{ name, email, password }`        | Returns `{ token, user }`    |
| POST   | /auth/login       | `{ email, password }`              | Returns `{ token, user }`    |
| GET    | /auth/me          | —                                   | Returns the current user     |

## Projects

| Method | Path             | Body                        |
|--------|------------------|-------------------------------|
| GET    | /projects         | —                              |
| POST   | /projects         | `{ name, description }`       |
| GET    | /projects/:id     | —                              |
| PUT    | /projects/:id     | `{ name, description }`       |
| DELETE | /projects/:id     | —                              |

## Retry policies

| Method | Path                  | Body                                                                 |
|--------|-----------------------|-----------------------------------------------------------------------|
| GET    | /retry-policies        | —                                                                       |
| POST   | /retry-policies        | `{ name, strategy: fixed\|linear\|exponential, max_attempts, base_delay_ms, max_delay_ms }` |
| PUT    | /retry-policies/:id    | same fields, partial                                                    |
| DELETE | /retry-policies/:id    | —                                                                       |

## Queues

| Method | Path                     | Body / Query                                                   |
|--------|--------------------------|-----------------------------------------------------------------|
| GET    | /queues?projectId=       | list, optionally filtered by project                            |
| POST   | /queues                  | `{ project_id, name, priority, concurrency_limit, retry_policy_id }` |
| GET    | /queues/:id              | —                                                                 |
| PUT    | /queues/:id              | partial update of the same fields                                |
| PATCH  | /queues/:id/status       | `{ status: "active" \| "paused" }`                                |
| DELETE | /queues/:id              | —                                                                 |
| GET    | /queues/:id/stats        | job counts grouped by status for this queue                     |

## Jobs

| Method | Path                | Body / Query                                                                                   |
|--------|---------------------|--------------------------------------------------------------------------------------------------|
| GET    | /jobs                | query: `queueId, status, jobKind, batchId, page, limit`                                          |
| POST   | /jobs                | `{ queue_id, type, payload, job_kind, run_at, cron_expression, priority, max_attempts }`          |
| POST   | /jobs/batch           | `{ queue_id, type, items: [payload, ...], priority, max_attempts }`                               |
| GET    | /jobs/:id             | job detail including executions and logs                                                          |
| POST   | /jobs/:id/cancel      | cancels a job that hasn't finished yet                                                            |

`job_kind` is one of `immediate | delayed | scheduled | recurring | batch`.
`run_at` (ISO datetime) is required for `delayed`/`scheduled`.
`cron_expression` (standard 5-field cron) is required for `recurring`.

## Workers

| Method | Path            | Notes                                                    |
|--------|-----------------|------------------------------------------------------------|
| GET    | /workers         | list of registered worker processes with computed status  |
| GET    | /workers/:id     | worker detail + recent heartbeats + active job count       |

## Dead Letter Queue

| Method | Path              | Body / Query                                  |
|--------|-------------------|-------------------------------------------------|
| GET    | /dlq               | query: `queueId, resolved`                       |
| POST   | /dlq/:id/retry     | re-queues the original job with a reset counter  |

## Logs

| Method | Path    | Query                                    |
|--------|---------|--------------------------------------------|
| GET    | /logs    | `jobId, level, page, limit`                |

## System stats

| Method | Path     | Notes                                                                 |
|--------|----------|-------------------------------------------------------------------------|
| GET    | /stats    | job counts by status, queue/worker counts, DLQ pending, hourly throughput |

## Example: submitting jobs

```bash
# Immediate job
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"queue_id":1,"type":"send_email","payload":{"to":"a@b.com"}}'

# Delayed job (runs in 5 minutes)
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"queue_id":1,"type":"send_email","job_kind":"delayed","run_at":"2026-07-04T06:00:00Z","payload":{"to":"a@b.com"}}'

# Recurring job (every 5 minutes)
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"queue_id":1,"type":"generate_report","job_kind":"recurring","cron_expression":"*/5 * * * *"}'

# Batch of 3 jobs
curl -X POST http://localhost:5000/api/jobs/batch \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"queue_id":1,"type":"send_email","items":[{"to":"a@b.com"},{"to":"b@b.com"},{"to":"c@b.com"}]}'
```
