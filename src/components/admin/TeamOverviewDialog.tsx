import { Eye, EyeOff, Pencil, Plus, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AdminTeamOverview, GalleryPost, MinistryTeam } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { FormError, inputClass } from "../common/FormControls";
import { GalleryForm } from "../ministries/GalleryForm";

export function TeamOverviewDialog({
  team,
  teams,
  onClose,
}: {
  team: MinistryTeam;
  teams: MinistryTeam[];
  onClose: () => void;
}) {
  const [overview, setOverview] = useState<AdminTeamOverview | null>(null);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingPost, setEditingPost] = useState<GalleryPost | "new" | null>(null);
  const [error, setError] = useState("");
  const [savingMember, setSavingMember] = useState(false);
  const leaderCount = overview?.memberships.filter((member) => member.membershipRole === "LEADER").length ?? 0;
  const deputyCount = overview?.memberships.filter((member) => member.membershipRole === "DEPUTY_LEADER").length ?? 0;
  const positionFull = (user: AdminTeamOverview["eligibleUsers"][number]) =>
    user.role === "AUTHORIZED_UPLOADER" &&
    (user.teamPosition === "DEPUTY_LEADER" ? deputyCount >= 1 : leaderCount >= 1);
  const selectedLeaderAtCapacity = overview?.eligibleUsers.some(
    (user) => user.id === selectedUserId && positionFull(user),
  );

  const load = useCallback(async () => {
    try {
      const [overviewData, postData] = await Promise.all([
        api<AdminTeamOverview>(`/admin/teams/${team.id}/overview`),
        api<GalleryPost[]>(`/gallery?includeHidden=true&teamId=${team.id}`),
      ]);
      setOverview(overviewData);
      setPosts(postData);
      setSelectedUserId((current) =>
        overviewData.eligibleUsers.some((user) => user.id === current)
          ? current
          : (overviewData.eligibleUsers[0]?.id ?? ""),
      );
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사역팀 관리 정보를 불러오지 못했습니다.");
    }
  }, [team.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const addMember = async () => {
    if (!selectedUserId) return;
    setSavingMember(true);
    try {
      await api(`/admin/teams/${team.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedUserId }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원을 팀에 추가하지 못했습니다.");
    } finally {
      setSavingMember(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!window.confirm("이 회원의 팀 소속을 해제할까요? 기존 이력은 보존됩니다.")) return;
    setSavingMember(true);
    try {
      await api(`/admin/teams/${team.id}/members/${userId}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "팀 소속을 해제하지 못했습니다.");
    } finally {
      setSavingMember(false);
    }
  };

  const changeMemberRole = async (userId: string, membershipRole: string) => {
    setSavingMember(true);
    try {
      await api(`/admin/teams/${team.id}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ membershipRole }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "팀장 지정을 변경하지 못했습니다.");
    } finally {
      setSavingMember(false);
    }
  };

  const removePost = async (post: GalleryPost) => {
    if (!window.confirm(`‘${post.title}’ 게시물을 삭제할까요?`)) return;
    try {
      await api(`/gallery/${post.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "게시물을 삭제하지 못했습니다.");
    }
  };

  if (editingPost) {
    return (
      <GalleryForm
        post={editingPost === "new" ? undefined : editingPost}
        teams={teams}
        onClose={() => setEditingPost(null)}
        onSaved={() => void load()}
      />
    );
  }

  return (
    <Dialog title={`${team.name} · 회원 및 게시물 관리`} onClose={onClose} size="lg">
      <div className="space-y-7 p-5 md:p-6">
        <FormError message={error} />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-bold">소속 회원·팀장</h3>
              <p className="mt-1 text-xs text-gray-500">
                팀장 {leaderCount}/1명 · 부팀장 {deputyCount}/1명
              </p>
              <p className="mt-1 text-xs text-gray-500">
                팀장과 부팀장은 동일한 권한으로 담당 팀의 콘텐츠 관리와 봉사 신청 승인을 담당합니다.
              </p>
            </div>
            <div className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
              <select
                className={inputClass}
                value={selectedUserId}
                disabled={savingMember}
                onChange={(event) => setSelectedUserId(event.target.value)}
                aria-label="팀에 추가할 회원"
              >
                <option value="">추가 가능한 회원 선택</option>
                {overview?.eligibleUsers.map((user) => (
                  <option key={user.id} value={user.id} disabled={positionFull(user)}>
                    {user.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void addMember()}
                disabled={!selectedUserId || savingMember || selectedLeaderAtCapacity}
                className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand-400 px-3 text-sm font-bold text-darkness disabled:opacity-40 hover:bg-brand-500"
              >
                <UserPlus size={16} />
                추가
              </button>
            </div>
          </div>
          {leaderCount >= 1 && deputyCount >= 1 && (
            <p className="mt-3 text-xs text-amber-800">
              팀장과 부팀장이 모두 지정되어 있습니다. 기존 담당자를 일반 팀원으로 변경하면 새 담당자를 지정할 수
              있습니다.
            </p>
          )}
          <div className="mt-4 divide-y rounded-md border">
            {overview?.memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-bold">{membership.user.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    가입 {new Date(membership.joinedAt).toLocaleDateString("ko-KR")} ·{" "}
                    {membership.membershipRole === "LEADER"
                      ? "팀장"
                      : membership.membershipRole === "DEPUTY_LEADER"
                        ? "부팀장"
                        : "일반 팀원"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {membership.user.role !== "ADMIN" && (
                    <select
                      className={inputClass}
                      value={membership.membershipRole}
                      disabled={savingMember}
                      onChange={(event) => void changeMemberRole(membership.userId, event.target.value)}
                      aria-label={`${membership.user.name} 팀 내 역할`}
                    >
                      <option value="MEMBER">일반 팀원</option>
                      <option value="LEADER" disabled={leaderCount >= 1 && membership.membershipRole !== "LEADER"}>
                        팀장
                      </option>
                      <option
                        value="DEPUTY_LEADER"
                        disabled={deputyCount >= 1 && membership.membershipRole !== "DEPUTY_LEADER"}
                      >
                        부팀장
                      </option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeMember(membership.userId)}
                    disabled={savingMember}
                    className="grid h-9 w-9 place-items-center text-red-500"
                    aria-label={`${membership.user.name} 팀 소속 해제`}
                  >
                    <UserMinus size={17} />
                  </button>
                </div>
              </div>
            ))}
            {overview && !overview.memberships.length && (
              <p className="p-6 text-center text-sm text-gray-500">현재 소속 회원이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="border-t pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">현장 게시물</h3>
              <p className="mt-1 text-xs text-gray-500">이 팀의 공개·비공개 게시물을 관리합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingPost("new")}
              className="flex h-10 items-center gap-2 rounded-md bg-brand-400 px-3 text-sm font-bold text-darkness hover:bg-brand-500"
            >
              <Plus size={16} />
              게시물 등록
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-md border">
                <img src={post.thumbnailUrl} alt="" className="h-32 w-full object-cover" />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{post.title}</p>
                      <p
                        className={`mt-1 flex items-center gap-1 text-xs ${post.isVisible ? "text-brand-800" : "text-gray-400"}`}
                      >
                        {post.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        {post.isVisible ? "공개" : "비공개"}
                      </p>
                    </div>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => setEditingPost(post)}
                        className="grid h-9 w-9 place-items-center text-gray-500"
                        aria-label={`${post.title} 수정`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removePost(post)}
                        className="grid h-9 w-9 place-items-center text-red-500"
                        aria-label={`${post.title} 삭제`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!posts.length && (
              <p className="rounded-md border p-6 text-center text-sm text-gray-500 sm:col-span-2">
                등록된 현장 게시물이 없습니다.
              </p>
            )}
          </div>
        </section>
      </div>
    </Dialog>
  );
}
