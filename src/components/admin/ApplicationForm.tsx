import { useState } from "react";
import { api } from "../../api/client";
import type { ApplicationStatus, MinistryTeam, User, VolunteerApplication } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, inputClass } from "../common/FormControls";

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const statusOptions: Array<[ApplicationStatus, string]> = [
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

export function ApplicationForm({
  application,
  teams,
  users,
  onClose,
  onSaved,
}: {
  application?: VolunteerApplication;
  teams: MinistryTeam[];
  users: User[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    userId: application?.userId ?? "",
    ministryTeamId: application?.ministryTeamId ?? teams[0]?.id ?? "",
    applicantName: application?.applicantName ?? "",
    age: application?.age ?? 18,
    phone: application?.phone ?? application?.contact ?? "",
    introduction: application?.introduction ?? "",
    participationType: application?.participationType ?? "ONCE",
    status: application?.status ?? "SUBMITTED",
    source: application?.source ?? "MANUAL",
    memo: application?.memo ?? "",
    appliedAt: toLocalDateTime(application?.appliedAt ?? new Date().toISOString()),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(application ? `/admin/applications/${application.id}` : "/admin/applications", {
        method: application ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, appliedAt: new Date(form.appliedAt).toISOString() }),
      });
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "신청 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog title={application ? "봉사 신청 수정" : "봉사 신청 등록"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="신청자명" required>
          <input
            required
            maxLength={100}
            className={inputClass}
            value={form.applicantName}
            onChange={(event) => set("applicantName", event.target.value)}
          />
        </Field>
        <Field label="나이" required>
          <input
            required
            type="number"
            min={0}
            max={120}
            className={inputClass}
            value={form.age}
            onChange={(event) => set("age", Number(event.target.value))}
          />
        </Field>
        <Field label="전화번호" required>
          <input
            required
            type="tel"
            maxLength={30}
            className={inputClass}
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </Field>
        <Field label="연결 회원">
          <select
            className={inputClass}
            value={form.userId}
            onChange={(event) => {
              const selected = users.find((user) => user.id === event.target.value);
              set("userId", event.target.value);
              if (selected && !form.applicantName) set("applicantName", selected.nickname);
            }}
          >
            <option value="">비회원 또는 연결 안 함</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nickname}
              </option>
            ))}
          </select>
        </Field>
        <Field label="사역팀" required>
          <select
            required
            className={inputClass}
            value={form.ministryTeamId}
            onChange={(event) => set("ministryTeamId", event.target.value)}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="참여 유형" required>
          <select
            className={inputClass}
            value={form.participationType}
            onChange={(event) => set("participationType", event.target.value as "ONCE" | "CONTINUOUS")}
          >
            <option value="ONCE">1회 참여</option>
            <option value="CONTINUOUS">지속 참여</option>
          </select>
        </Field>
        <Field label="처리 상태" required>
          <select
            className={inputClass}
            value={form.status}
            disabled={Boolean(application && !nextStatuses[application.status].length)}
            onChange={(event) => set("status", event.target.value as ApplicationStatus)}
          >
            {statusOptions
              .filter(([value]) =>
                application
                  ? value === application.status || nextStatuses[application.status].includes(value)
                  : value === "SUBMITTED",
              )
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </Field>
        <Field label="신청 출처" required>
          <select
            className={inputClass}
            value={form.source}
            onChange={(event) => set("source", event.target.value as "SITE" | "MANUAL")}
          >
            <option value="SITE">사이트 신청</option>
            <option value="MANUAL">관리자 직접 등록</option>
          </select>
        </Field>
        <Field label="신청 일시" required>
          <input
            required
            type="datetime-local"
            className={inputClass}
            value={form.appliedAt}
            onChange={(event) => set("appliedAt", event.target.value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="자기소개" required>
            <textarea
              required
              rows={4}
              maxLength={1000}
              className={inputClass}
              value={form.introduction}
              onChange={(event) => set("introduction", event.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="관리 메모">
            <textarea
              rows={4}
              maxLength={2000}
              className={inputClass}
              value={form.memo}
              onChange={(event) => set("memo", event.target.value)}
              placeholder="연락 결과, 배정 일정, 특이사항 등을 기록하세요."
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <FormError message={error} />
          <button
            disabled={saving}
            className="mt-3 h-11 w-full rounded-md bg-gray-900 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "신청 정보 저장"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
