import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      throw parsed.error;
    }
    // Express 5 makes req.query read-only; attach validated data to a safe location
    if (source === 'query') {
      (req as any).validatedQuery = parsed.data;
    } else if (source === 'params') {
      (req as any).validatedParams = parsed.data;
    } else {
      req.body = parsed.data;
    }
    next();
  };
}