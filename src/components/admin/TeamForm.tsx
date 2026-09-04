import { useState } from "react";
import { api } from "../../api/client";
import type { MinistryTeam } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, inputClass } from "../common/FormControls";

export function TeamForm({ team, onClose, onSaved }: { team: MinistryTeam; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(team);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof MinistryTeam, value: string | number | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/teams/${team.id}`, { method: "PATCH", body: JSON.stringify(form) });
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog title="사역팀 정보 수정" onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="사역팀명" required>
          <input required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="한 줄 소개" required>
          <input
            required
            className={inputClass}
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="비전" required>
            <textarea
              required
              rows={3}
              className={inputClass}
              value={form.vision}
              onChange={(e) => set("vision", e.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="주요 활동" required>
            <textarea
              required
              rows={3}
              className={inputClass}
              value={form.activities}
              onChange={(e) => set("activities", e.target.value)}
            />
          </Field>
        </div>
        <Field label="활동 일정" required>
          <input
            required
            className={inputClass}
            value={form.schedule}
            onChange={(e) => set("schedule", e.target.value)}
          />
        </Field>
        <Field label="모집 대상">
          <input
            className={inputClass}
            value={form.targetAudience}
            onChange={(e) => set("targetAudience", e.target.value)}
          />
        </Field>
        <Field label="문의 정보">
          <input className={inputClass} value={form.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} />
        </Field>
        <Field label="카카오톡 단체방 초대 링크">
          <input
            type="url"
            className={inputClass}
            value={form.kakaoInviteUrl}
            onChange={(e) => set("kakaoInviteUrl", e.target.value)}
            placeholder="https://open.kakao.com/o/..."
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isVisible} onChange={(e) => set("isVisible", e.target.checked)} />
          공개
        </label>
        <div className="md:col-span-2">
          <FormError message={error} />
          <button
            disabled={saving}
            className="mt-3 h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "사역팀 저장"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
