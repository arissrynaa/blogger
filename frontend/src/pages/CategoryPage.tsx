import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticles, getCategoryBySlug } from '../lib/api';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';
import Seo from '../components/Seo';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { category: slug, page }],
    queryFn: () => getArticles({ category: slug, page, limit: 10 }),
    enabled: !!slug,
  });

  if (catLoading || isLoading) {
    return (
      <>
        <Seo title={`Kategori: ${slug}`} canonical={`/category/${slug}`} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Seo title="Error" canonical={`/category/${slug}`} />
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-red-400">Failed to load category</p>
          <Link to="/" className="text-sm text-muted hover:text-foreground underline">Back to home</Link>
        </div>
      </>
    );
  }

  const catName = category?.data?.name || slug || '';
  const catDesc = category?.data?.description || `Artikel dalam kategori ${catName}.`;

  return (
    <>
      <Seo
        title={`Kategori: ${catName}`}
        description={catDesc}
        canonical={`/category/${slug}`}
      />

      <div className="space-y-8">
        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-serif font-bold">{catName}</h1>
          {category?.data?.description && (
            <p className="mt-2 text-muted">{category.data.description}</p>
          )}
        </header>

        {!data?.data.length ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <p className="text-lg font-serif">No articles in this category</p>
            <Link to="/" className="text-sm text-muted hover:text-foreground underline">Back to home</Link>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {data.data.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            <Pagination meta={data.meta} basePath={`/category/${slug}`} />
          </>
        )}
      </div>
    </>
  );
}

