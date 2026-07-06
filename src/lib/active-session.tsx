import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { SessionsAPI, type WorkoutSessionResponse } from "./api";

type Ctx = {
  session: WorkoutSessionResponse | null;
  isActive: boolean;
  refresh: () => Promise<void>;
};

const ActiveSessionCtx = createContext<Ctx | null>(null);

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WorkoutSessionResponse | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await SessionsAPI.active();
      // 204 → request() returns null. Some backends might return {} — guard on .id.
      setSession(s && (s as WorkoutSessionResponse).id ? (s as WorkoutSessionResponse) : null);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  return (
    <ActiveSessionCtx.Provider value={{ session, isActive: !!session, refresh }}>
      {children}
    </ActiveSessionCtx.Provider>
  );
}

export function useActiveSession(): Ctx {
  const c = useContext(ActiveSessionCtx);
  if (!c) throw new Error("useActiveSession must be used within ActiveSessionProvider");
  return c;
}

export function useOptionalActiveSession(): Ctx | null {
  return useContext(ActiveSessionCtx);
}
