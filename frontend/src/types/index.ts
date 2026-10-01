export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  category: Category | null;
  tags: Tag[];
  author: Author;
  status: 'draft' | 'published';
  publishedAt: string | null;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  name: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface User {
  id: string;
  username: string;
  role: 'admin';
}

export interface LoginResponse {
  data: {
    token: string;
    user: User;
  };
}

export interface ArticleInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
  status?: 'draft' | 'published';
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface TagInput {
  name: string;
  slug?: string;
}

