import { BadgeCheck, CalendarDays, CheckCircle2, ClipboardList, Clock3, Pencil, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ApplicationStatus, VolunteerApplication } from "../../types/platform";
import { ApplicationEditDialog } from "./ApplicationEditDialog";

const labels: Record<ApplicationStatus, string> = {
  SUBMITTED: "접수",
  LEADER_CONFIRMED: "팀장 승인",
  REJECTED: "거절",
  CANCELLED: "취소",
  COMPLETED: "참여 완료",
};
const colors: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700",
  LEADER_CONFIRMED: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

export function MyActivitiesPage() {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<VolunteerApplication | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await api<VolunteerApplication[]>("/applications/mine"));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "활동 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const cancel = async (application: VolunteerApplication) => {
    if (!window.confirm(`‘${application.activity?.title ?? "봉사활동"}’ 신청을 취소할까요?`)) return;
    try {
      await api(`/applications/${application.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "신청을 취소하지 못했습니다.");
    }
  };
  const pendingCount = applications.filter((application) => application.status === "SUBMITTED").length;
  const confirmedCount = applications.filter((application) => application.status === "LEADER_CONFIRMED").length;
  const completedCount = applications.filter((application) => application.status === "COMPLETED").length;
  const closedCount = applications.filter((application) =>
    ["REJECTED", "CANCELLED"].includes(application.status),
  ).length;
  const processSummary = [
    {
      label: "신청 대기 중",
      count: pendingCount,
      description: "팀장 승인을 기다리고 있어요",
      icon: Clock3,
      className: "border-blue-200 bg-blue-50 text-blue-800",
      iconClassName: "bg-blue-100 text-blue-700",
    },
    {
      label: "신청 완료",
      count: confirmedCount,
      description: "참여가 확정된 봉사예요",
      icon: CheckCircle2,
      className: "border-violet-200 bg-violet-50 text-violet-800",
      iconClassName: "bg-violet-100 text-violet-700",
    },
    {
      label: "봉사 완료",
      count: completedCount,
      description: "참여를 마친 봉사예요",
      icon: BadgeCheck,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
  ];
  if (loading)
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        활동 내역을 불러오는 중입니다.
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-white px-5 py-4">
        <h2 className="text-xl font-bold">활동 내역</h2>
        <p className="mt-1 text-xs text-gray-500">신청 상태와 완료된 참여 이력을 확인합니다.</p>
      </div>
      <section aria-label="봉사 신청 프로세스 현황">
        <div className="grid gap-3 sm:grid-cols-3">
          {processSummary.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className={`rounded-lg border p-4 ${item.className}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black">
                      {item.count}
                      <span className="ml-0.5 text-sm font-bold">건</span>
                    </p>
                    <h3 className="mt-1 font-bold">{item.label}</h3>
                  </div>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.iconClassName}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-xs opacity-75">{item.description}</p>
              </article>
            );
          })}
        </div>
        {closedCount > 0 && <p className="mt-2 text-right text-xs text-gray-500">취소·거절된 신청 {closedCount}건</p>}
      </section>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {applications.length ? (
        <div className="space-y-3">
          {applications.map((application) => (
            <article key={application.id} className="rounded-lg border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-brand-800">{application.team?.name ?? "사역팀"}</p>
                  <h3 className="mt-1 font-bold">{application.activity?.title ?? "기존 봉사 신청"}</h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {application.participationDate || new Date(application.appliedAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span>{application.participationType === "ONCE" ? "1회성 참여" : "지속적 팀 참여"}</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[application.status]}`}>
                  {labels[application.status]}
                </span>
              </div>
              {application.canCancel ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <button
                    onClick={() => setEditing(application)}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-bold"
                  >
                    <Pencil size={16} />
                    신청 수정
                  </button>
                  <button
                    onClick={() => void cancel(application)}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-600"
                  >
                    <XCircle size={16} />
                    신청 취소
                  </button>
                  <p className="w-full text-xs text-gray-500">팀장 승인 전까지만 직접 수정하거나 취소할 수 있습니다.</p>
                </div>
              ) : application.status === "LEADER_CONFIRMED" ? (
                <p className="mt-4 border-t pt-4 text-xs text-gray-500">
                  변경이나 취소가 필요하면 팀장에게 문의해 주세요.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-64 place-items-center rounded-lg border bg-white text-center">
          <div>
            <ClipboardList className="mx-auto text-gray-300" size={36} />
            <p className="mt-4 font-bold text-gray-700">아직 신청한 봉사활동이 없습니다.</p>
            <a
              href="/volunteer"
              className="mt-4 inline-flex rounded-md bg-brand-400 px-4 py-2 text-sm font-bold text-darkness hover:bg-brand-500"
            >
              봉사활동 살펴보기
            </a>
          </div>
        </div>
      )}
      {editing && (
        <ApplicationEditDialog application={editing} onClose={() => setEditing(null)} onSaved={() => void load()} />
      )}
    </div>
  );
}
