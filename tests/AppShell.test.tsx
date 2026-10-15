import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '../src/components/layout/AppShell';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AppShell', () => {
  it('renders the main content area', () => {
    render(
      <TestWrapper>
        <AppShell />
      </TestWrapper>,
    );
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('renders the sidebar navigation', () => {
    render(
      <TestWrapper>
        <AppShell />
      </TestWrapper>,
    );
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeDefined();
  });

  it('renders the brand name', () => {
    render(
      <TestWrapper>
        <AppShell />
      </TestWrapper>,
    );
    expect(screen.getByText('EMR System')).toBeDefined();
  });
});
