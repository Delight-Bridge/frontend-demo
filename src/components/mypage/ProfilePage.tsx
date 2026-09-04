import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { MinistryTeam, User } from "../../types/platform";
import { Field, FormError, inputClass } from "../common/FormControls";

type ProfileResponse = { user: User; needsOnboarding: boolean; team: Pick<MinistryTeam, "id" | "name"> | null };

export function ProfilePage({ showTeam = true }: { showTeam?: boolean }) {
  const { refreshSession } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api<ProfileResponse>("/me")
      .then((data) => {
        setProfile(data);
        setForm({ name: data.user.name, phone: data.user.phone });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "내 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = await api<ProfileResponse>("/me", { method: "PATCH", body: JSON.stringify(form) });
      setProfile(data);
      await refreshSession();
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "내 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        내 정보를 불러오는 중입니다.
      </div>
    );
  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-5 py-4">
        <h2 className="text-xl font-bold">내 정보 수정</h2>
        <p className="mt-1 text-xs text-gray-500">
          {showTeam
            ? "봉사 안내에 사용할 이름과 연락처를 관리합니다."
            : "관리자 계정에 사용할 이름과 연락처를 관리합니다."}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5 p-5 md:p-6">
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
            className={inputClass}
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="010-0000-0000"
          />
        </Field>
        {showTeam && (
          <>
            <Field label="소속 사역팀">
              <div className="min-h-11 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {profile?.team ? (
                  <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 font-bold text-brand-800">
                    {profile.team.name}
                  </span>
                ) : (
                  <span className="text-gray-500">소속된 사역팀이 없습니다.</span>
                )}
              </div>
            </Field>
            <p className="text-xs leading-5 text-gray-500">
              지속적 팀 참여가 승인되어 팀장에게 전달되면 소속 사역팀이 표시됩니다.
            </p>
          </>
        )}
        <FormError message={error} />
        {saved && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-700"
          >
            <CheckCircle2 size={17} />
            회원 정보가 저장되었습니다.
          </p>
        )}
        <button
          disabled={saving}
          className="h-11 w-full rounded-md bg-gray-900 font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "정보 저장하기"}
        </button>
      </form>
    </div>
  );
}
