import { ArrowRight, CalendarDays, Clock3, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { HomeActivityPreview, VolunteerActivity, VolunteerApplication } from "../../types/platform";
import { ParticipationDialog } from "./ParticipationDialog";

function formatDate(date: string, withWeekday = false) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withWeekday ? { weekday: "short" as const } : {}),
  }).format(new Date(date.includes("T") ? date : `${date}T00:00:00+09:00`));
}

export function ActionSection() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<HomeActivityPreview>({ activities: [], recentTeams: [] });
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [selected, setSelected] = useState<VolunteerActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setApplications(await api<VolunteerApplication[]>("/applications/mine"));
  }, []);

  useEffect(() => {
    api<HomeActivityPreview>("/activities/home-preview")
      .then(setPreview)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "봉사활동을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadApplications().catch((caught) =>
      setError(caught instanceof Error ? caught.message : "신청 내역을 불러오지 못했습니다."),
    );
  }, [loadApplications, user]);

  const showingRecentTeams = !loading && !error && preview.activities.length === 0 && preview.recentTeams.length > 0;

  return (
    <section id="action" className="scroll-mt-16 bg-brand-900 px-4 py-20 text-white md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="mb-4 inline-block rounded-full bg-brand-800 px-3 py-1 text-xs font-bold tracking-widest text-brand-100">
            ACTION
          </span>
          <h2 className="text-3xl font-bold md:text-4xl">당신의 차례입니다</h2>
          <p className="mx-auto mt-4 max-w-2xl font-light leading-7 text-brand-100">
            {showingRecentTeams
              ? "새로운 모집을 기다리는 동안 최근 현장을 만나보세요."
              : "받은 은혜를 흘려보낼 곳을 선택해 주세요."}
          </p>
        </div>

        {error && <p className="mt-8 rounded-md bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}
        {!loading && !error && preview.activities.length === 0 && preview.recentTeams.length === 0 && (
          <p className="mt-10 rounded-lg border border-brand-700 bg-brand-800/60 p-6 text-center text-brand-100">
            현재 신청 가능한 봉사활동과 최근 3개월의 활동 기록이 없습니다.
          </p>
        )}

        <div className="mt-10 space-y-3">
          {preview.activities.map((activity) => (
            <article
              key={activity.id}
              className="grid gap-4 rounded-lg border border-brand-700 bg-brand-800/60 p-5 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="text-xs font-bold text-brand-300">{activity.team?.name}</p>
                <h3 className="mt-1 text-lg font-bold">{activity.title}</h3>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-brand-100">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {activity.nextAvailableDate ? `${formatDate(activity.nextAvailableDate, true)}` : activity.schedule}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {activity.capacity}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(activity)}
                className="flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-brand-900"
              >
                상세보기 및 신청
                <ArrowRight size={16} />
              </button>
            </article>
          ))}

          {showingRecentTeams &&
            preview.recentTeams.map(({ team, latestActivity }) => (
              <article
                key={team.id}
                className="grid overflow-hidden rounded-lg border border-brand-700 bg-brand-800/60 sm:grid-cols-[160px_1fr] md:grid-cols-[190px_1fr_auto] md:items-center"
              >
                <img src={latestActivity.thumbnailUrl} alt="" className="h-40 w-full object-cover sm:h-full" />
                <div className="p-5">
                  <p className="text-xs font-bold text-brand-300">최근 활동 봉사팀</p>
                  <h3 className="mt-1 text-lg font-bold">{team.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-100">{team.shortDescription}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-brand-200">
                    <Clock3 size={14} />
                    {latestActivity.title} · {formatDate(latestActivity.createdAt)}
                  </p>
                </div>
                <a
                  href="/#ministries"
                  className="mx-5 mb-5 flex h-11 items-center justify-center gap-2 rounded-md border border-brand-300 px-5 text-sm font-bold md:mx-5 md:mb-0"
                >
                  활동 현장 보기
                  <ArrowRight size={16} />
                </a>
              </article>
            ))}
        </div>

        <a
          href="/volunteer"
          className="mx-auto mt-8 flex h-12 w-fit items-center justify-center gap-2 rounded-md border border-brand-400 px-6 font-bold text-white hover:bg-brand-800"
        >
          전체 봉사활동 보기
          <ArrowRight size={18} />
        </a>
      </div>
      {selected && (
        <ParticipationDialog
          activity={selected}
          applications={applications}
          onClose={() => setSelected(null)}
          onSaved={loadApplications}
          loginReturnUrl="/#action"
        />
      )}
    </section>
  );
}
