import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthAPI, UsersAPI, getToken, setToken, type ExperienceLevel, type UserMe } from "./api";

type AuthCtx = {
  user: UserMe | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string; email: string; password: string;
    experienceLevel: ExperienceLevel; bodyWeight?: number; height?: number;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setReady(true); return; }
    try { setUser(await UsersAPI.me()); }
    catch { setUser(null); setToken(null); }
    finally { setReady(true); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const r = await AuthAPI.login(email, password);
    setToken(r.token);
    await refresh();
  };

  const register: AuthCtx["register"] = async (data) => {
    const r = await AuthAPI.register(data);
    setToken(r.token);
    await refresh();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return (
    <Ctx.Provider value={{ user, ready, isAuthenticated: !!user, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
