import { EyeOff, Pencil, Trash2 } from "lucide-react";
import type { TestimonyPost } from "../../types/platform";
import { TestimonialActions } from "./TestimonialActions";

export function TestimonialCard({
  post,
  onOpen,
  onLike,
  onEdit,
  onDelete,
}: {
  post: TestimonyPost;
  onOpen: () => void;
  onLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex min-h-48 overflow-hidden rounded-lg border border-gray-200 bg-white sm:min-h-56">
      {post.thumbnailUrl && (
        <button onClick={onOpen} className="w-28 shrink-0 overflow-hidden bg-gray-100 sm:w-48 xl:w-56">
          <img src={post.thumbnailUrl} alt={`${post.title} 대표 이미지`} className="h-full w-full object-cover" />
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {post.author?.profileImageUrl ? (
              <img
                src={post.author.profileImageUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
              />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white sm:h-10 sm:w-10">
                {post.author?.nickname?.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{post.author?.nickname}</p>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                {post.updatedAt !== post.createdAt && " · 수정됨"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {post.visibility === "PRIVATE" && (
              <span className="mr-1 flex items-center gap-1 text-xs text-gray-500">
                <EyeOff size={14} />
                비공개
              </span>
            )}
            {post.canManage && (
              <>
                <button
                  onClick={onEdit}
                  className="grid h-9 w-9 place-items-center text-gray-500"
                  aria-label={`${post.title} 수정`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="grid h-9 w-9 place-items-center text-red-500"
                  aria-label={`${post.title} 삭제`}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        <button onClick={onOpen} className="block min-w-0 flex-1 text-left">
          <h3 className="line-clamp-2 text-base font-bold text-gray-950 sm:text-xl">{post.title}</h3>
          <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-gray-700 sm:mt-3 sm:line-clamp-3 sm:leading-7 lg:text-base">
            {post.content}
          </p>
          <span className="mt-2 inline-block text-xs font-bold text-brand-700 sm:mt-3">전체 이야기와 댓글 보기</span>
        </button>
        <div className="mt-3 sm:mt-4">
          <TestimonialActions
            liked={post.likedByMe}
            likes={post.likeCount}
            comments={post.commentCount}
            onToggleLike={onLike}
            onOpenComments={onOpen}
          />
        </div>
      </div>
    </article>
  );
}
