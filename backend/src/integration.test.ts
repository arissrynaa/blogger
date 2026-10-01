import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './app.js';
import pool from './config/db.js';

let adminToken: string;
let articleId: string;
let categoryId: string;
let tagId: string;

const TEST_RUN = Date.now().toString(36);
const TEST_SLUG = `test-article-integ-${TEST_RUN}`;

describe('Integration Tests (Live DB)', () => {
  beforeAll(async () => {
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
      adminToken = res.body.data.token;
    });

    it('POST /api/auth/login with invalid credentials returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns current user', async () => {
      expect(adminToken).toBeDefined();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('username', 'admin');
    });
  });

  describe('Articles CRUD', () => {
    it('POST /api/articles creates an article (admin)', async () => {
      await pool.query("DELETE FROM article_tags WHERE article_id IN (SELECT id FROM articles WHERE slug LIKE 'test-article-integ-%')");
      await pool.query("DELETE FROM articles WHERE slug LIKE 'test-article-integ-%'");

      const catRes = await request(app).get('/api/categories');
      const cats = catRes.body.data;
      expect(cats.length).toBeGreaterThan(0);
      categoryId = cats[0].id;

      const tagRes = await request(app).get('/api/tags');
      const tags = tagRes.body.data;
      expect(tags.length).toBeGreaterThan(0);
      tagId = tags[0].id;

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Article Integration',
          slug: TEST_SLUG,
          content: 'This is a test article for integration testing.',
          categoryId,
          tagIds: [tagId],
          status: 'published',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('slug', TEST_SLUG);
      expect(res.body.data).toHaveProperty('authorName', 'admin');
      articleId = res.body.data.id;
    });

    it('GET /api/articles lists published articles', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('GET /api/articles/:slug returns published article', async () => {
      const res = await request(app).get(`/api/articles/${TEST_SLUG}`);
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

      const res = await request(app).get(`/api/articles/${draftSlug}`);
      expect(res.status).toBe(404);

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

    it('DELETE /api/categories/:id returns 409 if articles exist', async () => {
      const catRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Protected Cat ${TEST_RUN}`, slug: `protected-cat-${TEST_RUN}` });
      expect(catRes.status).toBe(201);
      const protectedCatId = catRes.body.data.id;

      const artRes = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Article in Protected Cat',
          slug: `protected-art-${TEST_RUN}`,
          content: 'Content for 409 test',
          categoryId: protectedCatId,
          status: 'published',
        });
      expect(artRes.status).toBe(201);
      const protectedArtId = artRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/categories/${protectedCatId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(409);

      await request(app).delete(`/api/articles/${protectedArtId}`).set('Authorization', `Bearer ${adminToken}`);
      await request(app).delete(`/api/categories/${protectedCatId}`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('DELETE /api/categories/:id deletes empty category (admin)', async () => {
      const res = await request(app)
        .delete(`/api/categories/${testCatId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
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
      expect(res.body.data).toHaveProperty('id');
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
    it('GET /api/search?q= returns matching articles', async () => {
      const res = await request(app).get('/api/search?q=test');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
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

    it('GET /robots.txt returns text at root path', async () => {
      const res = await request(app).get('/robots.txt');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sitemap:');
    });
  });
});
