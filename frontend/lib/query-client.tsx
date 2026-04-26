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
            // 60s default keeps tab-to-tab navigation snappy without serving
            // genuinely stale data. Per-hook overrides (e.g. profile pages,
            // 5min) can extend further where data really doesn't change.
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000, // hold in cache 10min after last subscriber unmounts
            retry: (failureCount, error) => {
              const status = getHttpStatus(error);
              if (status && status >= 400 && status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            // Don't fire a fresh request the instant the network reconnects;
            // the staleTime guarantees a refresh on the next genuine read.
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { QueryClient };
