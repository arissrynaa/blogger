import { z } from 'zod';

// C3: login uses username/password per contract
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// M8: slug optional, auto-generated from title if omitted
export const articleCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  excerpt: z.string().max(500).optional().default(''),
  content: z.string().min(1),
  featuredImageUrl: z.string().url().nullable().optional().default(null),
  categoryId: z.string().uuid().nullable().optional().default(null),
  tagIds: z.array(z.string().uuid()).optional().default([]),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const articleUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  featuredImageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().optional().default(''),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().optional(),
});

export const tagCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
});

export const tagUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// C5: search requires q with min 2 chars per contract
export const searchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(200),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
