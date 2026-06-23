import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import type { User } from "../../../../server/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Cache 5 menit — tidak re-query setiap render/mount
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      utils.invalidate();
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
    } finally {
      utils.auth.me.setData(undefined, null);
    }
  }, [logoutMutation, utils]);

  return (
    <AuthContext.Provider
      value={{
        user: meQuery.data ?? null,
        loading: meQuery.isLoading || logoutMutation.isPending,
        isAuthenticated: Boolean(meQuery.data),
        refresh: () => meQuery.refetch(),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
