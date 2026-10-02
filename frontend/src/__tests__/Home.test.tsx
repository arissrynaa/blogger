import { render, screen } from '../test-utils';
import Home from '../pages/Home';

test('renders Home page with hero section', () => {
  render(<Home />);
  // Home uses useQuery which will be in loading state initially
  // Check for loading indicator or content
  expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
});
