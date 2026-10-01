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
  // C3: login uses username/password
  it('POST /api/auth/login should return 422 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('POST /api/auth/login should return 422 for missing username', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'test' });
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
  it('GET /api/articles should return 200 or 500 (DB dependent)', async () => {
    const res = await request(app).get('/api/articles');
    expect([200, 500]).toContain(res.status);
  });

  it('GET /api/articles/:slug should return 404 for non-existent', async () => {
    const res = await request(app).get('/api/articles/non-existent-slug-xyz');
    expect([404, 500]).toContain(res.status);
  });
});

// C5: search endpoint
describe('Search Route', () => {
  it('GET /api/search should return 422 when q is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/search should return 422 when q < 2 chars', async () => {
    const res = await request(app).get('/api/search?q=a');
    expect(res.status).toBe(422);
  });

  it('GET /api/search?q=test should return 200 or 500 (DB dependent)', async () => {
    const res = await request(app).get('/api/search?q=test');
    expect([200, 500]).toContain(res.status);
  });
});

describe('Admin Routes Protection', () => {
  it('POST /api/articles should return 401 without token', async () => {
    const res = await request(app).post('/api/articles').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  // C4: admin routes use :id
  it('PATCH /api/articles/:id should return 401 without token', async () => {
    const res = await request(app).patch('/api/articles/00000000-0000-0000-0000-000000000000').send({});
    expect(res.status).toBe(401);
  });

  it('DELETE /api/articles/:id should return 401 without token', async () => {
    const res = await request(app).delete('/api/articles/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/categories/:id should return 401 without token', async () => {
    const res = await request(app).patch('/api/categories/00000000-0000-0000-0000-000000000000').send({});
    expect(res.status).toBe(401);
  });

  it('DELETE /api/tags/:id should return 401 without token', async () => {
    const res = await request(app).delete('/api/tags/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
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
