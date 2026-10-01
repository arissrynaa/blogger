import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminArticles, deleteArticle } from '../../lib/api';

export default function ArticlesPage() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-articles', { page }],
    queryFn: () => getAdminArticles({ page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted">Loading articles...</div>;
  }

  if (error) {
    return <div className="text-red-400">Failed to load articles: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Articles</h1>
        <Link
          to="/admin/articles/new"
          className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-accent transition-colors"
        >
          New Article
        </Link>
      </div>

      {!data?.data.length ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted">
          No articles found. Create your first article!
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-border/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.data.map((article) => (
                <tr key={article.id} className="hover:bg-border/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium truncate max-w-xs">{article.title}</div>
                    <div className="text-xs text-muted sm:hidden">{article.status}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      article.status === 'published' 
                        ? 'border-green-800 text-green-400' 
                        : 'border-yellow-800 text-yellow-400'
                    }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {new Date(article.updatedAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="text-muted hover:text-foreground text-xs"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      disabled={deletingId === article.id}
                      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {data.meta.page > 1 && (
            <Link to={`?page=${data.meta.page - 1}`} className="px-3 py-1 border border-border rounded text-sm hover:bg-border">
              Prev
            </Link>
          )}
          <span className="px-3 py-1 text-sm text-muted">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          {data.meta.page < data.meta.totalPages && (
            <Link to={`?page=${data.meta.page + 1}`} className="px-3 py-1 border border-border rounded text-sm hover:bg-border">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

