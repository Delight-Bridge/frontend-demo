import { CalendarDays, ClipboardList, Pencil, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ApplicationStatus, VolunteerApplication } from "../../types/platform";
import { ApplicationEditDialog } from "./ApplicationEditDialog";

const labels: Record<ApplicationStatus, string> = {
  SUBMITTED: "접수",
  ADMIN_CONFIRMED: "관리자 확정",
  HANDED_TO_LEADER: "팀장 전달",
  REJECTED: "거절",
  CANCELLED: "취소",
  COMPLETED: "참여 완료",
};
const colors: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700",
  ADMIN_CONFIRMED: "bg-amber-50 text-amber-700",
  HANDED_TO_LEADER: "bg-violet-50 text-violet-700",
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
                  <p className="text-xs font-bold text-brand-700">{application.team?.name ?? "사역팀"}</p>
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
                  <p className="w-full text-xs text-gray-500">
                    관리자 확정 전까지만 직접 수정하거나 취소할 수 있습니다.
                  </p>
                </div>
              ) : ["ADMIN_CONFIRMED", "HANDED_TO_LEADER"].includes(application.status) ? (
                <p className="mt-4 border-t pt-4 text-xs text-gray-500">
                  변경이나 취소가 필요하면 관리자에게 문의해 주세요.
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
              className="mt-4 inline-flex rounded-md bg-brand-700 px-4 py-2 text-sm font-bold text-white"
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
