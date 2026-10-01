import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listCategories() {
  const result = await pool.query('SELECT id, name, slug, description FROM categories ORDER BY name');
  return { data: result.rows };
}

export async function getCategoryBySlug(slug: string) {
  const result = await pool.query('SELECT id, name, slug, description FROM categories WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  return result.rows[0];
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  const result = await pool.query(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
    [data.name, data.slug, data.description || '']
  );
  return result.rows[0];
}

export async function updateCategory(slug: string, data: Partial<{ name: string; slug: string; description: string }>) {
  const existing = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const key of ['name', 'slug', 'description']) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push((data as any)[key]);
    }
  }
  if (fields.length === 0) return getCategoryBySlug(slug);
  values.push(slug);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE slug = $${idx}`, values);
  return getCategoryBySlug(data.slug || slug);
}

export async function deleteCategory(slug: string) {
  const result = await pool.query('DELETE FROM categories WHERE slug = $1 RETURNING id', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  return { success: true };
}