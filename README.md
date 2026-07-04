# Distributed Job Scheduler

A full-stack distributed job scheduling platform: submit immediate, delayed,
scheduled, recurring, or batch jobs to configurable queues; a worker pool
claims and executes them with retry/backoff and a Dead Letter Queue; a React
dashboard shows live job, queue, and worker status.

Tech stack: **Node.js, Express, Sequelize, MySQL** (backend + worker) and
**React (Vite), Tailwind CSS, Axios, React Router** (frontend). No Docker,
no Kubernetes, no TypeScript — everything runs directly with Node and npm.

See also: `docs/ARCHITECTURE.md`, `docs/ER_DIAGRAM.md`, `docs/API.md`,
`docs/DESIGN_DECISIONS.md`, `docs/DATABASE_DESIGN.md`.

---
## Images 
<img width="956" height="438" alt="Screenshot 2026-07-04 111558" src="https://github.com/user-attachments/assets/e0bad310-3cf7-4f75-9c93-7e657212f9d6" />
<img width="958" height="417" alt="Screenshot 2026-07-04 111655" src="https://github.com/user-attachments/assets/e7185558-4ec6-4fce-ae9a-20d1e8fc95c6" />
<img width="959" height="437" alt="Screenshot 2026-07-04 111853" src="https://github.com/user-attachments/assets/f7653071-3b99-4d13-9bbd-7f14c7c9a63e" />
<img width="959" height="433" alt="Screenshot 2026-07-04 111913" src="https://github.com/user-attachments/assets/4c13e9cb-2cdb-40fa-82f5-a5128df43b8b" />
<img width="945" height="443" alt="Screenshot 2026-07-04 112020" src="https://github.com/user-attachments/assets/4576d46c-259a-40d2-aa06-261b758fea6c" />
<img width="476" height="322" alt="Screenshot 2026-07-04 112044" src="https://github.com/user-attachments/assets/4311cd49-db84-4415-a907-6e36a56adc55" />
<img width="947" height="448" alt="Screenshot 2026-07-04 112325" src="https://github.com/user-attachments/assets/15462c48-2d3c-4362-8410-3d434901ceb3" />
<img width="953" height="459" alt="Screenshot 2026-07-04 112333" src="https://github.com/user-attachments/assets/64fa2bcb-3a33-4ddf-9c59-53c15e07f9ad" />


## 1. Software to install

- [Node.js](https://nodejs.org/) **v20 LTS** (v18+ also works)
- [MySQL](https://dev.mysql.com/downloads/installer/) **8.0+** (or MariaDB 10.6+)
- [VS Code](https://code.visualstudio.com/) (or any editor)
- Git (optional, for cloning)

## 2. Node.js version

Check with:

```bash
node -v   # should print v18.x or v20.x
npm -v
```

## 3. MySQL version

Check with:

```bash
mysql --version   # should be 8.0+ (or MariaDB 10.6+)
```

## 4. How to create the database

Open a MySQL shell (or MySQL Workbench) and run:

```sql
CREATE DATABASE job_scheduler;
```

That's it — tables are created by the migration script in step 10, not by
hand.

## 5. Environment variables

Copy the example env files and fill in your MySQL password:

```bash
copy backend\.env.example backend\.env      # Windows (cmd)
# or: cp backend/.env.example backend/.env  # macOS/Linux

copy frontend\.env.example frontend\.env
```

`backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=job_scheduler
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

WORKER_POLL_INTERVAL_MS=2000
WORKER_HEARTBEAT_INTERVAL_MS=10000
WORKER_CONCURRENCY=4
```

The **worker** process reads the same `backend/.env` file automatically —
you don't need a second one.

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 6. Backend installation

```bash
cd backend
npm install
```

## 7. Frontend installation

```bash
cd frontend
npm install
```

## 8. Worker installation

```bash
cd worker
npm install
```

## 9. Sequelize setup

Sequelize is already configured in `backend/src/config/database.js` and the
models in `backend/src/models`. Nothing else to install — the CLI-less
"migrate" script below uses `sequelize.sync()` directly, which is simpler to
run and grade than the full Sequelize CLI migration workflow.

## 10. Database migration steps

From the `backend` folder, with your `.env` filled in and MySQL running:

```bash
npm run migrate
```

This connects to MySQL and creates every table (`users`, `projects`,
`queues`, `retry_policies`, `jobs`, `workers`, `worker_heartbeats`,
`job_executions`, `job_logs`, `scheduled_jobs`, `dead_letter_queue`) with the
correct columns, foreign keys, indexes, and ENUMs.

## 11. Seed data

Still from `backend`:

```bash
npm run seed
```

This creates:
- A demo user: **demo@scheduler.local / Password123!**
- A demo project ("Demo Project")
- A default retry policy (exponential backoff, 5 attempts)
- A default queue ("default") using that policy

## 12. How to start backend

```bash
cd backend
npm run dev      # auto-restarts on file changes (nodemon)
# or: npm start  # plain node, no auto-restart
```

You should see:

```
Database connection established.
API server listening on http://localhost:5000
```

Verify with: `curl http://localhost:5000/health`

## 13. How to start worker

In a **separate terminal**:

```bash
cd worker
npm start
```

You should see:

```
[worker] database connection established.
[worker] registered as <hostname>-<pid>-<id> (id=1, concurrency=4)
[worker] polling every 2000ms, heartbeat every 10000ms
```

You can start more than one worker process (in more terminals) to see
multiple entries on the Workers dashboard page and to confirm no two workers
ever claim the same job.

## 14. How to start frontend

In a **third terminal**:

```bash
cd frontend
npm run dev
```

Open the printed URL (default `http://localhost:5173`) and log in with the
seeded demo account.

## 15. Test login credentials

```
Email:    demo@scheduler.local
Password: Password123!
```

(Or register your own account from the Login page's "Register" link.)

## 16. How to create a project

Dashboard → **Projects** → fill in "New project" name/description → **Create
project**.

## 17. How to create a queue

Dashboard → **Queues** → "New queue" → pick the project, name it, set
priority/concurrency limit, optionally pick a retry policy → **Create
queue**.

## 18. How to submit a job

Dashboard → **Jobs** → "Submit a job" → pick the queue, a job `type` string
(e.g. `send_email`), a kind (Immediate/Delayed/Scheduled/Recurring/Batch),
and a JSON payload → **Submit job**. For a quick demo, use type `send_email`
with payload `{"to":"a@b.com"}`.

## 19. How to observe worker execution

With the worker terminal visible, submit a job from the dashboard — within
one poll interval (2s by default) you'll see:

```
[worker] claimed 1 job(s); active=1/4
```

and the Jobs page (which auto-refreshes every few seconds) will move the job
through `queued → claimed → running → completed`. The **Logs** page shows
per-attempt log lines in real time.

## 20. How to test retries

Submit a job whose payload includes `{"shouldFail": true}` (the built-in
`default` handler throws on this flag on purpose) with a low `max_attempts`,
e.g. `2`. Watch the Logs page: you'll see `Attempt 1 failed`, a
`Retry scheduled` line with the computed backoff delay, then `Attempt 2`.

## 21. How to test Dead Letter Queue

Use the same `{"shouldFail": true}` payload but let it exhaust all attempts
(e.g. `max_attempts: 1` or wait through all retries). The job's status
becomes `dead_letter` and an entry appears on the **Dead Letter Queue** page
with the failure reason and a snapshot of the original payload. Click
**Retry job** there to re-queue it with a reset attempt counter.

## 22. Common errors and fixes

| Error                                                        | Fix                                                                                          |
|----------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| `Access denied for user 'root'@'localhost'`                   | Check `DB_USER`/`DB_PASSWORD` in `backend/.env` match your MySQL setup.                        |
| `ECONNREFUSED 127.0.0.1:3306`                                  | MySQL isn't running — start it (Windows: Services app → MySQL80; or `net start MySQL80`).      |
| `Unknown database 'job_scheduler'`                             | Run the `CREATE DATABASE job_scheduler;` step before `npm run migrate`.                        |
| Frontend shows "Network Error" / CORS errors                  | Confirm the backend is running on port 5000 and `VITE_API_BASE_URL` in `frontend/.env` matches. |
| `Cannot find module '../../backend/src/models'` when starting worker | Make sure `backend/` and `worker/` sit side-by-side inside the same project folder (don't move `worker/` elsewhere). |
| Login works but dashboard shows 401 after a while              | JWT expired — log in again, or increase `JWT_EXPIRES_IN` in `backend/.env`.                     |
| `EADDRINUSE: address already in use :::5000`                  | Another process is using port 5000 — stop it, or change `PORT` in `backend/.env`.               |

## 23. Commands to run in the correct order

```bash
# 1) One-time setup
mysql -u root -p -e "CREATE DATABASE job_scheduler;"

cd backend  && npm install && copy .env.example .env   # then edit .env
cd ..\frontend && npm install && copy .env.example .env
cd ..\worker   && npm install

# 2) Build the schema + demo data (from backend/)
cd ..\backend
npm run migrate
npm run seed

# 3) Run the three apps (each in its own terminal, from the project root)
cd backend  && npm run dev
cd worker   && npm start
cd frontend && npm run dev

# 4) Open the app
#    http://localhost:5173  ->  log in with demo@scheduler.local / Password123!
```

## Running backend tests

```bash
cd backend
npm test
```

Requires the same MySQL database from step 4 to be reachable (tests hit the
real API + database, they don't mock Sequelize).

## Project structure

```
distributed-job-scheduler/
├── backend/    # Express API (MVC: controllers, models, routes, middlewares, services, config, utils)
├── worker/     # Standalone polling worker + job handlers + scheduler sweep
├── frontend/   # React (Vite) + Tailwind dashboard
└── docs/       # Architecture, ER diagram, API reference, design decisions, database design
```
