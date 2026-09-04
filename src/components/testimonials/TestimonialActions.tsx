import { Heart, MessageCircle } from "lucide-react";

export function TestimonialActions({
  liked,
  likes,
  comments,
  onToggleLike,
  onOpenComments,
}: {
  liked: boolean;
  likes: number;
  comments: number;
  onToggleLike: () => void;
  onOpenComments: () => void;
}) {
  return (
    <div className="flex items-center border-t border-gray-100 pt-4 text-sm text-gray-500">
      <button
        type="button"
        onClick={onToggleLike}
        className={`flex h-10 items-center gap-2 px-1 transition hover:text-red-500 ${liked ? "text-red-500" : ""}`}
        aria-label={liked ? "좋아요 취소" : "좋아요"}
        aria-pressed={liked}
      >
        <Heart size={21} fill={liked ? "currentColor" : "none"} />
        <span>{likes}</span>
      </button>
      <button
        type="button"
        onClick={onOpenComments}
        className="ml-5 flex h-10 items-center gap-2 px-1 transition hover:text-brand-600"
        aria-label={`댓글 ${comments}개 보기`}
      >
        <MessageCircle size={21} />
        <span>{comments}</span>
      </button>
    </div>
  );
}
