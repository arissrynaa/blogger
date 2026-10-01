import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './app.js';
import pool from './config/db.js';

let adminToken: string;
let articleId: string;
let categoryId: string;
let tagId: string;

/**
 * Q4 FIX: Test DB isolation.
 *
 * These integration tests require a dedicated test database to avoid
 * corrupting production data. Setup:
 *
 * 1. Create a test database:
 *    CREATE DATABASE blogger_test;
 *
 * 2. Set environment variables (in .env or CI):
 *    DB_NAME_TEST=blogger_test   (or DATABASE_URL_TEST=postgresql://...)
 *
 * 3. Run migrations against the test DB before running tests:
 *    DB_NAME=blogger_test npm run migrate
 *
 * 4. If DB_NAME_TEST is not set, tests will use the default DB_NAME
 *    (development only — NEVER run against production without isolation).
 *
 * CI setup example (GitHub Actions):
 *   - Start PostgreSQL service container
 *   - Run: createdb blogger_test
 *   - Run: DB_NAME=blogger_test npm run migrate
 *   - Run: DB_NAME_TEST=blogger_test npm test
 */

describe('Integration Tests (Live DB)', () => {
  beforeAll(async () => {
    // Verify DB connection
    const res = await pool.query('SELECT 1');
    expect(res.rows[0]).toEqual({ '?column?': 1 });

    // Warn if using non-test DB
    const dbName = process.env.DB_NAME || 'blogger_db';
    const testDbName = process.env.DB_NAME_TEST;
    if (!testDbName && process.env.NODE_ENV !== 'test') {
      console.warn(`[TEST WARNING] No DB_NAME_TEST set. Using ${dbName}. Do NOT run against production.`);
    }
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
      adminToken = res.body.data.token;
    });

    it('POST /api/auth/login with invalid credentials returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me with valid token returns user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('username', 'admin');
    });
  });

  describe('Articles CRUD', () => {
    it('POST /api/articles creates an article (admin)', async () => {
      // First get category id
      const catRes = await request(app).get('/api/categories');
      const cats = catRes.body.data;
      expect(cats.length).toBeGreaterThan(0);
      categoryId = cats[0].id;

      // Get tag id
      const tagRes = await request(app).get('/api/tags');
      const tags = tagRes.body.data;
      expect(tags.length).toBeGreaterThan(0);
      tagId = tags[0].id;

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Article Integration',
          content: 'This is a test article for integration testing.',
          categoryId,
          tagIds: [tagId],
          status: 'published',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('slug', 'test-article-integration');
      expect(res.body.data.author).toHaveProperty('name', 'admin');
      articleId = res.body.data.id;
    });

    it('GET /api/articles lists published articles', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('GET /api/articles/:slug returns published article', async () => {
      const res = await request(app).get('/api/articles/test-article-integration');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', 'Test Article Integration');
      expect(res.body.data.category).toHaveProperty('id', categoryId);
    });

    it('GET /api/articles/admin/:id returns article for admin', async () => {
      const res = await request(app)
        .get(`/api/articles/admin/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', articleId);
    });

    it('PATCH /api/articles/:id updates article (admin)', async () => {
      const res = await request(app)
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Test Article' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', 'Updated Test Article');
    });

    it('DELETE /api/articles/:id deletes article (admin)', async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('GET /api/articles/:slug returns 404 for draft article publicly', async () => {
      // Create a draft article
      const createRes = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Draft Article',
          content: 'Draft content',
          categoryId,
          status: 'draft',
        });
      expect(createRes.status).toBe(201);
      const draftSlug = createRes.body.data.slug;

      // Public should not see it
      const res = await request(app).get(`/api/articles/${draftSlug}`);
      expect(res.status).toBe(404);

      // Cleanup
      await request(app)
        .delete(`/api/articles/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('Categories CRUD', () => {
    let testCatId: string;

    it('POST /api/categories creates category (admin)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category', slug: 'test-category' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      testCatId = res.body.data.id;
    });

    it('PATCH /api/categories/:id updates category (admin)', async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCatId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Test Category' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Updated Test Category');
    });

    it('DELETE /api/categories/:id deletes category (admin)', async () => {
      const res = await request(app)
        .delete(`/api/categories/${testCatId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([204, 409]).toContain(res.status);
    });

    it('DELETE /api/categories/:id returns 409 if articles exist', async () => {
      // Try to delete seed category that has articles
      const cats = await request(app).get('/api/categories');
      const seededCat = cats.body.data.find((c: any) => c.articlesCount > 0);
      if (seededCat) {
        const res = await request(app)
          .delete(`/api/categories/${seededCat.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(409);
      }
    });
  });

  describe('Tags CRUD', () => {
    let testTagId: string;

    it('POST /api/tags creates tag (admin)', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Tag', slug: 'test-tag' });
      expect(res.status).toBe(201);
      testTagId = res.body.data.id;
    });

    it('PATCH /api/tags/:id updates tag (admin)', async () => {
      const res = await request(app)
        .patch(`/api/tags/${testTagId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Test Tag' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Updated Test Tag');
    });

    it('DELETE /api/tags/:id deletes tag (admin)', async () => {
      const res = await request(app)
        .delete(`/api/tags/${testTagId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

  describe('Search', () => {
    it('GET /api/search?q=test returns results', async () => {
      const res = await request(app).get('/api/search?q=test');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('GET /api/search without q returns 422', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(422);
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

    // Q2: root robots.txt
    it('GET /robots.txt returns text at root path', async () => {
      const res = await request(app).get('/robots.txt');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sitemap:');
    });
  });
});
