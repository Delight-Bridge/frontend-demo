import { useState } from "react";
import { api } from "../api/client";
import { Dialog } from "../components/common/Dialog";
import { Field, FormError, inputClass } from "../components/common/FormControls";

export function OnboardingDialog({
  onCompleted,
  onCancel,
}: {
  onCompleted: () => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [agreed, setAgreed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/me", { method: "PATCH", body: JSON.stringify({ ...form, privacyConsent: agreed }) });
      await onCompleted();
      const url = new URL(window.location.href);
      url.searchParams.delete("onboarding");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="최초 가입 시 필수 입력" onClose={() => void onCancel()} size="sm">
      <form onSubmit={submit} className="space-y-4 p-5">
        <p className="text-sm leading-6 text-gray-600">
          서비스 이용을 위해 아래 필수 정보를 입력하고 개인정보 수집에 동의해 주세요.
        </p>
        <Field label="이름" required>
          <input
            required
            maxLength={100}
            autoComplete="name"
            className={inputClass}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </Field>
        <Field label="연락처" required>
          <input
            required
            type="tel"
            maxLength={30}
            autoComplete="tel"
            placeholder="010-0000-0000"
            className={inputClass}
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 rounded-md bg-gray-50 p-3 text-sm leading-6">
          <input
            required
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          <span>
            <strong>[필수]</strong> 개인정보 수집 및 이용에 동의합니다.
            <span className="block text-xs text-gray-500">
              이름과 연락처는 회원 관리 및 봉사 안내를 위해 수집하며 현재 정책안 기준 탈퇴 후 3년간 보관합니다.
            </span>
          </span>
        </label>
        <FormError message={error} />
        <button
          disabled={!agreed || saving}
          className="h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {saving ? "저장 중..." : "가입 완료"}
        </button>
      </form>
    </Dialog>
  );
}
