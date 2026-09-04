import { ArrowRight, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { NewsArticle } from "../../types/platform";

type NewsCardProps = {
  article: NewsArticle;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function NewsCard({ article, canManage, onEdit, onDelete }: NewsCardProps) {
  return (
    <article className="group relative h-[300px] overflow-hidden rounded-lg border border-white/15 bg-white shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
      {!article.isVisible && (
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white">
          <EyeOff size={13} />
          비공개
        </span>
      )}
      {canManage && (
        <div className="absolute right-3 top-3 z-20 flex gap-1">
          <button
            onClick={onEdit}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-gray-700 shadow"
            aria-label={`${article.title} 수정`}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-red-600 shadow"
            aria-label={`${article.title} 삭제`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      <a
        href={`/news/${article.id}`}
        className="flex h-full flex-col text-gray-900"
        aria-label={`${article.title} 상세 보기`}
      >
        <div className="h-44 shrink-0 overflow-hidden bg-gray-200">
          <img
            src={article.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug">{article.title}</h3>
          <div className="mt-auto flex items-center gap-2 text-xs text-gray-500">
            <span className="font-bold text-brand-700">{article.sourceName || "원문"}</span>
            <span aria-hidden="true">·</span>
            <time>{article.publishedAt}</time>
            <ArrowRight className="ml-auto shrink-0" size={14} aria-hidden="true" />
          </div>
        </div>
      </a>
    </article>
  );
}
