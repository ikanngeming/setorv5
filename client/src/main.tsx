import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Jangan retry kalau dapat 401 — supaya tidak memicu loop
      retry: (failureCount, error) => {
        if (
          error instanceof TRPCClientError &&
          (error.data?.code === "UNAUTHORIZED" ||
            error.data?.code === "FORBIDDEN" ||
            error.message === UNAUTHED_ERR_MSG)
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Tracking apakah sudah sedang redirect, supaya tidak redirect berkali-kali
let isRedirectingToLogin = false;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (isRedirectingToLogin) return;

  const isUnauthorized =
    error.message === UNAUTHED_ERR_MSG ||
    error.data?.code === "UNAUTHORIZED" ||
    error.data?.code === "FORBIDDEN";

  if (!isUnauthorized) return;

  // Jangan redirect kalau ini dari query auth.me itu sendiri — biarkan
  // useAuth yang handle via redirectOnUnauthenticated
  const queryKey = (error as any)?.meta?.queryKey;
  if (
    Array.isArray(queryKey) &&
    queryKey[0]?.[0] === "auth" &&
    queryKey[0]?.[1] === "me"
  ) {
    return;
  }

  isRedirectingToLogin = true;
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
