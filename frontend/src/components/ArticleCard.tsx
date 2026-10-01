import { Link } from 'react-router-dom';
import type { Article } from '../types';

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  return (
    <article className="group flex flex-col gap-3 border-b border-border pb-6 last:border-0">
      {article.featuredImageUrl && (
        <Link to={`/article/${article.slug}`} className="overflow-hidden rounded-lg">
<img
            src={article.featuredImageUrl}
            alt={article.title}
            loading="lazy"
            width={600}
            height={400}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          {article.category && (
            <Link 
              to={`/category/${article.category.slug}`} 
              className="hover:text-accent transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          )}
        </div>

        <h2 className="text-xl font-serif font-bold leading-tight group-hover:text-accent transition-colors">
          <Link to={`/article/${article.slug}`}>{article.title}</Link>
        </h2>

        {article.excerpt && (
          <p className="text-muted line-clamp-3">{article.excerpt}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-1">
          {article.tags.map(tag => (
            <Link
              key={tag.id}
              to={`/tag/${tag.slug}`}
              className="text-xs px-2 py-1 rounded bg-border/50 hover:bg-border transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

