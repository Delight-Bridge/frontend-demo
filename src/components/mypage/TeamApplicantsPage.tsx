import { Check, ClipboardList, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { MinistryTeam, PageResult, VolunteerApplication } from "../../types/platform";
import { Pagination } from "../common/Pagination";

const pageSize = 20;
const statusLabels: Record<VolunteerApplication["status"], string> = {
  SUBMITTED: "신청 완료",
  ADMIN_CONFIRMED: "관리자 확인",
  HANDED_TO_LEADER: "팀장 전달",
  REJECTED: "신청 반려",
  CANCELLED: "신청 취소",
  COMPLETED: "참여 완료",
};

type MyProfile = { team: Pick<MinistryTeam, "id" | "name" | "kakaoInviteUrl"> | null };

export function TeamApplicantsPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<MyProfile["team"]>(null);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "AUTHORIZED_UPLOADER") return;
    Promise.all([
      api<MyProfile>("/me"),
      api<PageResult<VolunteerApplication>>(`/uploader/applications?page=${page}&pageSize=${pageSize}`),
    ])
      .then(([profile, result]) => {
        setTeam(profile.team);
        setApplications(result.items);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        setError("");
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "담당 신청자를 불러오지 못했습니다."));
  }, [user, page]);

  const copyInviteLink = async () => {
    const inviteLink = team?.kakaoInviteUrl;
    if (!inviteLink) {
      setError("담당 팀의 카카오톡 단체방 초대 링크가 등록되지 않았습니다.");
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("초대 링크를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  };

  if (user?.role !== "AUTHORIZED_UPLOADER") return <Navigate to="/mypage/profile" replace />;

  return (
    <div className="rounded-lg border bg-white p-5 md:p-7">
      <p className="text-xs font-bold tracking-widest text-brand-700">TEAM APPLICANTS</p>
      <h2 className="mt-2 text-2xl font-bold text-gray-950">{team?.name ?? "담당 팀"} 신청자 관리</h2>
      <p className="mt-2 text-sm text-gray-500">관리자가 담당 팀으로 전달한 신청자와 참여 정보를 확인할 수 있습니다.</p>
      {error && (
        <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-6" aria-label="담당 신청자 목록">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-600">
              <tr>
                <th className="w-20 px-4 py-3 text-center">No.</th>
                <th className="px-4 py-3">신청자 이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">참여유형</th>
                <th className="px-4 py-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((application, index) => (
                <tr key={application.id} className="text-gray-700 hover:bg-gray-50/70">
                  <td className="px-4 py-4 text-center text-gray-500">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-4 font-bold text-gray-950">{application.applicantName}</td>
                  <td className="px-4 py-4">
                    <a href={`tel:${application.phone}`} className="hover:text-brand-700">
                      {application.phone}
                    </a>
                  </td>
                  <td className="px-4 py-4">{application.participationType === "ONCE" ? "1회 참여" : "지속 참여"}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex h-7 items-center justify-center rounded-full bg-violet-50 px-3 text-xs font-bold leading-none text-violet-700">
                      {statusLabels[application.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {!applications.length && (
                <tr>
                  <td colSpan={5} className="h-56 text-center text-sm text-gray-500">
                    <ClipboardList className="mx-auto mb-3 text-gray-300" />
                    전달받은 신청자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      <div className="mt-6 flex justify-end border-t pt-5">
        <button
          type="button"
          onClick={() => void copyInviteLink()}
          disabled={!team?.kakaoInviteUrl}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#FEE500] px-5 text-sm font-bold text-[#191919] hover:bg-[#f5dc00] disabled:opacity-40"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? "초대 링크가 복사되었습니다" : "카카오톡 단체방 초대 링크 복사하기"}
        </button>
      </div>
    </div>
  );
}
