import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { MinistryTeam, VolunteerActivity } from "../../types/platform";
import { ActivityForm } from "./ActivityForm";

export function ActivitiesManager() {
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [editing, setEditing] = useState<VolunteerActivity | "new" | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [activityData, teamData] = await Promise.all([
        api<VolunteerActivity[]>("/activities?includeHidden=true"),
        api<MinistryTeam[]>("/teams?includeHidden=true"),
      ]);
      setActivities(activityData);
      setTeams(teamData);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "봉사활동을 불러오지 못했습니다.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const remove = async (activity: VolunteerActivity) => {
    if (!window.confirm(`‘${activity.title}’ 봉사활동을 삭제할까요?`)) return;
    try {
      await api(`/activities/${activity.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "봉사활동을 삭제하지 못했습니다.");
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md border bg-white p-4">
        <div>
          <h3 className="font-bold">봉사활동 {activities.length}개</h3>
          <p className="mt-1 text-xs text-gray-500">목록에 노출할 활동과 신청 가능 여부를 관리합니다.</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={!teams.length}
          className="flex h-10 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          <Plus size={17} />
          활동 등록
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="divide-y">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_180px_150px_auto] lg:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{activity.title}</h4>
                  <span className={activity.isVisible ? "text-brand-700" : "text-gray-400"}>
                    {activity.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {activity.team?.name} · {activity.schedule}
                </p>
              </div>
              <span className="text-xs text-gray-600">
                {activity.availableDates.length ? `${activity.availableDates.length}개 일정` : "상시 활동"}
              </span>
              <span
                className={`text-xs font-bold ${activity.isAcceptingApplications ? "text-emerald-700" : "text-red-600"}`}
              >
                {activity.isAcceptingApplications ? "신청 가능" : "마감"}
              </span>
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditing(activity)}
                  className="grid h-9 w-9 place-items-center text-gray-500"
                  aria-label={`${activity.title} 수정`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => void remove(activity)}
                  className="grid h-9 w-9 place-items-center text-red-500"
                  aria-label={`${activity.title} 삭제`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {editing && (
        <ActivityForm
          activity={editing === "new" ? undefined : editing}
          teams={teams}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
