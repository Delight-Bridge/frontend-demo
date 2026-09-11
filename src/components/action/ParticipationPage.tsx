import { SectionHeading } from "../SectionHeading";
import { CalendarDays, Users } from "lucide-react";
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
  LEADER_CONFIRMED: "팀장 승인",
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
      <main id="main-content" className="content-page">
        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb items={[{ label: "당신의 차례입니다" }]} className="mb-8" />
          <SectionHeading
            as="h1"
            align="left"
            eyebrow="VOLUNTEER"
            title="당신의 차례입니다"
            description="받은 은혜를 흘려보낼 봉사활동을 선택해 주세요. 달력 대신 참여 가능한 활동을 목록으로 안내합니다."
          />
          {error && (
            <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <section className="mt-10 space-y-4" aria-label="봉사활동 목록">
            {loading && (
              <p role="status" className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-600">
                봉사활동을 불러오는 중입니다.
              </p>
            )}
            {activities.map((activity) => (
              <article
                key={activity.id}
                className="grid gap-5 rounded-lg border border-gray-200 bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-xs font-bold text-brand-800">{activity.team?.name}</p>
                  <h2 className="mt-2 text-xl font-bold">{activity.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
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
                  className="h-10 rounded-md bg-brand-400 px-5 text-sm font-bold text-darkness hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-40"
                >
                  상세보기 및 신청
                </button>
              </article>
            ))}
            {!loading && !error && activities.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white px-5 py-14 text-center">
                <CalendarDays className="mx-auto text-brand-800" size={36} aria-hidden="true" />
                <p className="mt-4 font-bold text-gray-900">현재 모집 중인 봉사활동이 없습니다.</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  새로운 활동이 등록되면 이곳에서 안내해 드리겠습니다.
                </p>
              </div>
            )}
          </section>
          {applications.length > 0 && (
            <section className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold">이 브라우저의 신청 내역</h2>
              <div className="mt-4 space-y-3">
                {applications.map((application) => (
                  <article
                    key={application.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-gray-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-bold">
                        {application.activity?.title ?? application.team?.name ?? "봉사 신청"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {application.participationDate || new Date(application.appliedAt).toLocaleDateString("ko-KR")} ·{" "}
                        {statusLabel[application.status]}
                      </p>
                    </div>
                    {application.canCancel && (
                      <button
                        onClick={() => void cancel(application)}
                        className="rounded-md border border-brand-400 text-brand-800 hover:bg-brand-100 px-3 py-2 text-sm"
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
