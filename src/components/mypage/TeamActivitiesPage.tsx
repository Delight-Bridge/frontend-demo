import { CalendarDays, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { MinistryTeam, VolunteerActivity } from "../../types/platform";
import { ActivityForm } from "../admin/ActivityForm";

type MyProfile = { team: Pick<MinistryTeam, "id" | "name"> | null };

export function TeamActivitiesPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<MinistryTeam | null>(null);
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [editing, setEditing] = useState<VolunteerActivity | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (user?.role !== "AUTHORIZED_UPLOADER") return;
    try {
      setLoading(true);
      const [profile, teams] = await Promise.all([
        api<MyProfile>("/me"),
        api<MinistryTeam[]>("/teams?includeHidden=true"),
      ]);
      const assignedTeam = teams.find((item) => item.id === profile.team?.id) ?? null;
      setTeam(assignedTeam);
      setActivities(
        assignedTeam ? await api<VolunteerActivity[]>(`/activities?includeHidden=true&teamId=${assignedTeam.id}`) : [],
      );
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "담당 팀 봉사활동을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  if (user?.role !== "AUTHORIZED_UPLOADER") return <Navigate to="/mypage/profile" replace />;

  return (
    <div className="rounded-lg border bg-white p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-700">TEAM VOLUNTEER ACTIVITIES</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-950">{team?.name ?? "담당 팀"} 봉사활동 관리</h2>
          <p className="mt-2 text-sm text-gray-500">담당 팀의 봉사활동 정보와 신청 가능 여부를 관리하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={!team}
          className="flex h-10 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          <Plus size={17} />
          활동 등록
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && (
        <p role="status" className="py-16 text-center text-sm text-gray-500">
          봉사활동을 불러오는 중입니다.
        </p>
      )}

      {!loading && (
        <section className="mt-6 overflow-hidden rounded-lg border" aria-label="담당 팀 봉사활동 목록">
          <div className="divide-y">
            {activities.map((activity) => (
              <article key={activity.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_130px_110px_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-950">{activity.title}</h3>
                    <span
                      className={activity.isVisible ? "text-brand-700" : "text-gray-400"}
                      aria-label={activity.isVisible ? "공개" : "비공개"}
                    >
                      {activity.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{activity.schedule}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{activity.description}</p>
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
                    type="button"
                    onClick={() => setEditing(activity)}
                    className="grid h-9 w-9 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
                    aria-label={`${activity.title} 수정`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(activity)}
                    className="grid h-9 w-9 place-items-center rounded-md text-red-500 hover:bg-red-50"
                    aria-label={`${activity.title} 삭제`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
            {!activities.length && (
              <div className="grid min-h-56 place-items-center text-center text-sm text-gray-500">
                <div>
                  <CalendarDays className="mx-auto mb-3 text-gray-300" />
                  등록된 봉사활동이 없습니다.
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {editing && team && (
        <ActivityForm
          activity={editing === "new" ? undefined : editing}
          teams={[team]}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
