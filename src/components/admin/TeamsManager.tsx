import { Eye, EyeOff, Pencil, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { MinistryTeam } from "../../types/platform";
import { TeamForm } from "./TeamForm";
import { TeamOverviewDialog } from "./TeamOverviewDialog";

export function TeamsManager() {
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [editing, setEditing] = useState<MinistryTeam | null>(null);
  const [managing, setManaging] = useState<MinistryTeam | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setTeams(await api<MinistryTeam[]>("/teams?includeHidden=true"));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사역팀을 불러오지 못했습니다.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-white p-4">
        <h3 className="font-bold">사역팀 {teams.length}개</h3>
        <p className="mt-1 text-xs text-gray-500">사역 소개와 함께 소속 회원 및 현장 게시물을 관리합니다.</p>
      </div>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="divide-y">
          {teams.map((team) => (
            <article key={team.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_160px_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{team.name}</h4>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold ${team.isVisible ? "text-brand-700" : "text-gray-400"}`}
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
                  className="grid h-9 w-9 place-items-center text-brand-700"
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
              </div>
            </article>
          ))}
        </div>
      </section>
      {editing && <TeamForm team={editing} onClose={() => setEditing(null)} onSaved={() => void load()} />}
      {managing && <TeamOverviewDialog team={managing} teams={teams} onClose={() => setManaging(null)} />}
    </div>
  );
}
