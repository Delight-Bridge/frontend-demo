import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import type { VolunteerActivity, VolunteerApplication } from "../../types/platform";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { ParticipationDialog } from "./ParticipationDialog";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

const statusLabel = {
  SUBMITTED: "접수",
  ADMIN_CONFIRMED: "관리자 확정",
  HANDED_TO_LEADER: "팀장 전달",
  REJECTED: "거절",
  CANCELLED: "취소",
  COMPLETED: "참여 완료",
} as const;

export function ParticipationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedId = searchParams.get("activity");
  const selected = activities.find((activity) => activity.id === selectedId) ?? null;

  const loadApplications = useCallback(
    async () => setApplications(await api<VolunteerApplication[]>("/applications/mine")),
    [],
  );
  useEffect(() => {
    Promise.all([
      api<VolunteerActivity[]>("/activities?upcoming=true"),
      api<VolunteerApplication[]>("/applications/mine"),
    ])
      .then(([activityData, applicationData]) => {
        setActivities(activityData);
        setApplications(applicationData);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "봉사활동을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);
  const open = (activity: VolunteerActivity) => setSearchParams({ activity: activity.id });
  const close = () => setSearchParams({});
  const cancel = async (application: VolunteerApplication) => {
    if (!window.confirm("이 봉사 신청을 취소할까요?")) return;
    try {
      await api(`/applications/${application.id}`, { method: "DELETE" });
      await loadApplications();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "신청을 취소하지 못했습니다.");
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-brand-900 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb items={[{ label: "당신의 차례입니다" }]} inverse className="mb-6" />
          <a href="/" className="inline-flex items-center gap-2 text-sm text-brand-200 hover:text-white">
            <ArrowLeft size={17} />
            메인으로 돌아가기
          </a>
          <div className="mt-7 border-b border-brand-700 pb-8">
            <p className="text-xs font-bold tracking-widest text-brand-300">VOLUNTEER</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">당신의 차례입니다</h1>
            <p className="mt-4 max-w-2xl leading-7 text-brand-100">
              받은 은혜를 흘려보낼 봉사활동을 선택해 주세요. 달력 대신 참여 가능한 활동을 목록으로 안내합니다.
            </p>
          </div>
          {error && (
            <p role="alert" className="mt-5 rounded-md bg-red-950/40 p-3 text-sm text-red-100">
              {error}
            </p>
          )}
          <section className="mt-8 space-y-4" aria-label="봉사활동 목록">
            {loading && (
              <p
                role="status"
                className="rounded-lg border border-brand-700 bg-brand-800/60 p-10 text-center text-brand-100"
              >
                봉사활동을 불러오는 중입니다.
              </p>
            )}
            {activities.map((activity) => (
              <article
                key={activity.id}
                className="grid gap-5 rounded-lg border border-brand-700 bg-brand-800/60 p-5 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-xs font-bold text-brand-300">{activity.team?.name}</p>
                  <h2 className="mt-2 text-xl font-bold">{activity.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-100">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      {activity.schedule}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={16} />
                      {activity.capacity}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => open(activity)}
                  disabled={!activity.isAcceptingApplications}
                  className="h-11 rounded-md bg-white px-5 text-sm font-bold text-brand-900 disabled:bg-gray-400"
                >
                  상세보기 및 신청
                </button>
              </article>
            ))}
            {!loading && !error && activities.length === 0 && (
              <div className="rounded-lg border border-brand-700 bg-brand-800/60 px-5 py-14 text-center">
                <CalendarDays className="mx-auto text-brand-300" size={36} aria-hidden="true" />
                <p className="mt-4 font-bold text-white">현재 모집 중인 봉사활동이 없습니다.</p>
                <p className="mt-2 text-sm leading-6 text-brand-200">
                  새로운 활동이 등록되면 이곳에서 안내해 드리겠습니다.
                </p>
              </div>
            )}
          </section>
          {applications.length > 0 && (
            <section className="mt-12 border-t border-brand-700 pt-8">
              <h2 className="text-xl font-bold">이 브라우저의 신청 내역</h2>
              <div className="mt-4 space-y-3">
                {applications.map((application) => (
                  <article
                    key={application.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-white/10 p-4"
                  >
                    <div>
                      <p className="font-bold">
                        {application.activity?.title ?? application.team?.name ?? "봉사 신청"}
                      </p>
                      <p className="mt-1 text-xs text-brand-200">
                        {application.participationDate || new Date(application.appliedAt).toLocaleDateString("ko-KR")} ·{" "}
                        {statusLabel[application.status]}
                      </p>
                    </div>
                    {application.canCancel && (
                      <button
                        onClick={() => void cancel(application)}
                        className="rounded-md border border-brand-300 px-3 py-2 text-sm"
                      >
                        신청 취소
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      {selected && (
        <ParticipationDialog
          activity={selected}
          applications={applications}
          onClose={close}
          onSaved={loadApplications}
        />
      )}
    </>
  );
}
