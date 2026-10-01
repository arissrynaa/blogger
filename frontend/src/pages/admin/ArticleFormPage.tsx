import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArticleBySlug,
  createArticle,
  updateArticle,
  getAdminCategories,
  getAdminTags,
} from '../../lib/api';
import type { ArticleInput } from '../../types';

export default function ArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState<ArticleInput>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    featuredImageUrl: '',
    categoryId: null,
    tagIds: [],
    status: 'draft',
  });
  const [error, setError] = useState<string | null>(null);

  // For edit mode, we need to fetch by ID. But our API uses slug for public.
  // Admin list returns full articles with IDs. We'll assume if id is passed,
  // it's a UUID and we need a dedicated admin GET endpoint or reuse list.
  // Since docs say PATCH /api/articles/:id, let's assume GET /api/articles/:id also exists for admin.
  // Fallback: we don't have getAdminArticleById in api.ts yet. Let's add inline fetch.
  
  useEffect(() => {
    if (isEdit) {
      fetch(`/api/articles/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      })
        .then((r) => r.json())
        .then((res) => {
          const a = res.data;
          setForm({
            title: a.title,
            content: a.content,
            excerpt: a.excerpt || '',
            slug: a.slug,
            featuredImageUrl: a.featuredImageUrl || '',
            categoryId: a.category?.id || null,
            tagIds: a.tags?.map((t: any) => t.id) || [],
            status: a.status,
          });
        })
        .catch(() => setError('Failed to load article'));
    }
  }, [id, isEdit]);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: getAdminTags,
  });

  const saveMutation = useMutation({
    mutationFn: isEdit
      ? (input: ArticleInput) => updateArticle(id!, input)
      : (input: ArticleInput) => createArticle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      navigate('/admin/articles');
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    saveMutation.mutate(form);
  };

  const toggleTag = (tagId: string) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds?.includes(tagId)
        ? prev.tagIds.filter((t) => t !== tagId)
        : [...(prev.tagIds || []), tagId],
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{isEdit ? 'Edit Article' : 'New Article'}</h1>
        <Link to="/admin/articles" className="text-sm text-muted hover:text-foreground">Cancel</Link>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Slug</label>
            <input
              value={form.slug || ''}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated if empty"
              className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-accent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Excerpt</label>
          <textarea
            rows={2}
            value={form.excerpt || ''}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent resize-y"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Content (Markdown)</label>
          <textarea
            required
            rows={12}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent font-mono text-sm resize-y"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Featured Image URL</label>
          <input
            type="url"
            value={form.featuredImageUrl || ''}
            onChange={(e) => setForm({ ...form, featuredImageUrl: e.target.value || null })}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Category</label>
          <select
            value={form.categoryId || ''}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value || null })}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-accent"
          >
            <option value="">None</option>
            {categories?.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md">
            {!tags?.data?.length && <span className="text-sm text-muted">No tags available</span>}
            {tags?.data?.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  form.tagIds?.includes(tag.id)
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted hover:border-accent'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-foreground text-background font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Article' : 'Create Article'}
          </button>
        </div>
      </form>
    </div>
  );
}

