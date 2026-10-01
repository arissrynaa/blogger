import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listTags() {
  const result = await pool.query('SELECT id, name, slug FROM tags ORDER BY name');
  return { data: result.rows };
}

export async function getTagBySlug(slug: string) {
  const result = await pool.query('SELECT id, name, slug FROM tags WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  return result.rows[0];
}

export async function createTag(data: { name: string; slug: string }) {
  const result = await pool.query('INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING *', [data.name, data.slug]);
  return result.rows[0];
}

export async function updateTag(slug: string, data: Partial<{ name: string; slug: string }>) {
  const existing = await pool.query('SELECT id FROM tags WHERE slug = $1', [slug]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const key of ['name', 'slug']) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push((data as any)[key]);
    }
  }
  if (fields.length === 0) return getTagBySlug(slug);
  values.push(slug);
  await pool.query(`UPDATE tags SET ${fields.join(', ')} WHERE slug = $${idx}`, values);
  return getTagBySlug(data.slug || slug);
}

export async function deleteTag(slug: string) {
  const result = await pool.query('DELETE FROM tags WHERE slug = $1 RETURNING id', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  return { success: true };
}