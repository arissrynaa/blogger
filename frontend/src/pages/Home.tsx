import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getArticles } from '../lib/api';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';

export default function Home() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { page }],
    queryFn: () => getArticles({ page, limit: 10 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted">Loading articles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">Failed to load articles</p>
        <p className="text-sm text-muted">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <p className="text-lg font-serif">No articles yet</p>
        <p className="text-muted">Check back later for new content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold">Latest Articles</h1>
        <div className="space-y-8">
          {data.data.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <Pagination meta={data.meta} basePath="/" />
    </div>
  );
}

