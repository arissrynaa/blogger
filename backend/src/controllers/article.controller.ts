import { Request, Response, NextFunction } from 'express';
import * as articleService from '../services/article.service.js';

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val || '');
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req as any).validatedQuery || req.query;
    const result = await articleService.listArticles({
      page: q.page,
      limit: q.limit,
      category: q.category as string | undefined,
      tag: q.tag as string | undefined,
      status: q.status as string | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const article = await articleService.getArticleBySlug(paramStr(req.params.slug));
    res.json({ data: article });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const article = await articleService.createArticle(req.body, req.user!.userId);
    res.status(201).json({ data: article });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const article = await articleService.updateArticle(paramStr(req.params.slug), req.body);
    res.json({ data: article });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await articleService.deleteArticle(paramStr(req.params.slug));
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req as any).validatedQuery || req.query;
    const result = await articleService.searchArticles(
      q.q as string,
      q.page,
      q.limit
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}