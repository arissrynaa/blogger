import { render, screen } from '../test-utils';
import App from '../App';

test('routing renders home page by default', async () => {
  render(<App />);
  // Home page shows loading state initially
  expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
});
