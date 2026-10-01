import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import slugify from 'slugify';

function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export async function listTags() {
  const result = await pool.query('SELECT id, name, slug, created_at, updated_at FROM tags ORDER BY name');
  return { data: result.rows };
}

export async function getTagBySlug(slug: string) {
  const result = await pool.query('SELECT * FROM tags WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  const tag = result.rows[0];
  const articles = await pool.query(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.published_at, a.updated_at
     FROM articles a JOIN article_tags at ON a.id = at.article_id
     WHERE at.tag_id = $1 AND a.status = 'published' ORDER BY a.published_at DESC`,
    [tag.id]
  );
  return { ...tag, articles: articles.rows };
}

// C4: admin get by id
export async function getTagById(id: string) {
  const result = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  return result.rows[0];
}

// C8: auto-slug for tags
export async function createTag(data: { name: string; slug?: string }) {
  const slug = data.slug || generateSlug(data.name);
  const existing = await pool.query('SELECT id FROM tags WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) throw new AppError(409, 'CONFLICT', 'Tag with this slug already exists');
  const result = await pool.query('INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING *', [data.name, slug]);
  return result.rows[0];
}

// C4: update by id
export async function updateTag(id: string, data: Partial<{ name: string; slug: string }>) {
  const existing = await pool.query('SELECT id FROM tags WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  if (data.slug) {
    const dup = await pool.query('SELECT id FROM tags WHERE slug = $1 AND id != $2', [data.slug, id]);
    if (dup.rows.length > 0) throw new AppError(409, 'CONFLICT', 'Slug already in use');
  }
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const key of ['name', 'slug']) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push((data as any)[key]);
    }
  }
  if (fields.length === 0) return getTagById(id);
  values.push(id);
  await pool.query(`UPDATE tags SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  return getTagById(id);
}

// C4: delete by id
export async function deleteTag(id: string) {
  const existing = await pool.query('SELECT id FROM tags WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Tag not found');
  await pool.query('DELETE FROM tags WHERE id = $1', [id]);
  return { success: true };
}
