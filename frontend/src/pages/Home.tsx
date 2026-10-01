import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getArticles } from '../lib/api';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';
import Seo from '../components/Seo';
import JsonLd from '../components/JsonLd';

export default function Home() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { page }],
    queryFn: () => getArticles({ page, limit: 10 }),
  });

  if (isLoading) {
    return (
      <>
        <Seo title="Home" canonical="/" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted">Loading articles...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Seo title="Error" canonical="/" />
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-red-400">Failed to load articles</p>
          <p className="text-sm text-muted">{(error as Error).message}</p>
        </div>
      </>
    );
  }

  if (!data?.data.length) {
    return (
      <>
        <Seo title="Home" description="Belum ada artikel." canonical="/" />
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
          <p className="text-lg font-serif">No articles yet</p>
          <p className="text-muted">Check back later for new content.</p>
        </div>
      </>
    );
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Blogger',
    url: import.meta.env.VITE_SITE_URL || '/',
  };

  return (
    <>
      <Seo
        title={page > 1 ? `Halaman ${page}` : undefined}
        description="Tulisan, catatan, dan pemikiran terbaru."
        canonical="/"
      />
      <JsonLd data={websiteSchema} />

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
    </>
  );
}

