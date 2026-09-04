import { useState } from "react";
import { api } from "../../api/client";
import type { MinistryTeam, VolunteerActivity } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, inputClass } from "../common/FormControls";

export function ActivityForm({
  activity,
  teams,
  onClose,
  onSaved,
}: {
  activity?: VolunteerActivity;
  teams: MinistryTeam[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    ministryTeamId: activity?.ministryTeamId ?? teams[0]?.id ?? "",
    title: activity?.title ?? "",
    vision: activity?.vision ?? "",
    description: activity?.description ?? "",
    schedule: activity?.schedule ?? "",
    capacity: activity?.capacity ?? "",
    availableDates: activity?.availableDates.join("\n") ?? "",
    isAcceptingApplications: activity?.isAcceptingApplications ?? true,
    isVisible: activity?.isVisible ?? true,
    displayOrder: activity?.displayOrder ?? 100,
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
      const payload = {
        ...form,
        availableDates: form.availableDates
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      await api(activity ? `/activities/${activity.id}` : "/activities", {
        method: activity ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "봉사활동을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog title={activity ? "봉사활동 수정" : "봉사활동 등록"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid gap-4 p-5 md:grid-cols-2">
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
        <Field label="활동 제목" required>
          <input
            required
            maxLength={200}
            className={inputClass}
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="비전" required>
            <textarea
              required
              rows={3}
              maxLength={1000}
              className={inputClass}
              value={form.vision}
              onChange={(event) => set("vision", event.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="사역 내용" required>
            <textarea
              required
              rows={4}
              maxLength={5000}
              className={inputClass}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
        </div>
        <Field label="일정 안내" required>
          <input
            required
            maxLength={500}
            className={inputClass}
            value={form.schedule}
            onChange={(event) => set("schedule", event.target.value)}
          />
        </Field>
        <Field label="모집 인원" required>
          <input
            required
            maxLength={100}
            className={inputClass}
            value={form.capacity}
            onChange={(event) => set("capacity", event.target.value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="선택 가능한 날짜 (줄마다 YYYY-MM-DD)">
            <textarea
              rows={4}
              className={inputClass}
              value={form.availableDates}
              onChange={(event) => set("availableDates", event.target.value)}
              placeholder={"날짜가 없는 상시 활동은 비워두세요.\n2026-09-05\n2026-09-12"}
            />
          </Field>
        </div>
        <Field label="정렬 순서">
          <input
            type="number"
            className={inputClass}
            value={form.displayOrder}
            onChange={(event) => set("displayOrder", Number(event.target.value))}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(event) => set("isVisible", event.target.checked)}
            />
            화면에 공개
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isAcceptingApplications}
              onChange={(event) => set("isAcceptingApplications", event.target.checked)}
            />
            신청 접수
          </label>
        </div>
        <div className="md:col-span-2">
          <FormError message={error} />
          <button
            disabled={saving}
            className="mt-3 h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "봉사활동 저장"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
