import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./components/FluidSim', () => ({
  default: () => <div data-testid="fluid-simulation" />,
}));

test('renders the project index', () => {
  render(<App />);

  expect(
    screen.getByRole('heading', {
      name: /selected projects, prototypes, and playable work/i,
    })
  ).toBeInTheDocument();
});
