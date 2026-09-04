import { Activity, Download, Newspaper, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AdminStats, VolunteerApplication } from "../../types/platform";

const statusLabel = {
  SUBMITTED: "접수",
  ADMIN_CONFIRMED: "관리자 확정",
  HANDED_TO_LEADER: "팀장 전달",
  REJECTED: "참여 불가",
  CANCELLED: "취소",
  COMPLETED: "참여 완료",
};

export function AdminDashboard({ onNavigate }: { onNavigate: (tab: "members" | "applications" | "news") => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<VolunteerApplication[]>([]);
  const [error, setError] = useState("");
  const [reportMonth, setReportMonth] = useState(() =>
    new Date().toLocaleDateString("en-CA", { year: "numeric", month: "2-digit" }).slice(0, 7),
  );

  useEffect(() => {
    Promise.all([api<AdminStats>("/admin/stats"), api<VolunteerApplication[]>("/admin/applications")])
      .then(([statsData, applicationData]) => {
        setStats(statsData);
        setRecent(applicationData.slice(0, 5));
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "통계를 불러오지 못했습니다."));
  }, []);

  const metrics = [
    {
      label: "전체 회원",
      value: stats?.totalUsers ?? 0,
      hint: `활성 ${stats?.activeUsers ?? 0}명`,
      icon: Users,
      tab: "members" as const,
    },
    {
      label: "봉사 신청",
      value: stats?.totalApplications ?? 0,
      hint: `처리 대기 ${stats?.pendingApplications ?? 0}건`,
      icon: UserCheck,
      tab: "applications" as const,
    },
    {
      label: "뉴스 콘텐츠",
      value: stats?.totalNews ?? 0,
      hint: `공개 ${stats?.visibleNews ?? 0}건`,
      icon: Newspaper,
      tab: "news" as const,
    },
  ];
  const downloadReport = () => {
    const content = [
      `Delight Bridge ${reportMonth} 샘플 운영 보고서`,
      "",
      `전체 회원: ${stats?.totalUsers ?? 0}명`,
      `봉사 신청: ${stats?.totalApplications ?? 0}건`,
      `공개 뉴스: ${stats?.visibleNews ?? 0}건`,
      "",
      "프론트 데모에서 생성한 샘플 파일이며 실제 운영 데이터가 아닙니다.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `delight-bridge-demo-${reportMonth}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-gray-500">오늘의 운영 현황을 확인하고 필요한 업무를 이어서 처리하세요.</p>
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
      <section className="rounded-md border bg-white p-5">
        <h3 className="font-bold">월별 운영 보고서</h3>
        <p className="mt-1 text-xs text-gray-500">
          프론트 데모용 샘플 집계 파일입니다. 실제 개인정보나 운영 데이터는 포함하지 않습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm font-bold">
            <span className="sr-only">보고서 기준 월</span>
            <input
              type="month"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 font-normal"
              aria-label="보고서 기준 월"
            />
          </label>
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white"
            aria-label={`${reportMonth} 샘플 운영 보고서 다운로드`}
          >
            <Download size={17} />
            샘플 보고서 다운로드
          </button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map(({ label, value, hint, icon: Icon, tab }) => (
          <button
            key={label}
            onClick={() => onNavigate(tab)}
            className="flex min-h-32 items-start justify-between rounded-md border bg-white p-5 text-left hover:border-gray-400"
          >
            <span>
              <span className="block text-sm font-medium text-gray-500">{label}</span>
              <strong className="mt-3 block text-3xl text-gray-950">{value}</strong>
              <span className="mt-2 block text-xs text-gray-500">{hint}</span>
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">
              <Icon size={20} />
            </span>
          </button>
        ))}
      </div>
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-bold">최근 봉사 신청</h3>
            <p className="mt-1 text-xs text-gray-500">최근 접수 순서로 최대 5건을 표시합니다.</p>
          </div>
          <button onClick={() => onNavigate("applications")} className="text-sm font-bold text-brand-700">
            전체 보기
          </button>
        </div>
        {recent.length ? (
          <div className="divide-y">
            {recent.map((application) => (
              <div key={application.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-bold">{application.applicantName}</p>
                  <p className="text-xs text-gray-500">
                    {application.age ? `${application.age}세 · ` : ""}
                    {application.phone || application.contact}
                  </p>
                </div>
                <div>
                  <p className="text-sm">{application.team?.name ?? "삭제된 사역팀"}</p>
                  <p className="text-xs text-gray-500">{new Date(application.appliedAt).toLocaleDateString("ko-KR")}</p>
                </div>
                <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                  {statusLabel[application.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-36 place-items-center text-sm text-gray-500">
            <Activity size={22} className="mb-2" />
            접수된 신청이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
