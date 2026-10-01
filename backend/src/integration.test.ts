import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './app.js';
import pool from './config/db.js';

let adminToken: string;
let articleId: string;
let categoryId: string;
let tagId: string;

describe('Integration Tests (Live DB)', () => {
  beforeAll(async () => {
    // Verify DB connection
    const res = await pool.query('SELECT 1');
    expect(res.rows[0]).toEqual({ '?column?': 1 });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Auth', () => {
    it('POST /api/auth/login with valid credentials returns token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('username', 'admin');
      expect(res.body.data.user).toHaveProperty('role', 'admin');
      adminToken = res.body.data.token;
    });

    it('POST /api/auth/login with wrong password returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns current user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('username', 'admin');
    });
  });

  describe('Categories CRUD', () => {
    it('GET /api/categories lists seeded categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      categoryId = res.body.data[0].id;
    });

    it('POST /api/categories creates new category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category', slug: 'test-category' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      categoryId = res.body.data.id;
    });

    it('PATCH /api/categories/:id updates category', async () => {
      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated desc' });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated desc');
    });

    it('DELETE /api/categories/:id deletes category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([204, 200]).toContain(res.status);
    });
  });

  describe('Tags CRUD', () => {
    it('GET /api/tags lists seeded tags', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      tagId = res.body.data[0].id;
    });

    it('POST /api/tags creates new tag', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Tag', slug: 'test-tag' });
      expect(res.status).toBe(201);
      tagId = res.body.data.id;
    });

    it('DELETE /api/tags/:id deletes tag', async () => {
      const res = await request(app)
        .delete(`/api/tags/${tagId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([204, 200]).toContain(res.status);
    });
  });

  describe('Articles CRUD + Search', () => {
    it('POST /api/articles creates article with auto-slug', async () => {
      const cats = await request(app).get('/api/categories');
      const catId = cats.body.data[0]?.id;
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Integration Test Article',
          content: 'This is test content for integration testing.',
          categoryId: catId,
          status: 'published',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'integration-test-article');
      expect(res.body.data).toHaveProperty('authorName', 'admin');
      articleId = res.body.data.id;
    });

    it('GET /api/articles lists published articles', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body).toHaveProperty('meta');
    });

    it('GET /api/articles/:slug returns published article', async () => {
      const res = await request(app).get('/api/articles/integration-test-article');
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Integration Test Article');
    });

    it('GET /api/search?q=test finds article', async () => {
      const res = await request(app).get('/api/search?q=test');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/articles/:id updates article', async () => {
      const res = await request(app)
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ excerpt: 'Updated excerpt' });
      expect(res.status).toBe(200);
      expect(res.body.data.excerpt).toBe('Updated excerpt');
    });

    it('DELETE /api/articles/:id deletes article', async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([204, 200]).toContain(res.status);
    });
  });

  describe('SEO', () => {
    it('GET /api/sitemap.xml returns XML', async () => {
      const res = await request(app).get('/api/sitemap.xml');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/xml/);
    });

    it('GET /api/robots.txt returns text', async () => {
      const res = await request(app).get('/api/robots.txt');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sitemap:');
    });
  });
});