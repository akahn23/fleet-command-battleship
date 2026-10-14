import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Ravenfjord title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /ravenfjord/i })).toBeInTheDocument();
  });
});
