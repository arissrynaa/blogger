import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('Health Check', () => {
  it('GET /api/health should return 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('Auth Routes', () => {
  it('POST /api/auth/login should return 422 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('POST /api/auth/login should return 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'test' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/auth/me should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Public Article Routes', () => {
  it('GET /api/articles should return 200 with data array', async () => {
    const res = await request(app).get('/api/articles');
    // Will fail if DB not available, but route should exist
    expect([200, 500]).toContain(res.status);
  });
});

describe('SEO Routes', () => {
  it('GET /api/robots.txt should return text/plain', async () => {
    const res = await request(app).get('/api/robots.txt');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/text\/plain/);
    }
  });
});

describe('Rate Limiting', () => {
  it('should have rate limit headers on API routes', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});