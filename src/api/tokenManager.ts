let inMemoryAccessToken: string | null = null;
const listeners: Array<(token: string | null) => void> = [];

export const tokenManager = {
  getToken(): string | null {
    return inMemoryAccessToken;
  },

  setToken(token: string | null): void {
    inMemoryAccessToken = token;
    listeners.forEach((listener) => listener(token));
  },

  clearToken(): void {
    inMemoryAccessToken = null;
    listeners.forEach((listener) => listener(null));
  },

  subscribe(listener: (token: string | null) => void): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};
