import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminArticles, getAdminCategories, getAdminTags } from '../../lib/api';

export default function DashboardPage() {
  const { data: articles } = useQuery({
    queryKey: ['admin-articles', { limit: 1 }],
    queryFn: () => getAdminArticles({ limit: 1 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: getAdminTags,
  });

  const stats = [
    { label: 'Articles', value: articles?.meta?.total ?? '-', to: '/admin/articles' },
    { label: 'Categories', value: categories?.data?.length ?? '-', to: '/admin/categories' },
    { label: 'Tags', value: tags?.data?.length ?? '-', to: '/admin/tags' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-serif font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="border border-border rounded-lg p-6 hover:bg-border/50 transition-colors"
          >
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Articles</h2>
          <Link to="/admin/articles" className="text-sm text-muted hover:text-foreground">
            View all
          </Link>
        </div>

        <div className="border border-border rounded-lg divide-y divide-border">
          {!articles?.data?.length ? (
            <div className="p-6 text-center text-muted">No articles yet</div>
          ) : (
            articles.data.slice(0, 5).map((article) => (
              <Link
                key={article.id}
                to={`/admin/articles/${article.id}/edit`}
                className="block p-4 hover:bg-border/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium truncate">{article.title}</span>
                  <span className="text-xs px-2 py-1 rounded border border-border text-muted shrink-0">
                    {article.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

