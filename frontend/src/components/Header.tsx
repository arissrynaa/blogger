import { Link, useNavigate } from 'react-router-dom';
import { useState, FormEvent } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="container-main flex items-center justify-between h-16 gap-4">
        <Link to="/" className="text-xl font-serif font-bold tracking-tight hover:text-accent transition-colors">
          Blogger
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/category/tech" className="hover:text-foreground transition-colors">Tech</Link>
          <Link to="/category/life" className="hover:text-foreground transition-colors">Life</Link>
        </nav>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Cari artikel..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent w-32 md:w-48 transition-all"
          />
        </form>
      </div>
    </header>
  );
}

