import { ArrowLeft, CalendarDays, ClipboardList, Images, LogIn, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { MinistryTeam } from "../../types/platform";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

const memberTabs = [
  { to: "/mypage/profile", label: "내 정보 수정", icon: UserRound },
  { to: "/mypage/activities", label: "활동 내역", icon: ClipboardList },
];
const uploaderTabs = [{ to: "/mypage/team-content", label: "팀 소개/게시물 업로드", icon: Images }];

export function MyPage() {
  const { user, loading, openLogin } = useAuth();
  const location = useLocation();
  const [teamName, setTeamName] = useState("담당 팀");
  useEffect(() => {
    if (user?.role !== "AUTHORIZED_UPLOADER") return;
    api<{ team: Pick<MinistryTeam, "id" | "name"> | null }>("/me")
      .then((data) => setTeamName(data.team?.name ?? "담당 팀"))
      .catch(() => setTeamName("담당 팀"));
  }, [user]);
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center text-sm text-gray-500">회원 정보를 확인하는 중입니다.</main>
    );
  if (!user)
    return (
      <>
        <SiteHeader />
        <main className="grid min-h-[70vh] place-items-center bg-gray-50 p-5">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center">
            <LogIn className="mx-auto text-brand-700" size={34} />
            <h1 className="mt-5 text-2xl font-bold">로그인이 필요합니다</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              내 정보와 신청 내역은 로그인한 회원만 확인할 수 있습니다.
            </p>
            <button
              onClick={() => openLogin(`${window.location.pathname}${window.location.search}`)}
              className="mt-6 h-11 w-full rounded-md bg-gray-900 font-bold text-white"
            >
              로그인
            </button>
            <a href="/" className="mt-3 inline-flex items-center gap-2 py-2 text-sm text-gray-500">
              <ArrowLeft size={16} />
              메인으로 돌아가기
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  const tabs =
    user.role === "AUTHORIZED_UPLOADER"
      ? [
          ...memberTabs,
          ...uploaderTabs,
          { to: "/mypage/team-activities", label: `${teamName} 봉사활동 관리`, icon: CalendarDays },
          { to: "/mypage/applicants", label: `${teamName} 신청자 관리`, icon: UsersRound },
        ]
      : memberTabs;
  const currentTab = tabs.find((item) => location.pathname.startsWith(item.to));
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb
            items={[{ label: "마이페이지", href: "/mypage/profile" }, { label: currentTab?.label ?? "내 정보 수정" }]}
            className="mb-7"
          />
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-700">MY PAGE</p>
            <h1 className="mt-2 text-3xl font-bold">마이페이지</h1>
            <p className="mt-3 text-sm text-gray-500">
              {user.role === "AUTHORIZED_UPLOADER"
                ? "내 정보와 활동 내역, 담당 팀 운영을 한곳에서 관리하세요."
                : "회원 정보와 봉사 참여 현황을 확인하세요."}
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-[250px_1fr]">
            <nav
              className="flex gap-2 overflow-x-auto rounded-lg border bg-white p-3 md:block md:space-y-1"
              aria-label="마이페이지 메뉴"
            >
              {tabs.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-bold ${isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
