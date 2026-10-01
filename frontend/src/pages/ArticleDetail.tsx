import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticleBySlug } from '../lib/api';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted">Loading article...</div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">Article not found</p>
        <Link to="/" className="text-sm text-muted hover:text-foreground underline">
          Back to home
        </Link>
      </div>
    );
  }

  const article = data.data;

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          {article.category && (
            <Link 
              to={`/category/${article.category.slug}`}
              className="hover:text-accent transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          {article.publishedAt && (
            <>
              <span>•</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </>
          )}
          <span>•</span>
          <span>{article.author.name}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-xl text-muted leading-relaxed">{article.excerpt}</p>
        )}
      </header>

      {article.featuredImageUrl && (
        <img
          src={article.featuredImageUrl}
          alt={article.title}
          className="w-full rounded-lg object-cover max-h-[500px]"
        />
      )}

      <div className="prose prose-invert prose-lg max-w-none font-serif leading-loose">
        {article.content.split('\n').map((paragraph, idx) => (
          paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
        ))}
      </div>

      {article.tags.length > 0 && (
        <footer className="pt-8 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <Link
                key={tag.id}
                to={`/tag/${tag.slug}`}
                className="text-sm px-3 py-1.5 rounded bg-border/50 hover:bg-border transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}

