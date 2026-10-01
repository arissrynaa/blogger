import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import slugify from 'slugify';

function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export async function listCategories() {
  const result = await pool.query(
    `SELECT c.id, c.name, c.slug, c.description, c.created_at, c.updated_at,
            COUNT(a.id)::int as "articlesCount"
     FROM categories c
     LEFT JOIN articles a ON a.category_id = c.id
     GROUP BY c.id ORDER BY c.name`
  );
  return { data: result.rows };
}

export async function getCategoryBySlug(slug: string) {
  const result = await pool.query('SELECT * FROM categories WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  const cat = result.rows[0];
  const articles = await pool.query(
    `SELECT id, title, slug, excerpt, featured_image_url, published_at, updated_at
     FROM articles WHERE category_id = $1 AND status = 'published' ORDER BY published_at DESC`,
    [cat.id]
  );
  return { ...cat, articles: articles.rows };
}

// C4: admin get by id
export async function getCategoryById(id: string) {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  return result.rows[0];
}

// C8: auto-slug for categories
export async function createCategory(data: { name: string; slug?: string; description?: string }) {
  const slug = data.slug || generateSlug(data.name);
  const existing = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) throw new AppError(409, 'CONFLICT', 'Category with this slug already exists');
  const result = await pool.query(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
    [data.name, slug, data.description || null]
  );
  return result.rows[0];
}

// C4: update by id
export async function updateCategory(id: string, data: Partial<{ name: string; slug: string; description: string }>) {
  const existing = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  if (data.slug) {
    const dup = await pool.query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [data.slug, id]);
    if (dup.rows.length > 0) throw new AppError(409, 'CONFLICT', 'Slug already in use');
  }
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const key of ['name', 'slug', 'description']) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push((data as any)[key]);
    }
  }
  if (fields.length === 0) return getCategoryById(id);
  values.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  return getCategoryById(id);
}

// C4: delete by id; C9: 409 if articles exist
export async function deleteCategory(id: string) {
  const existing = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  const articles = await pool.query('SELECT COUNT(*) as cnt FROM articles WHERE category_id = $1', [id]);
  if (parseInt(articles.rows[0].cnt, 10) > 0) {
    throw new AppError(409, 'CONFLICT', 'Cannot delete category with existing articles');
  }
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  return { success: true };
}
