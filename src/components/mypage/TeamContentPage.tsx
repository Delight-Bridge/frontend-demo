import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { GalleryPost, MinistryTeam } from "../../types/platform";
import { TeamForm } from "../admin/TeamForm";
import { GalleryForm } from "../ministries/GalleryForm";

type MyProfile = { team: Pick<MinistryTeam, "id" | "name"> | null };

export function TeamContentPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<MinistryTeam | null>(null);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [editingTeam, setEditingTeam] = useState(false);
  const [editingPost, setEditingPost] = useState<GalleryPost | "new" | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (user?.role !== "AUTHORIZED_UPLOADER") return;
    try {
      const [profile, teams] = await Promise.all([
        api<MyProfile>("/me"),
        api<MinistryTeam[]>("/teams?includeHidden=true"),
      ]);
      const assignedTeam = teams.find((item) => item.id === profile.team?.id) ?? null;
      setTeam(assignedTeam);
      setPosts(assignedTeam ? await api<GalleryPost[]>(`/gallery?includeHidden=true&teamId=${assignedTeam.id}`) : []);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "담당 팀 정보를 불러오지 못했습니다.");
    }
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);
  const removePost = async (post: GalleryPost) => {
    if (!window.confirm(`‘${post.title}’ 게시물을 삭제할까요?`)) return;
    try {
      await api(`/gallery/${post.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "게시물을 삭제하지 못했습니다.");
    }
  };
  if (user?.role !== "AUTHORIZED_UPLOADER") return <Navigate to="/mypage/profile" replace />;
  return (
    <div className="rounded-lg border bg-white p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-700">TEAM CONTENT</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-950">팀 소개/게시물 업로드</h2>
          <p className="mt-2 text-sm text-gray-500">담당 팀 소개를 수정하고 사역 현장 게시물을 관리하세요.</p>
        </div>
        {team && (
          <button
            type="button"
            onClick={() => setEditingTeam(true)}
            className="flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={16} />팀 소개 수정
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {team && (
        <section className="mt-6 rounded-lg bg-gray-50 p-5">
          <p className="text-xs font-bold text-brand-700">담당 팀</p>
          <h3 className="mt-1 text-lg font-bold text-gray-950">{team.name}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{team.shortDescription}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold text-gray-800">주요 활동</dt>
              <dd className="mt-1 text-gray-600">{team.activities}</dd>
            </div>
            <div>
              <dt className="font-bold text-gray-800">활동 일정</dt>
              <dd className="mt-1 text-gray-600">{team.schedule}</dd>
            </div>
          </dl>
        </section>
      )}
      <section className="mt-8 border-t pt-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-950">게시물</h3>
            <p className="mt-1 text-xs text-gray-500">공개 및 비공개 게시물을 모두 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingPost("new")}
            disabled={!team}
            className="flex h-10 items-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            <Plus size={16} />
            게시물 업로드
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-lg border">
              <img src={post.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-gray-950">{post.title}</h4>
                    <p
                      className={`mt-1 flex items-center gap-1 text-xs ${post.isVisible ? "text-brand-700" : "text-gray-400"}`}
                    >
                      {post.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      {post.isVisible ? "공개" : "비공개"}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingPost(post)}
                      className="grid h-9 w-9 place-items-center text-gray-500 hover:bg-gray-100"
                      aria-label={`${post.title} 수정`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePost(post)}
                      className="grid h-9 w-9 place-items-center text-red-500 hover:bg-red-50"
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
            <p className="rounded-lg border p-8 text-center text-sm text-gray-500 sm:col-span-2">
              등록된 게시물이 없습니다.
            </p>
          )}
        </div>
      </section>
      {editingTeam && team && (
        <TeamForm team={team} onClose={() => setEditingTeam(false)} onSaved={() => void load()} />
      )}
      {editingPost && team && (
        <GalleryForm
          post={editingPost === "new" ? undefined : editingPost}
          teams={[team]}
          onClose={() => setEditingPost(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
