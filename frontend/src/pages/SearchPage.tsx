import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchArticles } from '../lib/api';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', q, page],
    queryFn: () => searchArticles(q, page),
    enabled: !!q,
  });

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <p className="text-lg font-serif">Search</p>
        <p className="text-muted">Type a keyword to search articles.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted">Searching...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">Search failed</p>
        <p className="text-sm text-muted">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-serif font-bold">Search results for "{q}"</h1>
        {data?.meta && (
          <p className="mt-2 text-sm text-muted">{data.meta.total} article(s) found</p>
        )}
      </header>

      {!data?.data.length ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <p className="text-lg font-serif">No results found</p>
          <p className="text-muted">Try different keywords.</p>
          <Link to="/" className="text-sm text-muted hover:text-foreground underline mt-2">Back to home</Link>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {data.data.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination meta={data.meta} basePath="/search" />
        </>
      )}
    </div>
  );
}