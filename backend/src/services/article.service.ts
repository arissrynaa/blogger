import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import slugify from 'slugify';

// C8: auto-generate slug from title if omitted
function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}

// C7: shape article response with embedded category, tags, author
async function formatArticle(row: any) {
  const catResult = row.category_id
    ? await pool.query('SELECT id, name, slug, description FROM categories WHERE id = $1', [row.category_id])
    : null;
  const category = catResult && catResult.rows.length > 0 ? catResult.rows[0] : null;

  const tagResult = await pool.query(
    `SELECT t.id, t.name, t.slug FROM tags t
     JOIN article_tags at ON t.id = at.tag_id
     WHERE at.article_id = $1 ORDER BY t.name`,
    [row.id]
  );

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content,
    featuredImageUrl: row.featured_image_url || null,
    category,
    tags: tagResult.rows,
    authorName: row.author_name,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

// C2: public listing filters status='published' by default
export async function listArticles(query: { page: number; limit: number; category?: string; tag?: string; status?: string }) {
  const offset = (query.page - 1) * query.limit;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  // C2: default to published for public
  if (query.status) {
    conditions.push(`a.status = $${paramIdx++}`);
    params.push(query.status);
  } else {
    conditions.push("a.status = 'published'");
  }

  if (query.category) {
    conditions.push(`c.slug = $${paramIdx++}`);
    params.push(query.category);
  }

  if (query.tag) {
    conditions.push(`t.slug = $${paramIdx++}`);
    params.push(query.tag);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(DISTINCT a.id) as total
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN article_tags at2 ON a.id = at2.article_id
    LEFT JOIN tags t ON at2.tag_id = t.id
    ${where}
  `;
  const countResult = await pool.query(countSql, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);

  const dataSql = `
    SELECT DISTINCT a.*
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN article_tags at2 ON a.id = at2.article_id
    LEFT JOIN tags t ON at2.tag_id = t.id
    ${where}
    ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;
  params.push(query.limit, offset);
  const dataResult = await pool.query(dataSql, params);

  const data = await Promise.all(dataResult.rows.map(formatArticle));

  return {
    data,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

// C2: public get by slug only returns published
export async function getArticleBySlug(slug: string) {
  const result = await pool.query(
    "SELECT * FROM articles WHERE slug = $1 AND status = 'published'",
    [slug]
  );
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Article not found');
  return formatArticle(result.rows[0]);
}

// C6/M6: admin get by id (UUID)
export async function getArticleById(id: string) {
  const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Article not found');
  return formatArticle(result.rows[0]);
}

// C1: author_name not author_id; C8: auto-slug
export async function createArticle(data: any, authorName: string) {
  const slug = data.slug || generateSlug(data.title);

  // Check unique slug
  const existing = await pool.query('SELECT id FROM articles WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    throw new AppError(409, 'CONFLICT', 'Article with this slug already exists');
  }

  // Validate category if provided
  if (data.categoryId) {
    const cat = await pool.query('SELECT id FROM categories WHERE id = $1', [data.categoryId]);
    if (cat.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  // Validate tags if provided
  if (data.tagIds && data.tagIds.length > 0) {
    const tagCheck = await pool.query('SELECT id FROM tags WHERE id = ANY($1::uuid[])', [data.tagIds]);
    if (tagCheck.rows.length !== data.tagIds.length) {
      throw new AppError(422, 'VALIDATION_ERROR', 'One or more tags not found');
    }
  }

  const publishedAt = data.status === 'published' ? new Date() : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO articles (title, slug, excerpt, content, featured_image_url, status, category_id, author_name, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.title, slug, data.excerpt || '', data.content, data.featuredImageUrl || null, data.status || 'draft', data.categoryId || null, authorName, publishedAt]
    );
    const article = result.rows[0];

    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        await client.query('INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)', [article.id, tagId]);
      }
    }
    await client.query('COMMIT');
    return formatArticle(article);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// C4: update by id (UUID)
export async function updateArticle(id: string, data: any) {
  const existing = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Article not found');

  if (data.slug) {
    const dup = await pool.query('SELECT id FROM articles WHERE slug = $1 AND id != $2', [data.slug, id]);
    if (dup.rows.length > 0) throw new AppError(409, 'CONFLICT', 'Slug already in use');
  }

  if (data.categoryId) {
    const cat = await pool.query('SELECT id FROM categories WHERE id = $1', [data.categoryId]);
    if (cat.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  if (data.tagIds && data.tagIds.length > 0) {
    const tagCheck = await pool.query('SELECT id FROM tags WHERE id = ANY($1::uuid[])', [data.tagIds]);
    if (tagCheck.rows.length !== data.tagIds.length) {
      throw new AppError(422, 'VALIDATION_ERROR', 'One or more tags not found');
    }
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  const mapping: Record<string, string> = {
    title: 'title', slug: 'slug', excerpt: 'excerpt', content: 'content',
    featuredImageUrl: 'featured_image_url', categoryId: 'category_id', status: 'status',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push((data as any)[key]);
    }
  }

  if (data.status === 'published' && existing.rows[0].status !== 'published') {
    fields.push(`published_at = $${idx++}`);
    values.push(new Date());
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE articles SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }

    if (data.tagIds) {
      await client.query('DELETE FROM article_tags WHERE article_id = $1', [id]);
      for (const tagId of data.tagIds) {
        await client.query('INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)', [id, tagId]);
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getArticleById(id);
}

// C4: delete by id (UUID)
export async function deleteArticle(id: string) {
  const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'Article not found');
  return { success: true };
}

// C5: search endpoint using ILIKE on published articles
export async function searchArticles(q: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const pattern = `%${q}%`;

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM articles
     WHERE status = 'published' AND (title ILIKE $1 OR excerpt ILIKE $1 OR content ILIKE $1)`,
    [pattern]
  );
  const total = parseInt(countResult.rows[0]?.total || '0', 10);

  const dataResult = await pool.query(
    `SELECT * FROM articles
     WHERE status = 'published' AND (title ILIKE $1 OR excerpt ILIKE $1 OR content ILIKE $1)
     ORDER BY published_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [pattern, limit, offset]
  );

  const data = await Promise.all(dataResult.rows.map(formatArticle));
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}