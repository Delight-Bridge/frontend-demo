import { useState } from "react";
import { api } from "../../api/client";
import type { VolunteerApplication } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, inputClass } from "../common/FormControls";

export function ApplicationEditDialog({
  application,
  onClose,
  onSaved,
}: {
  application: VolunteerApplication;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [participationDate, setParticipationDate] = useState(application.participationDate);
  const [participationType, setParticipationType] = useState(application.participationType);
  const [introduction, setIntroduction] = useState(application.introduction ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api(`/applications/${application.id}`, {
        method: "PATCH",
        body: JSON.stringify({ participationDate, participationType, introduction }),
      });
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "신청을 수정하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog title="봉사 신청 수정" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <FormError message={error} />
        {Boolean(application.activity?.availableDates?.length) && (
          <Field label="참여 날짜" required>
            <select
              className={inputClass}
              required
              value={participationDate}
              onChange={(event) => setParticipationDate(event.target.value)}
            >
              {application.activity?.availableDates?.map((date) => (
                <option key={date} value={date}>
                  {new Date(`${date}T00:00:00+09:00`).toLocaleDateString("ko-KR")}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="참여 유형" required>
          <select
            className={inputClass}
            value={participationType}
            onChange={(event) => setParticipationType(event.target.value as VolunteerApplication["participationType"])}
          >
            <option value="ONCE">1회성 참여</option>
            <option value="CONTINUOUS">지속적 팀 참여</option>
          </select>
        </Field>
        <Field label="자기소개" required>
          <textarea
            className={`${inputClass} min-h-28`}
            required
            maxLength={1000}
            value={introduction}
            onChange={(event) => setIntroduction(event.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border px-4 text-sm font-bold">
            취소
          </button>
          <button
            disabled={saving}
            className="h-10 rounded-md bg-gray-900 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "변경 저장"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
