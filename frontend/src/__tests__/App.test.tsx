import { render, screen } from '../test-utils';
import App from '../App';

test('renders App without crashing', async () => {
  render(<App />);
  // Check for loading state initially
  expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
});
