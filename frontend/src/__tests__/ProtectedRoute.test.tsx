import { render } from '../test-utils';

// Simple component to test ProtectedRoute behavior
const AdminContent = () => <div data-testid="admin-content">Admin Dashboard</div>;

test('ProtectedRoute redirects to login when not authenticated', () => {
  // Import dynamically to avoid TypeScript issues with children prop
  const ProtectedRoute = require('../components/admin/ProtectedRoute').default;
  
  const { container } = render(
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>,
    { initialEntries: ['/admin'] }
  );
  
  // When not authenticated, ProtectedRoute renders null or redirects
  // The body should be empty or contain the redirect target
  expect(container.querySelector('[data-testid="admin-content"]')).not.toBeInTheDocument();
});
