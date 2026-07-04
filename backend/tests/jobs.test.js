const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

describe('Projects, Queues & Jobs API', () => {
  const uniqueEmail = `flow_${Date.now()}@scheduler.local`;
  let token;
  let projectId;
  let queueId;
  let jobId;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow User',
      email: uniqueEmail,
      password: 'Password123!'
    });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'created by jest' });

    expect(res.statusCode).toBe(201);
    projectId = res.body.data.id;
    expect(projectId).toBeDefined();
  });

  it('creates a queue under the project', async () => {
    const res = await request(app)
      .post('/api/queues')
      .set('Authorization', `Bearer ${token}`)
      .send({ project_id: projectId, name: 'default', priority: 5, concurrency_limit: 3 });

    expect(res.statusCode).toBe(201);
    queueId = res.body.data.id;
    expect(queueId).toBeDefined();
  });

  it('creates an immediate job on the queue', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ queue_id: queueId, type: 'send_email', payload: { to: 'a@b.com' } });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('queued');
    jobId = res.body.data.id;
  });

  it('lists jobs filtered by queue', async () => {
    const res = await request(app)
      .get(`/api/jobs?queueId=${queueId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('pauses and resumes the queue', async () => {
    const pauseRes = await request(app)
      .patch(`/api/queues/${queueId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paused' });
    expect(pauseRes.body.data.status).toBe('paused');

    const resumeRes = await request(app)
      .patch(`/api/queues/${queueId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });
    expect(resumeRes.body.data.status).toBe('active');
  });

  it('cancels the job', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('rejects an invalid recurring job (bad cron)', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ queue_id: queueId, type: 'report', job_kind: 'recurring', cron_expression: 'not-a-cron' });

    expect(res.statusCode).toBe(422);
  });
});
