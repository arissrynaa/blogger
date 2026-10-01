import type {
  Article,
  Category,
  Tag,
  PaginatedResponse,
  LoginResponse,
  User,
  ArticleInput,
  CategoryInput,
  TagInput,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setAdminToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function clearAdminToken() {
  localStorage.removeItem('admin_token');
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (!options?.skipAuth) {
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export function getArticles(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.category) qs.set('category', params.category);
  if (params?.tag) qs.set('tag', params.tag);
  const query = qs.toString();
  return fetchApi<PaginatedResponse<Article>>(
    `/api/articles${query ? `?${query}` : ''}`
  );
}

export function getArticleBySlug(slug: string) {
  return fetchApi<{ data: Article }>(`/api/articles/${slug}`);
}

export function getCategories() {
  return fetchApi<{ data: Category[] }>('/api/categories');
}

export function getCategoryBySlug(slug: string) {
  return fetchApi<{ data: Category }>(`/api/categories/${slug}`);
}

export function getTags() {
  return fetchApi<{ data: Tag[] }>('/api/tags');
}

export function getTagBySlug(slug: string) {
  return fetchApi<{ data: Tag }>(`/api/tags/${slug}`);
}

export function searchArticles(q: string, page?: number) {
  const qs = new URLSearchParams({ q });
  if (page) qs.set('page', String(page));
  return fetchApi<PaginatedResponse<Article>>(`/api/search?${qs.toString()}`);
}

// --- Admin Auth ---

export function login(username: string, password: string) {
  return fetchApi<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuth: true,
  });
}

export function getMe() {
  return fetchApi<{ data: User }>('/api/auth/me');
}

// --- Admin Articles ---

export function getAdminArticles(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString();
  return fetchApi<PaginatedResponse<Article>>(
    `/api/articles${query ? `?${query}` : ''}`
  );
}

export function createArticle(input: ArticleInput) {
  return fetchApi<{ data: Article }>('/api/articles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateArticle(id: string, input: Partial<ArticleInput>) {
  return fetchApi<{ data: Article }>(`/api/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteArticle(id: string) {
  return fetchApi<void>(`/api/articles/${id}`, { method: 'DELETE' });
}

// --- Admin Categories ---

export function getAdminCategories() {
  return fetchApi<{ data: Category[]; meta: unknown }>('/api/categories');
}

export function createCategory(input: CategoryInput) {
  return fetchApi<{ data: Category }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: string, input: Partial<CategoryInput>) {
  return fetchApi<{ data: Category }>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: string) {
  return fetchApi<void>(`/api/categories/${id}`, { method: 'DELETE' });
}

// --- Admin Tags ---

export function getAdminTags() {
  return fetchApi<{ data: Tag[]; meta: unknown }>('/api/tags');
}

export function createTag(input: TagInput) {
  return fetchApi<{ data: Tag }>('/api/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTag(id: string, input: Partial<TagInput>) {
  return fetchApi<{ data: Tag }>(`/api/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTag(id: string) {
  return fetchApi<void>(`/api/tags/${id}`, { method: 'DELETE' });
}