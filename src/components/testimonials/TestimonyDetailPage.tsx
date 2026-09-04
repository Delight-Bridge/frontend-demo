import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { TestimonyPost } from "../../types/platform";
import { inputClass } from "../common/FormControls";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { CommentItem } from "./CommentItem";
import { TestimonialActions } from "./TestimonialActions";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

export function TestimonyDetailPage() {
  const { postId } = useParams();
  const { user, openLogin } = useAuth();
  const [post, setPost] = useState<TestimonyPost | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!postId) {
      setError("게시글 주소가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    try {
      setPost(await api<TestimonyPost>(`/testimonies/${postId}`));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "간증을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLike = async () => {
    if (!user) {
      openLogin(window.location.pathname);
      return;
    }
    try {
      await api(`/testimonies/${postId}/like`, { method: "POST" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "좋아요를 처리하지 못했습니다.");
    }
  };

  const addComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      openLogin(window.location.pathname);
      return;
    }
    if (!comment.trim()) return;
    try {
      await api(`/testimonies/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: comment.trim() }),
      });
      setComment("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글을 등록하지 못했습니다.");
    }
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-4xl">
          <PageBreadcrumb
            items={[{ label: "회복 간증", href: "/testimony" }, { label: post?.title ?? "간증 상세" }]}
            className="mb-6"
          />
          <a
            href="/testimony"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-950"
          >
            <ArrowLeft size={17} />글 목록으로 돌아가기
          </a>
          {loading && (
            <div className="mt-8 rounded-lg border bg-white p-12 text-center text-sm text-gray-500" role="status">
              간증을 불러오는 중입니다.
            </div>
          )}
          {!loading && error && !post && (
            <div className="mt-8 rounded-lg border bg-white p-10 text-center">
              <p role="alert" className="font-bold text-gray-900">
                {error}
              </p>
              <a
                href="/testimony"
                className="mt-5 inline-flex rounded-md bg-gray-900 px-5 py-3 text-sm font-bold text-white"
              >
                글 목록 보기
              </a>
            </div>
          )}
          {post && (
            <article className="mt-8 overflow-hidden rounded-lg border bg-white">
              <header className="border-b px-5 py-6 md:px-8">
                <p className="text-sm font-bold text-brand-700">{post.team?.name ?? "함께하는 사역"}</p>
                <h1 className="mt-3 font-serif text-2xl font-bold leading-tight text-gray-950 md:text-3xl">
                  {post.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{post.author.nickname}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString("ko-KR")}</time>
                </div>
              </header>
              {post.thumbnailUrl && (
                <img
                  src={post.thumbnailUrl}
                  alt={`${post.title} 대표 이미지`}
                  className="max-h-[520px] w-full object-cover"
                />
              )}
              <div className="min-h-64 px-5 py-8 md:px-8 md:py-10">
                <p className="whitespace-pre-wrap text-base leading-8 text-gray-700">{post.content}</p>
              </div>
              <div className="border-t px-5 py-4 md:px-8">
                <TestimonialActions
                  liked={post.likedByMe}
                  likes={post.likeCount}
                  comments={post.commentCount}
                  onToggleLike={() => void toggleLike()}
                  onOpenComments={() =>
                    document.getElementById("testimony-comments")?.scrollIntoView({ behavior: "smooth" })
                  }
                />
              </div>
              <section id="testimony-comments" className="border-t bg-gray-50 p-5 md:p-8">
                <h2 className="font-bold text-gray-950">댓글 {post.commentCount}</h2>
                {user ? (
                  <form onSubmit={addComment} className="mt-4 flex gap-2">
                    <input
                      required
                      maxLength={1000}
                      className={inputClass}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="댓글을 입력하세요"
                    />
                    <button className="shrink-0 rounded-md bg-gray-900 px-4 text-sm font-bold text-white">등록</button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => openLogin(window.location.pathname)}
                    className={`${inputClass} mt-4 text-left text-gray-500`}
                  >
                    로그인 후 댓글을 작성할 수 있습니다
                  </button>
                )}
                {error && (
                  <p role="alert" className="mt-3 text-xs text-red-600">
                    {error}
                  </p>
                )}
                <ul className="mt-5">
                  {post.comments?.map((item) => (
                    <CommentItem key={item.id} postId={post.id} comment={item} onChanged={() => void load()} />
                  ))}
                </ul>
              </section>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
