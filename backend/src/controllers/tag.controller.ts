import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tag.service.js';

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val || '');
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tagService.listTags();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await tagService.getTagBySlug(paramStr(req.params.slug));
    res.json({ data: tag });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await tagService.createTag(req.body);
    res.status(201).json({ data: tag });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await tagService.updateTag(paramStr(req.params.slug), req.body);
    res.json({ data: tag });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await tagService.deleteTag(paramStr(req.params.slug));
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}