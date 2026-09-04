import { CheckCircle2, LogIn, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { VolunteerActivity, VolunteerApplication } from "../../types/platform";
import { Field, FormError, inputClass } from "../common/FormControls";

const todayInSeoul = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function ParticipationForm({
  activity,
  applications,
  onSaved,
  loginReturnUrl,
}: {
  activity: VolunteerActivity;
  applications: VolunteerApplication[];
  onSaved: () => Promise<void>;
  loginReturnUrl?: string;
}) {
  const { user, openLogin } = useAuth();
  const [form, setForm] = useState({
    applicantName: user?.name ?? "",
    age: "",
    phone: user?.phone ?? "",
    introduction: "",
    participationType: "ONCE" as "ONCE" | "CONTINUOUS",
    participationDate: activity.availableDates[0] ?? "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<VolunteerApplication | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const blockedKeys = useMemo(
    () =>
      new Set(
        applications
          .filter(
            (item) =>
              ["SUBMITTED", "ADMIN_CONFIRMED", "HANDED_TO_LEADER"].includes(item.status) &&
              item.activityId === activity.id,
          )
          .map((item) => item.participationDate || todayInSeoul()),
      ),
    [activity.id, applications],
  );
  const selectedKey = form.participationDate || todayInSeoul();
  const duplicated = blockedKeys.has(selectedKey);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await api<VolunteerApplication>("/applications", {
        method: "POST",
        body: JSON.stringify({ ...form, age: Number(form.age), activityId: activity.id, privacyConsent: agreed }),
      });
      setSuccess(result);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "봉사 신청을 접수하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
        <h3 className="mt-4 text-xl font-bold">신청이 접수되었습니다</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          관리자 확정 후 담당 팀장에게 전달됩니다. 확정 전까지는 마이페이지에서 신청을 수정하거나 취소할 수 있습니다.
        </p>
      </div>
    );
  }

  if (!user)
    return (
      <div className="p-6 text-center">
        <LogIn className="mx-auto text-brand-700" size={40} />
        <h3 className="mt-4 text-xl font-bold">로그인 후 신청할 수 있습니다</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          로그인을 마치면 선택한 봉사활동 신청 화면으로 돌아옵니다.
        </p>
        <button
          onClick={() => openLogin(loginReturnUrl ?? `/volunteer?activity=${activity.id}`)}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-brand-700 px-5 text-sm font-bold text-white"
        >
          <LogIn size={17} />
          로그인
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0 text-brand-600" size={22} />
        <div>
          <h3 className="font-bold">신청 정보</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            신청 내역은 로그인 계정에 연결되며 마이페이지에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
      {activity.availableDates.length > 0 && (
        <Field label="참여 날짜" required>
          <select
            required
            className={inputClass}
            value={form.participationDate}
            onChange={(event) => set("participationDate", event.target.value)}
          >
            {activity.availableDates.map((date) => (
              <option key={date} value={date} disabled={blockedKeys.has(date)}>
                {new Date(`${date}T00:00:00+09:00`).toLocaleDateString("ko-KR")}{" "}
                {blockedKeys.has(date) ? "· 신청 완료" : ""}
              </option>
            ))}
          </select>
        </Field>
      )}
      {!activity.availableDates.length && (
        <p
          className={`rounded-md p-3 text-sm ${duplicated ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-600"}`}
        >
          {duplicated
            ? "오늘 이미 신청한 활동입니다. 내일부터 다시 신청할 수 있습니다."
            : "상시 활동은 하루에 한 번 신청할 수 있습니다."}
        </p>
      )}
      <div className="grid grid-cols-[1fr_88px] gap-3">
        <Field label="이름" required>
          <input
            required
            maxLength={100}
            autoComplete="name"
            className={inputClass}
            value={form.applicantName}
            onChange={(event) => set("applicantName", event.target.value)}
          />
        </Field>
        <Field label="나이" required>
          <input
            required
            type="number"
            min={1}
            max={120}
            className={inputClass}
            value={form.age}
            onChange={(event) => set("age", event.target.value)}
          />
        </Field>
      </div>
      <Field label="전화번호" required>
        <input
          required
          type="tel"
          maxLength={30}
          autoComplete="tel"
          className={inputClass}
          value={form.phone}
          onChange={(event) => set("phone", event.target.value)}
          placeholder="010-0000-0000"
        />
      </Field>
      <Field label="참여 유형" required>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="참여 유형">
          {(
            [
              ["ONCE", "1회성 참여", "선택한 일정에 한 번 참여합니다."],
              ["CONTINUOUS", "지속적 팀 참여", "사역팀과 지속적으로 함께합니다."],
            ] as const
          ).map(([value, label, description]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${
                form.participationType === value
                  ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                required
                type="radio"
                name="participationType"
                value={value}
                checked={form.participationType === value}
                onChange={() => set("participationType", value)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
              />
              <span>
                <strong className="block text-sm text-gray-900">{label}</strong>
                <span className="mt-1 block text-xs font-normal leading-5 text-gray-500">{description}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="간단한 자기소개" required>
        <textarea
          required
          rows={4}
          maxLength={1000}
          className={inputClass}
          value={form.introduction}
          onChange={(event) => set("introduction", event.target.value)}
          placeholder="참여 동기, 경험, 가능한 일정 등을 적어주세요."
        />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-md bg-gray-50 p-3 text-sm">
        <input
          required
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span>
          <strong>[필수]</strong> 신청 정보 수집 및 이용에 동의합니다.
          <span className="mt-1 block text-xs leading-5 text-gray-500">
            이름, 나이, 전화번호와 자기소개는 사역 배정 및 연락 목적으로 저장됩니다.
          </span>
        </span>
      </label>
      <FormError message={error} />
      <button
        disabled={!agreed || duplicated || submitting || !activity.isAcceptingApplications}
        className="h-12 w-full rounded-md bg-brand-600 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {submitting ? "신청 접수 중..." : duplicated ? "이미 신청한 활동" : "신청하기"}
      </button>
    </form>
  );
}
