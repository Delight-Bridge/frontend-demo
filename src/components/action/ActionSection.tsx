import { ArrowRight, CalendarDays, ChevronDown, Clock3, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { HomeActivityPreview, VolunteerActivity, VolunteerApplication } from "../../types/platform";
import { ParticipationDialog } from "./ParticipationDialog";
import { SectionHeading } from "../SectionHeading";

function formatDate(date: string, withWeekday = false) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withWeekday ? { weekday: "short" as const } : {}),
  }).format(new Date(date.includes("T") ? date : `${date}T00:00:00+09:00`));
}

function getSeoulDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function getNextAvailableDate(activity: VolunteerActivity, today: string) {
  return [...activity.availableDates].filter((date) => date >= today).sort()[0] ?? "";
}

export function ActionSection() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<HomeActivityPreview>({ activities: [], recentTeams: [] });
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [selected, setSelected] = useState<VolunteerActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

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
  const today = getSeoulDateKey();
  const currentMonthKey = today.slice(0, 7);
  const currentMonth = Number(today.slice(5, 7));
  const sortedActivities = [...preview.activities].sort((first, second) => {
    const firstDate = getNextAvailableDate(first, today) || "9999-12-31";
    const secondDate = getNextAvailableDate(second, today) || "9999-12-31";
    return firstDate.localeCompare(secondDate) || first.displayOrder - second.displayOrder;
  });
  const currentMonthActivityCount = sortedActivities.filter(
    (activity) =>
      activity.isAcceptingApplications &&
      activity.availableDates.some((date) => date >= today && date.startsWith(currentMonthKey)),
  ).length;
  const displayedActivities = showAllActivities ? sortedActivities : sortedActivities.slice(0, 3);

  return (
    <section id="action" className="scroll-mt-16 bg-brand-50 px-4 py-20 text-gray-900 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="mb-4 inline-block rounded-full border border-gray-200 bg-brand-100 px-3 py-1 text-xs font-bold tracking-widest text-brand-800">
            ACTION
          </span>
          <SectionHeading
            title="당신의 차례입니다"
            description="받은 은혜를 흘려보낼 곳을 선택해 주세요."
            href="/volunteer"
            align="center"
            titleClassName="font-serif"
          />
          {!loading && !error && (
            <p className="mt-6 flex justify-end text-sm font-bold text-brand-800">
              {currentMonth}월 신청 가능한 봉사는 총 {currentMonthActivityCount}개입니다.
            </p>
          )}
        </div>

        {error && <p className="mt-8 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && preview.activities.length === 0 && preview.recentTeams.length === 0 && (
          <p className="mt-10 rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
            현재 신청 가능한 봉사활동과 최근 3개월의 활동 기록이 없습니다.
          </p>
        )}

        <div id="all-volunteer-activities" className="mt-3 space-y-3">
          {displayedActivities.map((activity) => {
            const nextAvailableDate = getNextAvailableDate(activity, today);
            return (
              <article
                key={activity.id}
                className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-xs font-bold text-brand-800">{activity.team?.name}</p>
                  <h3 className="mt-1 text-lg font-bold">{activity.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {nextAvailableDate ? formatDate(nextAvailableDate, true) : activity.schedule}
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
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-400 px-5 text-sm font-bold text-darkness hover:bg-brand-500"
                >
                  상세보기 및 신청
                  <ArrowRight size={16} />
                </button>
              </article>
            );
          })}

          {showingRecentTeams &&
            preview.recentTeams.map(({ team, latestActivity }) => (
              <article
                key={team.id}
                className="grid overflow-hidden rounded-lg border border-gray-200 bg-white sm:grid-cols-[160px_1fr] md:grid-cols-[190px_1fr_auto] md:items-center"
              >
                <img src={latestActivity.thumbnailUrl} alt="" className="h-40 w-full object-cover sm:h-full" />
                <div className="p-5">
                  <p className="text-xs font-bold text-brand-800">최근 활동 봉사팀</p>
                  <h3 className="mt-1 text-lg font-bold">{team.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{team.shortDescription}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock3 size={14} />
                    {latestActivity.title} · {formatDate(latestActivity.createdAt)}
                  </p>
                </div>
                <a
                  href="/#ministries"
                  className="mx-5 mb-5 flex h-10 items-center justify-center gap-2 rounded-md border border-brand-400 text-brand-800 hover:bg-brand-100 px-5 text-sm font-bold md:mx-5 md:mb-0"
                >
                  활동 현장 보기
                  <ArrowRight size={16} />
                </a>
              </article>
            ))}
        </div>

        {sortedActivities.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllActivities((current) => !current)}
            className="mx-auto mt-8 flex h-10 items-center justify-center gap-2 rounded-md border border-brand-400 bg-white px-6 text-sm font-bold text-brand-800 hover:bg-brand-100"
            aria-expanded={showAllActivities}
            aria-controls="all-volunteer-activities"
          >
            {showAllActivities ? "봉사활동 접기" : "전체 봉사활동 보기"}
            <ChevronDown
              size={18}
              className={`transition-transform ${showAllActivities ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
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
