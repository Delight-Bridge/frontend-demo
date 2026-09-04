import {
  ArrowLeft,
  // CalendarDays, // 봉사활동 관리는 담당 업로더 메뉴로 이동
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Newspaper,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AdminDashboard } from "./AdminDashboard";
// import { ActivitiesManager } from "./ActivitiesManager"; // 담당 업로더 메뉴에서 사용
import { ApplicationsManager } from "./ApplicationsManager";
import { MembersManager } from "./MembersManager";
import { NewsManager } from "./NewsManager";
import { TeamsManager } from "./TeamsManager";
import { ProfilePage } from "../mypage/ProfilePage";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

type AdminTab = "dashboard" | "profile" | "members" | "applications" | "news" | "teams";
const tabs: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "profile", label: "내 정보 수정", icon: UserRound },
  { id: "members", label: "회원 관리", icon: Users },
  // { id: "activities", label: "봉사활동 관리", icon: CalendarDays }, // 담당 업로더 메뉴로 이동
  { id: "applications", label: "봉사 신청 관리", icon: ClipboardList },
  { id: "news", label: "뉴스 관리", icon: Newspaper },
  { id: "teams", label: "사역팀 관리", icon: Settings },
];

export function AdminPage() {
  const { user, loading, openLogin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedTab = location.pathname.split("/")[2] || "dashboard";
  const tab: AdminTab = tabs.some((item) => item.id === requestedTab) ? (requestedTab as AdminTab) : "dashboard";
  const setTab = (nextTab: AdminTab) => navigate(nextTab === "dashboard" ? "/admin" : `/admin/${nextTab}`);
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-gray-100 text-sm text-gray-500">
        관리자 권한을 확인하는 중입니다.
      </main>
    );
  if (!user)
    return (
      <main className="grid min-h-screen place-items-center bg-gray-100 p-5">
        <div className="w-full max-w-md rounded-md border bg-white p-8 text-center">
          <LogIn className="mx-auto text-brand-700" size={32} />
          <h1 className="mt-5 text-2xl font-bold">관리자 로그인이 필요합니다</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            회원, 봉사 신청, 뉴스 콘텐츠는 관리자만 관리할 수 있습니다.
          </p>
          <button onClick={() => openLogin()} className="mt-6 h-11 w-full rounded-md bg-gray-900 font-bold text-white">
            로그인
          </button>
          <a href="/" className="mt-3 block py-2 text-sm text-gray-500">
            메인으로 돌아가기
          </a>
        </div>
      </main>
    );
  if (user.role !== "ADMIN")
    return (
      <main className="grid min-h-screen place-items-center bg-gray-100 p-5">
        <div className="w-full max-w-md rounded-md border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
          <p className="mt-3 text-sm text-gray-500">현재 계정은 관리자 페이지에 접근할 수 없습니다.</p>
          <a
            href="/"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-gray-900 px-5 font-bold text-white"
          >
            <ArrowLeft size={17} />
            메인으로 돌아가기
          </a>
        </div>
      </main>
    );

  const currentLabel = tabs.find((item) => item.id === tab)?.label;
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <a href="/" className="grid h-9 w-9 place-items-center text-gray-500" aria-label="메인으로 돌아가기">
              <ArrowLeft size={20} />
            </a>
            <div>
              <p className="font-serif font-bold">Delight Bridge Admin</p>
              <p className="text-[11px] text-gray-500">운영 관리 콘솔</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab("profile")}
              className="hidden rounded-md px-2 py-1 text-right hover:bg-gray-100 sm:block"
              aria-label={`${user.name || user.nickname} 내 정보로 이동`}
            >
              <span className="block text-sm font-bold">{user.name || user.nickname}</span>
              <span className="block text-[11px] text-gray-500">{user.nickname}</span>
            </button>
            <button
              onClick={() => void logout()}
              className="grid h-9 w-9 place-items-center text-gray-500"
              aria-label="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] md:grid-cols-[220px_1fr]">
        <aside className="min-w-0 max-w-full border-b bg-white md:min-h-[calc(100vh-4rem)] md:border-b-0 md:border-r">
          <nav
            className="hide-scrollbar flex max-w-full gap-1 overflow-x-auto p-3 md:block md:space-y-1 md:p-4"
            aria-label="관리자 메뉴"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium md:w-full ${tab === id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <main id="main-content" className="min-w-0 p-4 md:p-8 lg:p-10">
          <PageBreadcrumb
            items={[{ label: "관리자", href: "/admin" }, { label: currentLabel ?? "대시보드" }]}
            className="mb-6"
          />
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Administration</p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{currentLabel}</h1>
          </div>
          {tab === "dashboard" && <AdminDashboard onNavigate={setTab} />}
          {tab === "profile" && <ProfilePage showTeam={false} />}
          {tab === "members" && <MembersManager />}
          {/* {tab === "activities" && <ActivitiesManager />} 담당 업로더 메뉴로 이동 */}
          {tab === "applications" && <ApplicationsManager />}
          {tab === "news" && <NewsManager />}
          {tab === "teams" && <TeamsManager />}
        </main>
      </div>
    </div>
  );
}
