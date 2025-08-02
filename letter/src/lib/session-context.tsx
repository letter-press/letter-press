import { createContext, useContext, createSignal, createEffect, onMount } from "solid-js";
import { Auth } from "~/server/auth";
import type { Session } from "@auth/core/types";

type SessionContextType = {
  session: () => Session | null | undefined;
  loading: () => boolean;
  refetch: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>();

export function SessionProvider(props: { children: any }) {
  const [session, setSession] = createSignal<Session | null | undefined>(undefined);
  const [loading, setLoading] = createSignal(true);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const sessionData = await Auth();
      setSession(sessionData);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetchSession();
  });

  // Refetch session when the page gains focus (user comes back to tab)
  createEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchSession();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  });

  const contextValue = {
    session,
    loading,
    refetch: fetchSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {props.children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
