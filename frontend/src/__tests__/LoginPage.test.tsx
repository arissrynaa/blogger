import { render, screen } from '../test-utils';
import LoginPage from '../pages/admin/LoginPage';

test('renders Login page with form fields', () => {
  render(<LoginPage />);
  // LoginPage uses username field, not email
  expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
});
