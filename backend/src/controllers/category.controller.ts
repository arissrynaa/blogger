import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service.js';

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val || '');
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await categoryService.listCategories();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.getCategoryBySlug(paramStr(req.params.slug));
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

// C4: update by id
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.updateCategory(paramStr(req.params.id), req.body);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

// C4: delete by id
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(paramStr(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
