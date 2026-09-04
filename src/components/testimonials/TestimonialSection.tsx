import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { TestimonyPost } from "../../types/platform";
import { SectionHeading } from "../SectionHeading";
import { TestimonialCard } from "./TestimonialCard";
import { TestimonyForm } from "./TestimonyForm";
import { Pagination } from "../common/Pagination";

export function TestimonialSection() {
  const { user, openLogin } = useAuth();
  const [posts, setPosts] = useState<TestimonyPost[]>([]);
  const [editing, setEditing] = useState<TestimonyPost | "new" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPosts(await api<TestimonyPost[]>("/testimonies"));
      setPage(1);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "간증을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);
  const write = () => (user ? (window.location.href = "/testimony/new") : openLogin("/testimony/new"));
  const openPost = (postId: string) => {
    window.location.href = `/testimony/${postId}`;
  };
  const like = async (post: TestimonyPost) => {
    if (!user) return openLogin();
    try {
      const result = await api<{ liked: boolean; likeCount: number }>(`/testimonies/${post.id}/like`, {
        method: "POST",
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, likedByMe: result.liked, likeCount: result.likeCount } : item,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "좋아요를 처리하지 못했습니다.");
    }
  };
  const remove = async (post: TestimonyPost) => {
    if (!window.confirm(`‘${post.title}’ 간증을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    try {
      await api(`/testimonies/${post.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    }
  };
  return (
    <section id="testimonies" className="scroll-mt-16 bg-gray-50 px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <SectionHeading title="회복 간증" description="나눔을 통해 경험한 은혜의 이야기" align="left" />
          <button
            onClick={write}
            className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand-600 px-3 text-sm font-bold text-white"
          >
            <Plus size={17} />
            간증 쓰기
          </button>
        </div>
        {error && <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && (
          <p role="status" className="py-16 text-center text-sm text-gray-500">
            간증을 불러오는 중입니다.
          </p>
        )}
        {!loading && !posts.length && (
          <p className="py-16 text-center text-sm text-gray-500">등록된 간증이 없습니다.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {posts.slice((page - 1) * pageSize, page * pageSize).map((post) => (
            <TestimonialCard
              key={post.id}
              post={post}
              onOpen={() => openPost(post.id)}
              onLike={() => void like(post)}
              onEdit={() => setEditing(post)}
              onDelete={() => void remove(post)}
            />
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(posts.length / pageSize))}
          totalItems={posts.length}
          onPageChange={setPage}
        />
      </div>
      {editing && (
        <TestimonyForm
          post={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </section>
  );
}
