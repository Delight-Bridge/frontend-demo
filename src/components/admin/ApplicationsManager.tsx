import { Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ApplicationStatus, MinistryTeam, PageResult, User, VolunteerApplication } from "../../types/platform";
import { inputClass } from "../common/FormControls";
import { Pagination } from "../common/Pagination";
import { Dialog } from "../common/Dialog";
import { ApplicationForm } from "./ApplicationForm";

const pageSize = 20;

const statuses: Array<[ApplicationStatus, string]> = [
  ["SUBMITTED", "접수"],
  ["ADMIN_CONFIRMED", "관리자 확정"],
  ["HANDED_TO_LEADER", "팀장 전달"],
  ["REJECTED", "참여 불가"],
  ["CANCELLED", "취소"],
  ["COMPLETED", "참여 완료"],
];
const nextStatuses: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["ADMIN_CONFIRMED", "REJECTED", "CANCELLED"],
  ADMIN_CONFIRMED: ["HANDED_TO_LEADER", "REJECTED", "CANCELLED"],
  HANDED_TO_LEADER: ["COMPLETED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};
const sourceLabel = { SITE: "사이트 신청", MANUAL: "직접 등록" } as const;

export function ApplicationsManager() {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [teamId, setTeamId] = useState("");
  const [editing, setEditing] = useState<VolunteerApplication | "new" | null>(null);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (teamId) params.set("teamId", teamId);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    try {
      setLoading(true);
      const [applicationData, teamData, userData] = await Promise.all([
        api<PageResult<VolunteerApplication>>(`/admin/applications?${params}`),
        api<MinistryTeam[]>("/teams?includeHidden=true"),
        api<PageResult<User>>("/admin/users?page=1&pageSize=100"),
      ]);
      setApplications(applicationData.items);
      setTotalItems(applicationData.totalItems);
      setTotalPages(applicationData.totalPages);
      setTeams(teamData);
      setUsers(userData.items);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "신청 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [query, status, teamId, page]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateStatus = async (application: VolunteerApplication, nextStatus: ApplicationStatus) => {
    try {
      await api(`/admin/applications/${application.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "상태를 변경하지 못했습니다.");
    }
  };
  const remove = async (application: VolunteerApplication) => {
    if (!window.confirm(`‘${application.applicantName}’ 신청 내역을 삭제할까요?`)) return;
    try {
      await api(`/admin/applications/${application.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-md border bg-white p-4 lg:grid-cols-[1fr_170px_210px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            className={`${inputClass} pl-10`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="신청자명 또는 연락처 검색"
          />
        </label>
        <select
          className={inputClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="신청 상태 필터"
        >
          <option value="">모든 상태</option>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={teamId}
          onChange={(event) => {
            setTeamId(event.target.value);
            setPage(1);
          }}
          aria-label="사역팀 필터"
        >
          <option value="">모든 사역팀</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEditing("new")}
          disabled={!teams.length}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={17} />
          신청 등록
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="border-b px-5 py-4">
          <h3 className="font-bold">봉사 신청 {totalItems}건</h3>
          <p className="mt-1 text-xs text-gray-500">사이트에서 접수된 신청자의 정보와 진행 상태를 관리합니다.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-bold text-gray-600">
              <tr>
                <th className="w-16 px-3 py-3 text-center">No.</th>
                <th className="px-4 py-3">신청자 이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="w-28 px-4 py-3">참여유형</th>
                <th className="px-4 py-3">사역팀·활동</th>
                <th className="w-44 px-4 py-3 text-center">상태</th>
                <th className="w-40 px-4 py-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((application, index) => (
                <tr key={application.id} className="align-center text-gray-700 hover:bg-gray-50/70">
                  <td className="px-3 py-4 text-center text-gray-500">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-gray-950">{application.applicantName}</strong>
                      {application.user && (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                          회원
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {application.age ? `${application.age}세 · ` : ""}
                      {new Date(application.appliedAt).toLocaleDateString("ko-KR")}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`tel:${application.phone || application.contact}`} className="hover:text-brand-700">
                      {application.phone || application.contact}
                    </a>
                  </td>
                  <td className="px-4 py-4">{application.participationType === "ONCE" ? "1회 참여" : "지속 참여"}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{application.team?.name ?? "삭제된 사역팀"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {application.activity?.title ?? "기존 봉사 신청"}
                      {application.participationDate ? ` · ${application.participationDate}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">{sourceLabel[application.source]}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className={inputClass}
                      value={application.status}
                      disabled={!nextStatuses[application.status].length}
                      onChange={(event) => void updateStatus(application, event.target.value as ApplicationStatus)}
                      aria-label={`${application.applicantName} 신청 상태`}
                    >
                      {statuses
                        .filter(
                          ([value]) =>
                            value === application.status ||
                            (value !== "HANDED_TO_LEADER" && nextStatuses[application.status].includes(value)),
                        )
                        .map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                    </select>
                    {application.status === "ADMIN_CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => void updateStatus(application, "HANDED_TO_LEADER")}
                        className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-brand-700 px-3 text-xs font-bold text-white hover:bg-brand-800"
                      >
                        <Send size={14} />
                        팀장 전달
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => setEditing(application)}
                        className="grid h-9 w-9 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
                        aria-label={`${application.applicantName} 신청 수정`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void remove(application)}
                        className="grid h-9 w-9 place-items-center rounded-md text-red-500 hover:bg-red-50"
                        aria-label={`${application.applicantName} 신청 삭제`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(application)}
                      className="mt-2 w-full text-center text-xs font-bold text-brand-700 hover:underline"
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <p role="status" className="py-16 text-center text-sm text-gray-500">
              신청 내역을 불러오는 중입니다.
            </p>
          )}
          {!loading && !applications.length && (
            <p className="py-16 text-center text-sm text-gray-500">조건에 맞는 신청 내역이 없습니다.</p>
          )}
        </div>
      </section>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      {editing && (
        <ApplicationForm
          application={editing === "new" ? undefined : editing}
          teams={teams}
          users={users}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
      {selected && (
        <Dialog title={`${selected.applicantName} 신청 상세`} onClose={() => setSelected(null)} size="lg">
          <div className="space-y-6 p-5 md:p-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-gray-500">연락처</dt>
                <dd className="mt-1 text-gray-900">{selected.phone || selected.contact}</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500">참여 유형</dt>
                <dd className="mt-1 text-gray-900">
                  {selected.participationType === "ONCE" ? "1회 참여" : "지속 참여"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500">사역팀</dt>
                <dd className="mt-1 text-gray-900">{selected.team?.name ?? "삭제된 사역팀"}</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500">현재 상태</dt>
                <dd className="mt-1 text-gray-900">
                  {statuses.find(([value]) => value === selected.status)?.[1] ?? selected.status}
                </dd>
              </div>
            </dl>
            {selected.introduction && (
              <section className="border-t pt-5">
                <h3 className="font-bold text-gray-900">자기소개</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{selected.introduction}</p>
              </section>
            )}
            {selected.memo && (
              <section className="border-t pt-5">
                <h3 className="font-bold text-gray-900">관리 메모</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{selected.memo}</p>
              </section>
            )}
            {selected.history?.length ? (
              <section className="border-t pt-5">
                <h3 className="font-bold text-gray-900">상태 변경 이력</h3>
                <ol className="mt-3 space-y-2 border-l pl-4 text-sm text-gray-600">
                  {selected.history.map((history) => (
                    <li key={history.id}>
                      <strong className="text-gray-900">
                        {statuses.find(([value]) => value === history.toStatus)?.[1] ?? history.toStatus}
                      </strong>
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(history.changedAt).toLocaleString("ko-KR")} · {history.changedByName}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </Dialog>
      )}
    </div>
  );
}
