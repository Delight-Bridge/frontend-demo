import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { TestimonyPost } from "../../types/platform";
import { Dialog } from "../common/Dialog";
import { inputClass } from "../common/FormControls";
import { CommentItem } from "./CommentItem";
import { TestimonialActions } from "./TestimonialActions";

export function TestimonyDetail({
  postId,
  onClose,
  onChanged,
}: {
  postId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user, openLogin } = useAuth();
  const [post, setPost] = useState<TestimonyPost | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setPost(await api<TestimonyPost>(`/testimonies/${postId}`));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "간증을 불러오지 못했습니다.");
    }
  }, [postId]);
  useEffect(() => {
    void load();
  }, [load]);
  const toggleLike = async () => {
    if (!user) return openLogin();
    try {
      await api(`/testimonies/${postId}/like`, { method: "POST" });
      await load();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "좋아요를 처리하지 못했습니다.");
    }
  };
  const addComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return openLogin();
    try {
      await api(`/testimonies/${postId}/comments`, { method: "POST", body: JSON.stringify({ content: comment }) });
      setComment("");
      await load();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글을 등록하지 못했습니다.");
    }
  };
  return (
    <Dialog title={post?.title ?? "회복 간증"} onClose={onClose} size="lg">
      {!post ? (
        <div className="p-8 text-center text-sm text-gray-500">{error || "불러오는 중..."}</div>
      ) : (
        <div>
          {post.thumbnailUrl && (
            <img
              src={post.thumbnailUrl}
              alt={`${post.title} 대표 이미지`}
              className="max-h-[480px] w-full object-cover"
            />
          )}
          <div className="p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-bold text-white">
                {post.author.nickname.slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-bold">{post.author.nickname}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString("ko-KR")}</p>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-8 text-gray-700 md:text-base">{post.content}</p>
            <div className="mt-8">
              <TestimonialActions
                liked={post.likedByMe}
                likes={post.likeCount}
                comments={post.commentCount}
                onToggleLike={() => void toggleLike()}
                onOpenComments={() => document.getElementById("comments")?.scrollIntoView()}
              />
            </div>
          </div>
          <div id="comments" className="border-t bg-gray-50 p-5 md:p-7">
            <h3 className="font-bold">댓글 {post.commentCount}</h3>
            {user ? (
              <form onSubmit={addComment} className="mt-4 flex gap-2">
                <input
                  required
                  maxLength={1000}
                  className={inputClass}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="댓글을 입력하세요"
                />
                <button className="shrink-0 rounded-md bg-gray-900 px-4 text-sm font-bold text-white">등록</button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => openLogin()}
                className={`${inputClass} mt-4 text-left text-gray-500`}
              >
                로그인 후 댓글을 작성할 수 있습니다
              </button>
            )}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <ul className="mt-5">
              {post.comments?.map((item) => (
                <CommentItem key={item.id} postId={post.id} comment={item} onChanged={() => void load()} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </Dialog>
  );
}
