import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { api } from "../api/client";
import { Dialog } from "../components/common/Dialog";
import { Field, FormError, inputClass } from "../components/common/FormControls";
import type { SocialProvider } from "../types/platform";
import { useAuth } from "./AuthContext";

const providers = [
  {
    id: "kakao",
    label: "카카오",
    loginLabel: "Kakao 계정으로 계속하기",
    className: "bg-[#FEE500] text-[#191919]",
  },
  {
    id: "naver",
    label: "네이버",
    loginLabel: "Naver 계정으로 계속하기",
    className: "bg-[#03C75A] text-white",
  },
  {
    id: "google",
    label: "Google",
    loginLabel: "Google 계정으로 계속하기",
    className: "border bg-white text-gray-800",
  },
] as const satisfies ReadonlyArray<{
  id: SocialProvider;
  label: string;
  loginLabel: string;
  className: string;
}>;

export function LoginDialog({ onClose, returnUrl }: { onClose: () => void; returnUrl: string }) {
  const { oauthConfigured, demoLoginEnabled, refreshSession } = useAuth();
  const [mode, setMode] = useState<"login" | "email-login" | "signup">("login");
  const [credentials, setCredentials] = useState({ email: "", password: "", passwordConfirm: "" });
  const [form, setForm] = useState({ name: "", phone: "" });
  const [agreed, setAgreed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const changeMode = (nextMode: "login" | "email-login" | "signup") => {
    setMode(nextMode);
    setError("");
  };
  const finishAuthentication = () => {
    onClose();
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (returnUrl && returnUrl !== currentUrl) window.location.href = returnUrl;
  };
  const demoLogin = async (account: "admin" | "uploader" | "user") => {
    setError("");
    try {
      await api("/auth/demo", { method: "POST", body: JSON.stringify({ account }) });
      await refreshSession();
      finishAuthentication();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인하지 못했습니다.");
    }
  };
  const emailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/auth/email/login", {
        method: "POST",
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
      await refreshSession();
      finishAuthentication();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이메일로 로그인하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  const signup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (credentials.password !== credentials.passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          email: credentials.email,
          password: credentials.password,
          privacyConsent: agreed,
        }),
      });
      await refreshSession();
      finishAuthentication();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원가입을 완료하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "email-login") {
    return (
      <Dialog title="이메일 로그인" onClose={onClose} size="sm">
        <form onSubmit={emailLogin} className="space-y-4 p-5">
          <button
            type="button"
            onClick={() => changeMode("login")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            다른 방법으로 로그인
          </button>
          <Field label="이메일" required>
            <input
              required
              type="email"
              autoComplete="email"
              className={inputClass}
              value={credentials.email}
              onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="비밀번호" required>
            <input
              required
              type="password"
              minLength={8}
              autoComplete="current-password"
              className={inputClass}
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              placeholder="8자 이상 입력하세요"
            />
          </Field>
          <FormError message={error} />
          <button
            disabled={saving}
            className="h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "로그인 중..." : "이메일로 로그인"}
          </button>
          <p className="text-center text-sm text-gray-500">
            이메일 계정이 없으신가요?{" "}
            <button
              type="button"
              onClick={() => changeMode("signup")}
              className="font-bold text-gray-900 underline underline-offset-4"
            >
              회원가입
            </button>
          </p>
        </form>
      </Dialog>
    );
  }

  if (mode === "signup") {
    return (
      <Dialog title="회원가입" onClose={onClose} size="sm">
        <form onSubmit={signup} className="space-y-4 p-5">
          <p className="text-sm leading-6 text-gray-600">
            이메일 계정을 만들고 서비스 이용에 필요한 정보를 입력해 주세요.
          </p>
          <Field label="이메일" required>
            <input
              required
              type="email"
              autoComplete="email"
              className={inputClass}
              value={credentials.email}
              onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@example.com"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="비밀번호" required>
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                placeholder="8자 이상"
              />
            </Field>
            <Field label="비밀번호 확인" required>
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
                value={credentials.passwordConfirm}
                onChange={(event) => setCredentials((current) => ({ ...current, passwordConfirm: event.target.value }))}
                placeholder="한 번 더 입력"
              />
            </Field>
          </div>
          <div className="border-t pt-4">
            <p className="mb-4 text-sm font-bold text-brand-700">최초 가입 시 필수 입력</p>
            <div className="space-y-4">
              <Field label="이름" required>
                <input
                  required
                  maxLength={100}
                  autoComplete="name"
                  className={inputClass}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="이름을 입력하세요"
                />
              </Field>
              <Field label="연락처" required>
                <input
                  required
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="010-0000-0000"
                />
              </Field>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-md bg-gray-50 p-3 text-sm leading-6">
            <input
              required
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>
              <strong>[필수]</strong> 개인정보 수집 및 이용에 동의합니다.
              <span className="block text-xs text-gray-500">
                이름과 연락처는 회원 관리 및 봉사 안내를 위해 수집하며 탈퇴 후 3년간 보관합니다.
              </span>
            </span>
          </label>
          <FormError message={error} />
          <button
            disabled={!agreed || saving}
            className="h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {saving ? "가입 중..." : "가입 완료"}
          </button>
          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <button
              type="button"
              onClick={() => changeMode("email-login")}
              className="font-bold text-gray-900 underline underline-offset-4"
            >
              로그인
            </button>
          </p>
        </form>
      </Dialog>
    );
  }

  return (
    <Dialog title="로그인" onClose={onClose} size="sm">
      <div className="space-y-3 p-5">
        <p className="pb-2 text-sm leading-relaxed text-gray-600">서비스 이용(신청/댓글)을 위해 로그인이 필요합니다.</p>
        {providers.map((item) => (
          <a
            key={item.id}
            href={
              oauthConfigured[item.id]
                ? `/api/auth/${item.id}?returnUrl=${encodeURIComponent(returnUrl || "/")}`
                : undefined
            }
            aria-disabled={!oauthConfigured[item.id]}
            onClick={(event) => {
              if (!oauthConfigured[item.id]) {
                event.preventDefault();
                setError(`${item.label} OAuth 키가 아직 설정되지 않았습니다.`);
              }
            }}
            className={`flex h-12 w-full items-center justify-center rounded-md text-sm font-bold ${item.className} ${oauthConfigured[item.id] ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            {item.loginLabel}
          </a>
        ))}
        <button
          type="button"
          onClick={() => changeMode("email-login")}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white text-sm font-bold text-gray-800 hover:bg-gray-50"
        >
          <Mail size={18} />
          이메일로 시작하기
        </button>
        <FormError message={error} />
        <div className="mt-5 flex items-center pt-5 text-center">
          <button
            type="button"
            onClick={() => changeMode("signup")}
            className="h-11 flex-1 rounded-md text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            기존 계정 찾기
          </button>
          <span className="mx-2 h-4 w-px shrink-0 bg-gray-300" aria-hidden="true" />
          <button
            type="button"
            onClick={() => changeMode("signup")}
            className="h-11 flex-1 rounded-md text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            회원가입
          </button>
        </div>
        {demoLoginEnabled && (
          <div className="mt-5 border-t pt-5">
            <p className="mb-3 text-center text-xs font-bold text-gray-500">데모 계정으로 로그인</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => demoLogin("user")} className="rounded-md border px-2 py-2 text-xs">
                일반 사용자
              </button>
              <button onClick={() => demoLogin("uploader")} className="rounded-md border px-2 py-2 text-xs">
                업로더
              </button>
              <button onClick={() => demoLogin("admin")} className="rounded-md border px-2 py-2 text-xs">
                관리자
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
