import { ChevronDown, FlaskConical, LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const links = [
  ["/news", "우리 곁의 아픔"],
  ["/activities", "우리의 응답"],
  ["/volunteer", "당신의 차례입니다"],
  ["/testimony", "회복 간증"],
] as const;

export function SiteHeader() {
  const { user, loading, demoLoginEnabled, openLogin, demoLogin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoError, setDemoError] = useState("");
  const displayName = user?.name || user?.nickname;
  const accountTitle = user?.role === "USER" ? "빛누리" : (user?.nickname ?? "");
  const loginWithDemo = async (account: "admin" | "uploader" | "user") => {
    setDemoError("");
    try {
      await demoLogin(account);
      setMenuOpen(false);
    } catch (caught) {
      setDemoError(caught instanceof Error ? caught.message : "데모 계정으로 로그인하지 못했습니다.");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <a href="/" className="font-serif text-lg font-bold text-gray-950">
          Delight Bridge
        </a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="주요 메뉴">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="text-sm text-gray-600 hover:text-gray-950">
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <a
                href={user.role === "ADMIN" ? "/admin" : "/mypage/profile"}
                className="rounded-md px-2 py-1 text-right hover:bg-gray-100"
                aria-label={`${displayName} 마이페이지로 이동`}
              >
                <p className="text-sm font-bold text-gray-900">{displayName}</p>
                {accountTitle && <p className="text-[11px] text-gray-500">{accountTitle}</p>}
              </a>
              <button
                type="button"
                onClick={() => void logout()}
                className="grid h-10 w-10 place-items-center text-gray-500"
                aria-label="로그아웃"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              {demoLoginEnabled && (
                <details className="group relative">
                  <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    <FlaskConical size={16} />
                    데모 로그인
                    <ChevronDown size={15} className="transition group-open:rotate-180" />
                  </summary>
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-md border bg-white p-2 shadow-xl">
                    <p className="px-2 pb-2 pt-1 text-xs font-bold text-gray-500">데모 계정 선택</p>
                    {(
                      [
                        ["user", "일반 사용자"],
                        ["uploader", "업로더"],
                        ["admin", "관리자"],
                      ] as const
                    ).map(([account, label]) => (
                      <button
                        key={account}
                        type="button"
                        onClick={() => void loginWithDemo(account)}
                        className="block h-10 w-full rounded-md px-3 text-left text-sm font-medium hover:bg-gray-100"
                      >
                        {label}
                      </button>
                    ))}
                    {demoError && <p className="px-2 py-2 text-xs text-red-600">{demoError}</p>}
                  </div>
                </details>
              )}
              <button
                type="button"
                onClick={() => openLogin()}
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                <LogIn size={17} />
                로그인
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center lg:hidden"
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <nav className="border-t bg-white px-4 py-3 lg:hidden" aria-label="모바일 메뉴">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium">
              {label}
            </a>
          ))}
          <div className="mt-2 border-t pt-3">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <a
                  href={user.role === "ADMIN" ? "/admin" : "/mypage/profile"}
                  onClick={() => setMenuOpen(false)}
                  className="min-w-0 flex-1 py-2 text-sm font-bold"
                >
                  <span className="block truncate">{displayName}</span>
                  {accountTitle && (
                    <span className="block truncate text-xs font-normal text-gray-500">{accountTitle}</span>
                  )}
                </a>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="grid h-10 w-10 place-items-center text-gray-500"
                  aria-label="로그아웃"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={() => openLogin()} className="flex w-full items-center gap-2 py-2 text-sm font-bold">
                  <LogIn size={17} />
                  로그인
                </button>
                {demoLoginEnabled && (
                  <div className="border-t pt-3">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                      <FlaskConical size={15} />
                      데모 계정으로 로그인
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["user", "일반 사용자"],
                          ["uploader", "업로더"],
                          ["admin", "관리자"],
                        ] as const
                      ).map(([account, label]) => (
                        <button
                          key={account}
                          type="button"
                          onClick={() => void loginWithDemo(account)}
                          className="rounded-md border px-2 py-2 text-xs font-bold hover:bg-gray-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {demoError && <p className="mt-2 text-xs text-red-600">{demoError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
