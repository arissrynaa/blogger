import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminTags, createTag, updateTag, deleteTag } from '../../lib/api';
import type { TagInput } from '../../types';

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TagInput>({ name: '', slug: '' });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: getAdminTags,
  });

  const saveMutation = useMutation({
    mutationFn: editingId
      ? (input: TagInput) => updateTag(editingId, input)
      : (input: TagInput) => createTag(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      setEditingId(null);
      setForm({ name: '', slug: '' });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tags'] }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const startEdit = (tag: { id: string; name: string; slug: string }) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, slug: tag.slug });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', slug: '' });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-serif font-bold">Tags</h1>

      <form onSubmit={handleSubmit} className="border border-border rounded-lg p-6 space-y-4 max-w-md">
        <h2 className="font-semibold">{editingId ? 'Edit Tag' : 'Create Tag'}</h2>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="auto-generated if empty"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm text-muted hover:text-foreground">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="font-semibold">All Tags</h2>
        {isLoading && <p className="text-muted animate-pulse">Loading...</p>}
        {!isLoading && !data?.data?.length && <p className="text-muted">No tags yet.</p>}
        {data?.data && (
          <div className="border border-border rounded-lg divide-y divide-border">
            {data.data.map((tag) => (
              <div key={tag.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="font-medium">{tag.name}</span>
                  <span className="ml-2 text-xs text-muted">/{tag.slug}</span>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => startEdit(tag)} className="text-sm text-muted hover:text-foreground">Edit</button>
                  <button onClick={() => deleteMutation.mutate(tag.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}