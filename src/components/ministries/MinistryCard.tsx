import { EyeOff, Pencil, Trash2 } from "lucide-react";
import type { GalleryPost } from "../../types/platform";

export function MinistryCard({
  post,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: {
  post: GalleryPost;
  canManage: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group relative aspect-square overflow-hidden bg-gray-200">
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 w-full text-left"
        aria-label={`${post.title} 상세 보기`}
      >
        <img
          src={post.thumbnailUrl}
          alt={`${post.title} 현장`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-4 text-white">
          <span className="mb-1 block text-[11px] font-bold text-brand-300">{post.team?.name}</span>
          <span className="line-clamp-2 block text-sm font-bold md:text-base">{post.title}</span>
        </span>
        {post.additionalImages.length > 0 && (
          <span
            className="absolute right-4 top-2 grid h-4 w-4 place-items-center text-white"
            aria-label={`이미지 ${post.additionalImages.length + 1}장`}
          >
            <svg className="h-6 w-6 rotate-180" viewBox="0 0 24 24" aria-hidden="true">
              <mask id={`multi-image-middle-${post.id}`}>
                <rect width="24" height="24" fill="black" />
                <rect x="3.5" y="3" width="15.5" height="15.5" rx="4.25" fill="white" />
                <rect x="5.25" y="4.75" width="14" height="14" rx="4" fill="black" />
              </mask>
              <rect
                x="3.5"
                y="3"
                width="13"
                height="13"
                rx="4.25"
                fill="white"
                stroke="rgba(0, 0, 0, 0.28)"
                mask={`url(#multi-image-middle-${post.id})`}
              />
              <rect x="5.25" y="4.75" width="14" height="14" rx="4" fill="transparent" />
              <rect x="7" y="6.5" width="13" height="13" rx="3.5" fill="white" stroke="rgba(0, 0, 0, 0.28)" />
            </svg>
          </span>
        )}
        {!post.isVisible && (
          <span className="absolute right-3 top-3 rounded bg-black/70 p-2 text-white">
            <EyeOff size={15} />
          </span>
        )}
      </button>
      {canManage && (
        <div className={`absolute right-3 z-10 flex gap-1 ${post.additionalImages.length > 0 ? "top-12" : "top-3"}`}>
          <button
            onClick={onEdit}
            className="grid h-9 w-9 place-items-center rounded bg-white/90"
            aria-label={`${post.title} 수정`}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded bg-white/90 text-red-600"
            aria-label={`${post.title} 삭제`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  );
}
