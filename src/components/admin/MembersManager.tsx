import { Search, UserRoundCheck, UserRoundX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AdminMember, PageResult, Role, User } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { inputClass } from "../common/FormControls";
import { Pagination } from "../common/Pagination";

const roleLabel: Record<Role, string> = { ADMIN: "관리자", AUTHORIZED_UPLOADER: "콘텐츠 업로더", USER: "일반 회원" };

export function MembersManager() {
  const [users, setUsers] = useState<AdminMember[]>([]);
  const [selected, setSelected] = useState<AdminMember | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", "20");
    try {
      setLoading(true);
      const result = await api<PageResult<AdminMember>>(`/admin/users?${params}`);
      setUsers(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [query, role, status, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateUser = async (id: string, update: Partial<Pick<User, "role" | "status">>) => {
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(update) });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원 정보를 변경하지 못했습니다.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-[180px_160px_1fr]">
        <select
            className={inputClass}
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            aria-label="회원 역할 필터"
        >
          <option value="">모든 역할</option>
          <option value="ADMIN">관리자</option>
          <option value="AUTHORIZED_UPLOADER">콘텐츠 업로더</option>
          <option value="USER">일반 회원</option>
        </select>
        <select
            className={inputClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="회원 상태 필터"
        >
          <option value="">모든 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="SUSPENDED">정지</option>
        </select>
        <label className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
          <input
              className={`${inputClass} pl-10`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="이름, 연락처 또는 소속 팀 검색"
          />
        </label>
      </div>
      {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
      )}
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="border-b px-5 py-4">
          <h3 className="font-bold">회원 {totalItems}명</h3>
          <p className="mt-1 text-xs text-gray-500">권한과 서비스 이용 상태를 관리합니다.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-bold text-gray-600">
              <tr>
                <th className="px-5 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">소속 팀</th>
                <th className="w-52 px-4 py-3">역할</th>
                <th className="w-36 px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((member) => (
                <tr
                  key={member.id}
                  tabIndex={0}
                  onClick={() => setSelected(member)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(member);
                    }
                  }}
                  className="cursor-pointer text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  aria-label={`${member.name} 회원 상세 보기`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${member.status === "ACTIVE" ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-400"}`}
                      >
                        {member.status === "ACTIVE" ? <UserRoundCheck size={19} /> : <UserRoundX size={19} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-950">{member.name || member.nickname}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {member.socialProvider || "소셜 미연결"} · 가입{" "}
                          {new Date(member.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{member.phone || "미입력"}</td>
                  <td className="px-4 py-4">{member.team?.name ?? "소속 없음"}</td>
                  <td className="px-4 py-4">
                    <select
                      className={inputClass}
                      value={member.role}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => void updateUser(member.id, { role: event.target.value as Role })}
                      aria-label={`${member.name || member.nickname} 역할`}
                    >
                      <option value="USER">일반 회원</option>
                      <option value="AUTHORIZED_UPLOADER">콘텐츠 업로더</option>
                      <option value="ADMIN">관리자</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className={inputClass}
                      value={member.status}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => void updateUser(member.id, { status: event.target.value as User["status"] })}
                      aria-label={`${member.name || member.nickname} 상태`}
                    >
                      <option value="ACTIVE">활성</option>
                      <option value="SUSPENDED">정지</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <p role="status" className="py-16 text-center text-sm text-gray-500">
              회원을 불러오는 중입니다.
            </p>
          )}
          {!loading && !users.length && (
            <p className="py-16 text-center text-sm text-gray-500">조건에 맞는 회원이 없습니다.</p>
          )}
        </div>
      </section>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      {selected && (
        <Dialog title="회원 상세" onClose={() => setSelected(null)} size="sm">
          <dl className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-4 p-5 text-sm">
            <dt className="font-bold text-gray-500">이름</dt>
            <dd className="font-bold text-gray-950">{selected.name || selected.nickname}</dd>
            <dt className="font-bold text-gray-500">연락처</dt>
            <dd>{selected.phone || "미입력"}</dd>
            <dt className="font-bold text-gray-500">소속 팀</dt>
            <dd>{selected.team?.name ?? "소속 없음"}</dd>
            <dt className="font-bold text-gray-500">역할</dt>
            <dd>{roleLabel[selected.role]}</dd>
            <dt className="font-bold text-gray-500">상태</dt>
            <dd>{selected.status === "ACTIVE" ? "활성" : "정지"}</dd>
            <dt className="font-bold text-gray-500">로그인 연동</dt>
            <dd>{selected.socialProvider || "소셜 미연결"}</dd>
            <dt className="font-bold text-gray-500">가입일</dt>
            <dd>{new Date(selected.createdAt).toLocaleDateString("ko-KR")}</dd>
          </dl>
        </Dialog>
      )}
    </div>
  );
}
