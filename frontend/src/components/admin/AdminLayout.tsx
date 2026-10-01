import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="text-xl font-serif font-bold tracking-tight">
            Blogger Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin"
            className="block px-3 py-2 rounded-md text-sm hover:bg-border transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/articles"
            className="block px-3 py-2 rounded-md text-sm hover:bg-border transition-colors"
          >
            Articles
          </Link>
          <Link
            to="/admin/categories"
            className="block px-3 py-2 rounded-md text-sm hover:bg-border transition-colors"
          >
            Categories
          </Link>
          <Link
            to="/admin/tags"
            className="block px-3 py-2 rounded-md text-sm hover:bg-border transition-colors"
          >
            Tags
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted mb-2">Signed in as</div>
          <div className="text-sm font-medium mb-3">{user?.username}</div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm border border-border rounded-md hover:bg-border transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header + main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-border p-4 flex items-center justify-between">
          <span className="font-serif font-bold">Admin</span>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

