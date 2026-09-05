import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
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
    iconSrc: "/social-login-icons/kakao.webp",
    className: "bg-[#FEE500] text-[#191919]",
  },
  {
    id: "naver",
    label: "네이버",
    loginLabel: "Naver 계정으로 계속하기",
    iconSrc: "/social-login-icons/naver.webp",
    className: "bg-[#03C75A] text-white",
  },
  {
    id: "google",
    label: "Google",
    loginLabel: "Google 계정으로 계속하기",
    iconSrc: "/social-login-icons/google.webp",
    className: "border bg-white text-gray-800",
  },
] as const satisfies ReadonlyArray<{
  id: SocialProvider;
  label: string;
  loginLabel: string;
  iconSrc: string;
  className: string;
}>;

function PasswordInput({
  id,
  label,
  autoComplete,
  value,
  visible,
  onChange,
  onToggle,
  placeholder,
}: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5 text-sm font-medium text-gray-700">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          required
          type={visible ? "text" : "password"}
          minLength={8}
          autoComplete={autoComplete}
          className={`${inputClass} pr-11`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-gray-500 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
          aria-label={`${label} ${visible ? "숨기기" : "표시"}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function LoginDialog({ onClose, returnUrl }: { onClose: () => void; returnUrl: string }) {
  const { oauthConfigured, refreshSession } = useAuth();
  const [mode, setMode] = useState<"login" | "email-login" | "signup" | "reset-password">("login");
  const [credentials, setCredentials] = useState({ email: "", password: "", passwordConfirm: "" });
  const [form, setForm] = useState({ name: "", phone: "" });
  const [agreed, setAgreed] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const changeMode = (nextMode: "login" | "email-login" | "signup" | "reset-password") => {
    setMode(nextMode);
    setError("");
    setNotice("");
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };
  const finishAuthentication = () => {
    onClose();
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (returnUrl && returnUrl !== currentUrl) window.location.href = returnUrl;
  };
  const emailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/auth/email/login", {
        method: "POST",
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          rememberMe,
        }),
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
  const resetPassword = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice(`${credentials.email.trim()} 주소로 비밀번호 재설정 안내를 전송했습니다.`);
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
          <Field label="이메일">
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
          <div className="space-y-2">
            <PasswordInput
              id="login-password"
              label="비밀번호"
              autoComplete="current-password"
              value={credentials.password}
              visible={showPassword}
              onChange={(password) => setCredentials((current) => ({ ...current, password }))}
              onToggle={() => setShowPassword((current) => !current)}
              placeholder="8자 이상 입력하세요"
            />
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-brand-600"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>로그인 유지</span>
            </label>
          </div>
          <FormError message={error} />
          <button
            disabled={saving || !credentials.email.trim() || !credentials.password}
            className="h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "로그인 중..." : "로그인"}
          </button>
          <div className="flex items-center gap-3 py-1" aria-hidden="true">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={() => changeMode("signup")}
            className="h-11 w-full rounded-md border border-gray-300 bg-white text-sm font-bold text-gray-800 hover:bg-gray-50"
          >
            이메일로 회원가입
          </button>
          <button
            type="button"
            onClick={() => changeMode("reset-password")}
            className="h-10 w-full rounded-md text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            비밀번호 재설정
          </button>
        </form>
      </Dialog>
    );
  }

  if (mode === "reset-password") {
    return (
      <Dialog title="비밀번호 재설정" onClose={onClose} size="sm">
        <form onSubmit={resetPassword} className="space-y-4 p-5">
          <button
            type="button"
            onClick={() => changeMode("email-login")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            이메일 로그인으로 돌아가기
          </button>
          <p className="text-sm leading-6 text-gray-600">
            가입한 이메일 주소를 입력하면 비밀번호 재설정 안내를 보내드립니다.
          </p>
          <Field label="이메일" required>
            <input
              required
              type="email"
              autoComplete="email"
              className={inputClass}
              value={credentials.email}
              onChange={(event) => {
                setCredentials((current) => ({ ...current, email: event.target.value }));
                setNotice("");
              }}
              placeholder="name@example.com"
            />
          </Field>
          {notice && (
            <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {notice}
            </p>
          )}
          <button
            disabled={!credentials.email.trim()}
            className="h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            재설정 안내 받기
          </button>
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
            <PasswordInput
              id="signup-password"
              label="비밀번호"
              autoComplete="new-password"
              value={credentials.password}
              visible={showPassword}
              onChange={(password) => setCredentials((current) => ({ ...current, password }))}
              onToggle={() => setShowPassword((current) => !current)}
              placeholder="8자 이상"
            />
            <PasswordInput
              id="signup-password-confirm"
              label="비밀번호 확인"
              autoComplete="new-password"
              value={credentials.passwordConfirm}
              visible={showPasswordConfirm}
              onChange={(passwordConfirm) => setCredentials((current) => ({ ...current, passwordConfirm }))}
              onToggle={() => setShowPasswordConfirm((current) => !current)}
              placeholder="한 번 더 입력"
            />
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
        <p className="pb-2 text-sm leading-relaxed text-gray-600 text-center">
          서비스 이용(신청/댓글)을 위해 로그인이 필요합니다.
        </p>
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
            className={`relative flex h-12 w-full items-center justify-center gap-2 rounded-md px-12 text-sm font-bold ${item.className} ${oauthConfigured[item.id] ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <img src={item.iconSrc} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
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
            onClick={() => changeMode("reset-password")}
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
      </div>
    </Dialog>
  );
}
