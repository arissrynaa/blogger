import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticles, getTagBySlug } from '../lib/api';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';

export default function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data: tag, isLoading: tagLoading } = useQuery({
    queryKey: ['tag', slug],
    queryFn: () => getTagBySlug(slug!),
    enabled: !!slug,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { tag: slug, page }],
    queryFn: () => getArticles({ tag: slug, page, limit: 10 }),
    enabled: !!slug,
  });

  if (tagLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">Failed to load tag</p>
        <Link to="/" className="text-sm text-muted hover:text-foreground underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-serif font-bold">#{tag?.data?.name || slug}</h1>
      </header>

      {!data?.data.length ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <p className="text-lg font-serif">No articles with this tag</p>
          <Link to="/" className="text-sm text-muted hover:text-foreground underline">Back to home</Link>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {data.data.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination meta={data.meta} basePath={`/tag/${slug}`} />
        </>
      )}
    </div>
  );
}