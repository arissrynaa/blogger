import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api';
import type { CategoryInput } from '../../types';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryInput>({ name: '', slug: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const saveMutation = useMutation({
    mutationFn: editingId
      ? (input: CategoryInput) => updateCategory(editingId, input)
      : (input: CategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      resetForm();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '' });
    setEditingId(null);
    setError(null);
  };

  const startEdit = (cat: { id: string; name: string; slug: string; description?: string | null }) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif font-bold">Categories</h1>

      <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-4">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
          />
          <input
            placeholder="Slug (optional)"
            value={form.slug || ''}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
          />
        </div>
        <input
          placeholder="Description (optional)"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-accent disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Add Category'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted hover:text-foreground">
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="text-muted animate-pulse">Loading...</div>
      ) : !data?.data?.length ? (
        <div className="border border-border rounded-lg p-6 text-center text-muted">No categories yet</div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {data.data.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{cat.name}</div>
                {cat.description && <div className="text-sm text-muted mt-0.5">{cat.description}</div>}
                <div className="text-xs text-muted mt-0.5">/{cat.slug}</div>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(cat)} className="text-sm text-muted hover:text-foreground">Edit</button>
                <button onClick={() => handleDelete(cat.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

