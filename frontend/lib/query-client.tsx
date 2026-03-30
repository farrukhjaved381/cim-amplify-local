"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const maybeError = error as any;
  if (typeof maybeError?.status === "number") return maybeError.status;
  if (typeof maybeError?.response?.status === "number") return maybeError.response.status;
  return undefined;
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              const status = getHttpStatus(error);
              if (status && status >= 400 && status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { QueryClient };
