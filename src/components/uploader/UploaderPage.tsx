import { ArrowLeft, ClipboardList, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { PageResult, VolunteerApplication } from "../../types/platform";
import { Pagination } from "../common/Pagination";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";

export function UploaderPage() {
  const { user, loading, openLogin } = useAuth();
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user || !["ADMIN", "AUTHORIZED_UPLOADER"].includes(user.role)) return;
    api<PageResult<VolunteerApplication>>(`/uploader/applications?page=${page}&pageSize=20`)
      .then((result) => {
        setApplications(result.items);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        setError("");
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "담당 신청자를 불러오지 못했습니다."));
  }, [user, page]);
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center text-sm text-gray-500">권한을 확인하는 중입니다.</main>
    );
  if (!user)
    return (
      <>
        <SiteHeader />
        <main className="grid min-h-[70vh] place-items-center p-5 text-center">
          <div>
            <h1 className="text-2xl font-bold">팀장 로그인이 필요합니다</h1>
            <button
              onClick={() => openLogin("/uploader")}
              className="mt-5 rounded-md bg-gray-900 px-5 py-3 font-bold text-white"
            >
              로그인
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  if (!["ADMIN", "AUTHORIZED_UPLOADER"].includes(user.role))
    return (
      <>
        <SiteHeader />
        <main className="grid min-h-[70vh] place-items-center p-5 text-center">
          <div>
            <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
            <a href="/" className="mt-5 inline-flex items-center gap-2">
              <ArrowLeft size={16} />
              메인으로 돌아가기
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold tracking-widest text-brand-700">TEAM LEADER</p>
          <h1 className="mt-2 text-3xl font-bold">담당 팀 신청자</h1>
          <p className="mt-3 text-sm text-gray-500">관리자가 팀장에게 전달한 신청만 표시됩니다.</p>
          {error && (
            <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <section className="mt-7 space-y-3" aria-label="담당 신청자 목록">
            {applications.map((application) => (
              <article key={application.id} className="rounded-lg border bg-white p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-700">{application.team?.name}</p>
                    <h2 className="mt-1 font-bold">
                      {application.applicantName} · {application.activity?.title ?? "봉사 신청"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {application.status === "COMPLETED" ? "참여 완료" : "팀장 전달"}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                  <a href={`tel:${application.phone}`} className="flex items-center gap-2">
                    <Phone size={15} />
                    {application.phone}
                  </a>
                  <span>
                    {application.participationDate || "일정 협의"} ·{" "}
                    {application.participationType === "ONCE" ? "1회 참여" : "지속 참여"}
                  </span>
                </div>
                <p className="mt-3 rounded-md bg-gray-50 p-3 text-sm leading-6 text-gray-600">
                  {application.introduction}
                </p>
              </article>
            ))}
            {!applications.length && (
              <div className="grid min-h-56 place-items-center rounded-lg border bg-white text-center text-sm text-gray-500">
                <div>
                  <ClipboardList className="mx-auto mb-3 text-gray-300" />
                  전달받은 신청자가 없습니다.
                </div>
              </div>
            )}
          </section>
          <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
        </div>
      </main>
      <Footer />
    </>
  );
}
