import { Eye, EyeOff, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { MinistryTeam } from "../../types/platform";
import { TeamForm } from "./TeamForm";
import { TeamOverviewDialog } from "./TeamOverviewDialog";

export function TeamsManager() {
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [editing, setEditing] = useState<MinistryTeam | "new" | null>(null);
  const [managing, setManaging] = useState<MinistryTeam | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setTeams(await api<MinistryTeam[]>("/teams?includeHidden=true"));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사역팀을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const remove = async (team: MinistryTeam) => {
    if (!window.confirm(`‘${team.name}’ 사역팀을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    setDeletingId(team.id);
    setError("");
    try {
      await api(`/teams/${team.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사역팀을 삭제하지 못했습니다.");
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border bg-white p-4">
        <div>
          <h3 className="font-bold">사역팀 {teams.length}개</h3>
          <p className="mt-1 text-xs text-gray-500">사역 소개와 함께 소속 회원 및 현장 게시물을 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex h-10 items-center gap-2 rounded-md bg-brand-400 px-4 text-sm font-bold text-darkness hover:bg-brand-500"
        >
          <Plus size={17} />
          사역팀 등록
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && (
        <p role="status" className="py-8 text-center text-sm text-gray-500">
          사역팀을 불러오는 중입니다.
        </p>
      )}
      {!loading && !error && !teams.length && (
        <p className="py-8 text-center text-sm text-gray-500">등록된 사역팀이 없습니다. 새 사역팀을 등록해 주세요.</p>
      )}
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="divide-y">
          {teams.map((team) => (
            <article key={team.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_160px_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{team.name}</h4>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold ${team.isVisible ? "text-brand-800" : "text-gray-400"}`}
                  >
                    {team.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {team.isVisible ? "공개" : "비공개"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{team.shortDescription}</p>
              </div>
              <span className="text-xs text-gray-500">노출 순서 {team.displayOrder}</span>
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setManaging(team)}
                  className="grid h-9 w-9 place-items-center text-brand-800"
                  aria-label={`${team.name} 회원 및 게시물 관리`}
                >
                  <Users size={17} />
                </button>
                <button
                  onClick={() => setEditing(team)}
                  className="grid h-9 w-9 place-items-center text-gray-500"
                  aria-label={`${team.name} 수정`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(team)}
                  disabled={deletingId !== null}
                  className="grid h-9 w-9 place-items-center text-red-500 disabled:opacity-40"
                  aria-label={`${team.name} 삭제`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {editing && (
        <TeamForm
          team={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
      {managing && <TeamOverviewDialog team={managing} teams={teams} onClose={() => setManaging(null)} />}
    </div>
  );
}
