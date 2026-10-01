import { Link, useSearchParams } from 'react-router-dom';
import type { PaginationMeta } from '../types';

interface Props {
  meta: PaginationMeta;
  basePath?: string;
}

export default function Pagination({ meta, basePath = '' }: Props) {
  const [searchParams] = useSearchParams();
  
  if (meta.totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
      {meta.page > 1 && (
        <Link
          to={buildUrl(meta.page - 1)}
          className="px-4 py-2 text-sm border border-border rounded hover:bg-border transition-colors"
        >
          Previous
        </Link>
      )}
      
      <span className="text-sm text-muted">
        Page {meta.page} of {meta.totalPages}
      </span>

      {meta.page < meta.totalPages && (
        <Link
          to={buildUrl(meta.page + 1)}
          className="px-4 py-2 text-sm border border-border rounded hover:bg-border transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}

