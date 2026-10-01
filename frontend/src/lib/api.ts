import type { Article, Category, Tag, PaginatedResponse } from '../types';

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
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

