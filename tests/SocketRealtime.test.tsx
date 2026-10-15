import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '../src/context/SocketContext';
import { useSocket } from '../src/hooks/useSocket';
import { tokenManager } from '../src/api/tokenManager';

// Mock socket.io-client
const mockSocketCallbacks: Record<string, ((...args: unknown[]) => void)[]> = {};

const mockSocketInstance = {
  connected: true,
  on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
    if (!mockSocketCallbacks[event]) mockSocketCallbacks[event] = [];
    mockSocketCallbacks[event].push(callback);
    return mockSocketInstance;
  }),
  io: {
    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (!mockSocketCallbacks[event]) mockSocketCallbacks[event] = [];
      mockSocketCallbacks[event].push(callback);
      return mockSocketInstance.io;
    }),
  },
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocketInstance),
}));

function TestConsumer() {
  const { isConnected, lastEvent } = useSocket();
  return (
    <div>
      <span data-testid="status">{isConnected ? 'Connected' : 'Disconnected'}</span>
      {lastEvent && <span data-testid="event-message">{lastEvent.message}</span>}
    </div>
  );
}

describe('SocketContext Realtime Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketCallbacks).forEach((k) => delete mockSocketCallbacks[k]);
    tokenManager.setToken('test-valid-jwt-token');

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  it('connects and sets isConnected to true on socket connect event', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      </QueryClientProvider>,
    );

    // Simulate socket connect event
    act(() => {
      mockSocketCallbacks['connect']?.forEach((cb) => cb());
    });

    expect(screen.getByTestId('status').textContent).toBe('Connected');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['appointments'] });
  });

  it('triggers query invalidation and notification on appointment:created event', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      </QueryClientProvider>,
    );

    act(() => {
      mockSocketCallbacks['connect']?.forEach((cb) => cb());
    });

    // Simulate appointment:created event
    act(() => {
      mockSocketCallbacks['appointment:created']?.forEach((cb) =>
        cb({
          action: 'CREATED',
          appointment: {
            id: 'app-999',
            patient: { fullName: 'Arthur Pendelton' },
            doctor: { name: 'Dr. Najath' },
            startTime: '10:00',
          },
        }),
      );
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['appointments'] });
    expect(screen.getByTestId('event-message').textContent).toContain('Arthur Pendelton');
  });

  it('reconciles query cache on socket reconnect', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      </QueryClientProvider>,
    );

    // Simulate reconnect event
    act(() => {
      mockSocketCallbacks['reconnect']?.forEach((cb) => cb());
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['appointments'] });
  });
});
