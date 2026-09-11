import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { MinistryTeam, User } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { Field, FormError, inputClass } from "../common/FormControls";

type TeamSummary = Pick<MinistryTeam, "id" | "name">;
type ProfileResponse = {
  user: User;
  needsOnboarding: boolean;
  team: TeamSummary | null;
  requestedTeam: TeamSummary | null;
};

export function ProfilePage({ showTeam = true }: { showTeam?: boolean }) {
  const { refreshSession, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [requestedTeamId, setRequestedTeamId] = useState("");
  const [requestingTeamChange, setRequestingTeamChange] = useState(false);
  const [teamRequestError, setTeamRequestError] = useState("");
  const [teamRequestSaved, setTeamRequestSaved] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  useEffect(() => {
    Promise.all([api<ProfileResponse>("/me"), api<MinistryTeam[]>("/teams")])
      .then(([data, teamData]) => {
        setProfile(data);
        setTeams(teamData);
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
  const requestTeamChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestedTeamId) return;
    setRequestingTeamChange(true);
    setTeamRequestError("");
    try {
      await api("/me/team-change-request", {
        method: "POST",
        body: JSON.stringify({ ministryTeamId: requestedTeamId }),
      });
      setProfile(await api<ProfileResponse>("/me"));
      setTeamDialogOpen(false);
      setTeamRequestSaved(true);
    } catch (caught) {
      setTeamRequestError(caught instanceof Error ? caught.message : "사역팀 변경을 신청하지 못했습니다.");
    } finally {
      setRequestingTeamChange(false);
    }
  };
  const withdraw = async () => {
    setWithdrawing(true);
    setWithdrawError("");
    try {
      await api("/me", { method: "DELETE" });
      await logout();
      window.location.href = "/";
    } catch (caught) {
      setWithdrawError(caught instanceof Error ? caught.message : "회원 탈퇴를 처리하지 못했습니다.");
      setWithdrawing(false);
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
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <span>
                  {profile?.team ? (
                    <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 font-bold text-brand-800">
                      {profile.team.name}
                    </span>
                  ) : (
                    <span className="text-gray-500">소속된 사역팀이 없습니다.</span>
                  )}
                </span>
                {profile?.user.role === "USER" && (
                  <button
                    type="button"
                    onClick={() => {
                      setRequestedTeamId(profile.requestedTeam?.id ?? "");
                      setTeamRequestError("");
                      setTeamDialogOpen(true);
                    }}
                    className="rounded-md border border-brand-300 bg-white px-3 py-2 text-xs font-bold text-brand-800 hover:bg-brand-50"
                  >
                    소속 사역팀 변경
                  </button>
                )}
              </div>
            </Field>
            {profile?.user.role === "USER" && profile.requestedTeam && (
              <p className="rounded-md bg-amber-50 p-3 text-xs font-medium text-amber-800">
                ‘{profile.requestedTeam.name}’으로 변경 요청을 검토 중입니다.
              </p>
            )}
            <p className="text-xs leading-5 text-gray-500">
              소속 사역팀은 관리자가 배정하며, 변경 사항은 이곳에 자동으로 표시됩니다.
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
          className="h-10 w-full rounded-md bg-brand-400 font-bold text-darkness disabled:opacity-40 hover:bg-brand-500"
        >
          {saving ? "저장 중..." : "정보 저장하기"}
        </button>
      </form>
      {profile && profile.user.role !== "ADMIN" && (
        <section className="border-t border-red-100 bg-red-50/40 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900">회원 탈퇴</h3>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                탈퇴하면 현재 계정으로 더 이상 로그인하거나 마이페이지를 이용할 수 없습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWithdrawError("");
                setWithdrawDialogOpen(true);
              }}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              회원 탈퇴
            </button>
          </div>
        </section>
      )}
      {teamDialogOpen && profile?.user.role === "USER" && (
        <Dialog title="소속 사역팀 변경 신청" onClose={() => setTeamDialogOpen(false)} size="sm">
          <form onSubmit={requestTeamChange} className="space-y-5 p-5">
            <p className="rounded-md bg-brand-50 p-3 text-sm leading-6 text-brand-900">
              변경 신청 후 관리자가 확인하고 승인하면 소속 사역팀이 변경됩니다.
            </p>
            <fieldset>
              <legend className="text-sm font-bold text-gray-800">변경할 사역팀을 선택해 주세요.</legend>
              <div className="soft-scrollbar mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {teams
                  .filter((team) => team.id !== profile.user.ministryTeamId)
                  .map((team) => (
                    <label
                      key={team.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${requestedTeamId === team.id ? "border-brand-500 bg-brand-50 font-bold text-brand-900" : "border-gray-200 hover:border-brand-300"}`}
                    >
                      <input
                        type="radio"
                        name="requestedMinistryTeamId"
                        value={team.id}
                        checked={requestedTeamId === team.id}
                        onChange={() => setRequestedTeamId(team.id)}
                        className="h-4 w-4 accent-brand-400"
                      />
                      {team.name}
                    </label>
                  ))}
              </div>
            </fieldset>
            <FormError message={teamRequestError} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTeamDialogOpen(false)}
                className="h-10 rounded-md border font-bold text-gray-700"
              >
                취소
              </button>
              <button
                disabled={!requestedTeamId || requestingTeamChange}
                className="h-10 rounded-md bg-brand-400 font-bold text-darkness disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-500"
              >
                {requestingTeamChange ? "신청 중..." : "변경 신청"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {teamRequestSaved && (
        <Dialog title="변경 신청 완료" onClose={() => setTeamRequestSaved(false)} size="sm">
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto text-brand-800" size={42} aria-hidden="true" />
            <p role="status" className="mt-4 font-bold text-gray-900">
              변경 요청이 관리자에게 전달되었습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">관리자가 요청을 확인한 후 변경을 진행합니다.</p>
            <button
              type="button"
              onClick={() => setTeamRequestSaved(false)}
              className="mt-6 h-10 w-full rounded-md bg-brand-400 font-bold text-darkness hover:bg-brand-500"
            >
              확인
            </button>
          </div>
        </Dialog>
      )}
      {withdrawDialogOpen && profile?.user.role !== "ADMIN" && (
        <Dialog title="회원 탈퇴" onClose={() => !withdrawing && setWithdrawDialogOpen(false)} size="sm">
          <div className="p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={28} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-gray-950">정말 회원 탈퇴하시겠습니까?</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              탈퇴 즉시 로그아웃되며 현재 계정은 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 text-left">
              <FormError message={withdrawError} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWithdrawDialogOpen(false)}
                disabled={withdrawing}
                className="h-10 rounded-md border font-bold text-gray-700 disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void withdraw()}
                disabled={withdrawing}
                className="h-10 rounded-md bg-red-600 font-bold text-white disabled:opacity-40"
              >
                {withdrawing ? "탈퇴 처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
