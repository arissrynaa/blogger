import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const TagPage = lazy(() => import('./pages/TagPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

// Admin pages - lazy loaded
const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ArticlesPage = lazy(() => import('./pages/admin/ArticlesPage'));
const ArticleFormPage = lazy(() => import('./pages/admin/ArticleFormPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const TagsPage = lazy(() => import('./pages/admin/TagsPage'));

// Admin layout & guard
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const ProtectedRoute = lazy(() => import('./components/admin/ProtectedRoute'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-muted">Loading...</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/article/:slug" element={<ArticleDetail />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/tag/:slug" element={<TagPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>

          {/* Admin login (no layout) */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/articles" element={<ArticlesPage />} />
              <Route path="/admin/articles/new" element={<ArticleFormPage />} />
              <Route path="/admin/articles/:id/edit" element={<ArticleFormPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
              <Route path="/admin/tags" element={<TagsPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}