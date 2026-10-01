import { Request, Response } from 'express';
import pool from '../config/db.js';
import { env } from '../config/env.js';

export async function sitemapXml(_req: Request, res: Response) {
  const result = await pool.query(
    "SELECT slug, updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC"
  );
  const baseUrl = env.baseUrl;
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${baseUrl}/</loc></url>\n`;
  for (const row of result.rows) {
    const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : '';
    xml += `  <url><loc>${baseUrl}/article/${row.slug}</loc>`;
    if (lastmod) xml += `<lastmod>${lastmod}</lastmod>`;
    xml += `</url>\n`;
  }
  xml += '</urlset>';
  res.type('application/xml').send(xml);
}

export async function robotsTxt(_req: Request, res: Response) {
  const baseUrl = env.baseUrl;
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/api/sitemap.xml\n`;
  res.type('text/plain').send(txt);
}