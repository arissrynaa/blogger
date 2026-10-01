import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listArticles(query: { page: number; limit: number; category?: string; tag?: string; status?: string }) {
  const offset = (query.page - 1) * query.limit;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

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
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    ${where}
  `;
  const countResult = await pool.query(countSql, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataSql = `
    SELECT DISTINCT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.status, a.published_at, a.updated_at,
           c.name as category_name, c.slug as category_slug,
           u.name as author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    ${where}
    ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;
  params.push(query.limit, offset);
  const dataResult = await pool.query(dataSql, params);

  // Attach tags to each article
  const articles = dataResult.rows;
  if (articles.length > 0) {
    const ids = articles.map((a: any) => a.id);
    const tagsResult = await pool.query(
      `SELECT at.article_id, t.name, t.slug FROM article_tags at JOIN tags t ON at.tag_id = t.id WHERE at.article_id = ANY($1)`,
      [ids]
    );
    const tagMap = new Map<string, { name: string; slug: string }[]>();
    for (const row of tagsResult.rows) {
      if (!tagMap.has(row.article_id)) tagMap.set(row.article_id, []);
      tagMap.get(row.article_id)!.push({ name: row.name, slug: row.slug });
    }
    for (const article of articles) {
      article.tags = tagMap.get(article.id) || [];
      article.category = article.category_name ? { name: article.category_name, slug: article.category_slug } : null;
      article.author = article.author_name ? { name: article.author_name } : null;
      delete article.category_name;
      delete article.category_slug;
      delete article.author_name;
    }
  }

  return {
    data: articles,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getArticleBySlug(slug: string) {
  const result = await pool.query(
    `SELECT a.*, c.name as category_name, c.slug as category_slug, u.name as author_name
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     LEFT JOIN users u ON a.author_id = u.id
     WHERE a.slug = $1`,
    [slug]
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Article not found');
  }
  const article = result.rows[0];
  const tagsResult = await pool.query(
    `SELECT t.name, t.slug FROM article_tags at JOIN tags t ON at.tag_id = t.id WHERE at.article_id = $1`,
    [article.id]
  );
  article.tags = tagsResult.rows;
  article.category = article.category_name ? { name: article.category_name, slug: article.category_slug } : null;
  article.author = article.author_name ? { name: article.author_name } : null;
  delete article.category_name;
  delete article.category_slug;
  delete article.author_name;
  return article;
}

export async function createArticle(data: any, authorId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO articles (title, slug, excerpt, content, featured_image_url, category_id, author_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.title, data.slug, data.excerpt || '', data.content, data.featuredImageUrl || null, data.categoryId, authorId, data.status || 'draft']
    );
    const article = result.rows[0];
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        await client.query('INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)', [article.id, tagId]);
      }
    }
    await client.query('COMMIT');
    return getArticleBySlug(article.slug);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateArticle(slug: string, data: any) {
  const existing = await pool.query('SELECT id FROM articles WHERE slug = $1', [slug]);
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Article not found');
  }
  const id = existing.rows[0].id;
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const map: Record<string, string> = {
    title: 'title', slug: 'slug', excerpt: 'excerpt', content: 'content',
    featuredImageUrl: 'featured_image_url', categoryId: 'category_id', status: 'status',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key]);
    }
  }
  if (fields.length > 0) {
    fields.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(`UPDATE articles SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }

  if (data.tagIds !== undefined) {
    await pool.query('DELETE FROM article_tags WHERE article_id = $1', [id]);
    for (const tagId of data.tagIds) {
      await pool.query('INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)', [id, tagId]);
    }
  }

  return getArticleBySlug(data.slug || slug);
}

export async function deleteArticle(slug: string) {
  const result = await pool.query('DELETE FROM articles WHERE slug = $1 RETURNING id', [slug]);
  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Article not found');
  }
  return { success: true };
}

export async function searchArticles(q: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const pattern = `%${q}%`;
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM articles WHERE status = 'published' AND (title ILIKE $1 OR excerpt ILIKE $1 OR content ILIKE $1)`,
    [pattern]
  );
  const total = parseInt(countResult.rows[0].total, 10);
  const dataResult = await pool.query(
    `SELECT id, title, slug, excerpt, featured_image_url, published_at, updated_at
     FROM articles
     WHERE status = 'published' AND (title ILIKE $1 OR excerpt ILIKE $1 OR content ILIKE $1)
     ORDER BY published_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [pattern, limit, offset]
  );
  return {
    data: dataResult.rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}