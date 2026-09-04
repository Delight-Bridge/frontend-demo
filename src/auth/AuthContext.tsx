import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Session } from "../types/platform";
import { LoginDialog } from "./LoginDialog";
import { OnboardingDialog } from "./OnboardingDialog";

type AuthContextValue = Session & {
  loading: boolean;
  openLogin: (returnUrl?: string) => void;
  closeLogin: () => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const emptySession: Session = {
  user: null,
  needsOnboarding: false,
  oauthConfigured: { google: false, kakao: false, naver: false },
  demoLoginEnabled: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(emptySession);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [returnUrl, setReturnUrl] = useState("");

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      setSession(await api<Session>("/auth/session"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await api<void>("/auth/logout", { method: "POST" });
    setSession((current) => ({ ...current, user: null }));
  }, []);

  const openLogin = useCallback((nextReturnUrl?: string) => {
    setReturnUrl(nextReturnUrl ?? `${window.location.pathname}${window.location.search}${window.location.hash}`);
    setLoginOpen(true);
  }, []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const value = useMemo(
    () => ({ ...session, loading, openLogin, closeLogin, refreshSession, logout }),
    [session, loading, openLogin, closeLogin, refreshSession, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loginOpen && <LoginDialog returnUrl={returnUrl} onClose={closeLogin} />}
      {session.user && session.needsOnboarding && <OnboardingDialog onCompleted={refreshSession} onCancel={logout} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 안에서 사용해야 합니다.");
  return context;
}
