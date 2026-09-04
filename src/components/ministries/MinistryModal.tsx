import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { GalleryComment, GalleryPost } from "../../types/platform";
import { Dialog } from "../common/Dialog";

export function MinistryModal({
  post,
  onClose,
  onChanged,
  onPrevious,
  onNext,
}: {
  post: GalleryPost;
  onClose: () => void;
  onChanged?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const { user, openLogin } = useAuth();
  const [current, setCurrent] = useState(post);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const images = [current.thumbnailUrl, ...current.additionalImages].filter(Boolean);

  useEffect(() => {
    setCurrent(post);
    setComment("");
    setError("");
    setImageIndex(0);
  }, [post]);

  const finishSwipe = (clientX: number) => {
    if (touchStartX.current === null) return;
    const distance = clientX - touchStartX.current;
    if (distance < -40 && imageIndex < images.length - 1) setImageIndex((index) => index + 1);
    if (distance > 40 && imageIndex > 0) setImageIndex((index) => index - 1);
    touchStartX.current = null;
  };

  const toggleLike = async () => {
    if (!user) return openLogin("/#ministries");
    try {
      const result = await api<{ liked: boolean; likeCount: number }>(`/gallery/${current.id}/like`, {
        method: "POST",
      });
      setCurrent((value) => ({ ...value, likedByMe: result.liked, likeCount: result.likeCount }));
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "좋아요를 처리하지 못했습니다.");
    }
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return openLogin("/#ministries");
    const content = comment.trim();
    if (!content) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await api<GalleryComment>(`/gallery/${current.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setCurrent((value) => ({
        ...value,
        comments: [...value.comments, created],
        commentCount: value.commentCount + 1,
      }));
      setComment("");
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글을 등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeComment = async (target: GalleryComment) => {
    try {
      await api(`/gallery/${current.id}/comments/${target.id}`, { method: "DELETE" });
      setCurrent((value) => ({
        ...value,
        comments: value.comments.filter((item) => item.id !== target.id),
        commentCount: Math.max(0, value.commentCount - 1),
      }));
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "댓글을 삭제하지 못했습니다.");
    }
  };

  return (
    <Dialog
      title={`${current.title} 사역 현장`}
      onClose={onClose}
      size="xl"
      hideHeader
      closeOutside
      overlayClassName="bg-[#54575A]/50"
      outsideControls={
        <>
          {onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              className="absolute left-5 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-gray-900 shadow-xl transition hover:scale-105 hover:bg-gray-100 xl:grid"
              aria-label="이전 사역 게시물"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="absolute right-5 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-gray-900 shadow-xl transition hover:scale-105 hover:bg-gray-100 xl:grid"
              aria-label="다음 사역 게시물"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      }
    >
      <div className="grid bg-white lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div
          className="relative flex min-h-80 touch-pan-y items-center justify-center overflow-hidden bg-black lg:min-h-[640px]"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
        >
          <img
            src={images[imageIndex]}
            alt={`${current.title} 현장 이미지 ${imageIndex + 1}`}
            className="max-h-[72vh] w-full object-contain"
          />
          {images.length > 1 && (
            <>
              <span className="absolute right-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">
                {imageIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setImageIndex((index) => Math.max(0, index - 1))}
                disabled={imageIndex === 0}
                className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-900 shadow transition hover:bg-white disabled:invisible"
                aria-label="이전 이미지"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setImageIndex((index) => Math.min(images.length - 1, index + 1))}
                disabled={imageIndex === images.length - 1}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-900 shadow transition hover:bg-white disabled:invisible"
                aria-label="다음 이미지"
              >
                <ChevronRight size={18} />
              </button>
              <div
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5"
                aria-label={`전체 ${images.length}장 중 ${imageIndex + 1}번째 이미지`}
              >
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={`h-2 w-2 rounded-full shadow ${index === imageIndex ? "bg-white" : "bg-white/45"}`}
                    aria-label={`${index + 1}번째 이미지 보기`}
                    aria-current={index === imageIndex ? "true" : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex min-h-[520px] flex-col lg:max-h-[72vh] lg:min-h-[640px]">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {current.team?.name?.slice(0, 1) ?? "사"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{current.team?.name}</p>
              <p className="truncate text-xs text-gray-500">{current.author?.nickname}</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                {current.team?.name?.slice(0, 1) ?? "사"}
              </span>
              <div className="min-w-0 text-sm leading-6">
                <p>
                  <strong className="mr-2">{current.team?.name}</strong>
                  {current.content}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {new Date(current.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>

            {current.comments.map((item) => (
              <div key={item.id} className="group flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                  {item.author.nickname.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1 text-sm leading-6">
                  <p>
                    <strong className="mr-2">{item.author.nickname}</strong>
                    {item.content}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {item.canManage && (
                  <button
                    type="button"
                    onClick={() => void removeComment(item)}
                    className="grid h-8 w-8 shrink-0 place-items-center text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`${item.author.nickname} 댓글 삭제`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}

            {!current.comments.length && (
              <div className="py-12 text-center">
                <MessageCircle className="mx-auto text-gray-300" size={32} />
                <p className="mt-3 text-sm font-bold text-gray-600">아직 댓글이 없습니다</p>
                <p className="mt-1 text-xs text-gray-400">첫 번째 댓글을 남겨보세요.</p>
              </div>
            )}
          </div>

          <div className="border-t px-5 py-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => void toggleLike()}
                className={`transition hover:scale-110 ${current.likedByMe ? "text-red-500" : "text-gray-900"}`}
                aria-label={current.likedByMe ? "좋아요 취소" : "좋아요"}
              >
                <Heart size={27} fill={current.likedByMe ? "currentColor" : "none"} />
              </button>
              <MessageCircle size={26} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-bold">좋아요 {current.likeCount.toLocaleString("ko-KR")}개</p>
            <p className="mt-1 text-xs text-gray-500">댓글 {current.commentCount.toLocaleString("ko-KR")}개</p>
          </div>

          <form onSubmit={submitComment} className="flex items-center gap-3 border-t px-5 py-3">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder={user ? "댓글 달기..." : "로그인 후 댓글을 남길 수 있어요"}
              aria-label="댓글"
            />
            <button
              type="submit"
              disabled={submitting || (Boolean(user) && !comment.trim())}
              className="grid h-9 w-9 shrink-0 place-items-center text-brand-700 disabled:text-gray-300"
              aria-label={user ? "댓글 게시" : "로그인하고 댓글 달기"}
            >
              <Send size={20} />
            </button>
          </form>
          {error && (
            <p role="alert" className="border-t bg-red-50 px-5 py-3 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
