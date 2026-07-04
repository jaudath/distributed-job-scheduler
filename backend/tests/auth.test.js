const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

describe('Auth API', () => {
  const uniqueEmail = `test_${Date.now()}@scheduler.local`;

  afterAll(async () => {
    await sequelize.close();
  });

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: uniqueEmail,
      password: 'Password123!'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: uniqueEmail,
      password: 'Password123!'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'Password123!'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'WrongPassword!'
    });

    expect(res.statusCode).toBe(401);
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
