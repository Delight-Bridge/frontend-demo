import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { NewsArticle } from "../../types/platform";
import { NewsForm } from "../news/NewsForm";

export function NewsManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [editing, setEditing] = useState<NewsArticle | "new" | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setArticles(await api<NewsArticle[]>("/news?includeHidden=true"));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "뉴스를 불러오지 못했습니다.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const toggleVisibility = async (article: NewsArticle) => {
    try {
      await api(`/news/${article.id}`, { method: "PATCH", body: JSON.stringify({ isVisible: !article.isVisible }) });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "공개 상태를 변경하지 못했습니다.");
    }
  };
  const remove = async (article: NewsArticle) => {
    if (!window.confirm(`‘${article.title}’ 뉴스를 삭제할까요?`)) return;
    try {
      await api(`/news/${article.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "뉴스를 삭제하지 못했습니다.");
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md border bg-white p-4">
        <div>
          <h3 className="font-bold">뉴스 콘텐츠 {articles.length}건</h3>
          <p className="mt-1 text-xs text-gray-500">
            원문 링크와 관리자 요약을 직접 등록합니다. 자동 수집은 사용하지 않습니다.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white"
        >
          <Plus size={17} />
          뉴스 업로드
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section className="overflow-hidden rounded-md border bg-white">
        <div className="divide-y">
          {articles.map((article) => (
            <article
              key={article.id}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[112px_1fr_140px_auto] lg:items-center"
            >
              <img src={article.thumbnailUrl} alt="" className="aspect-[16/10] w-28 rounded object-cover" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-bold">{article.title}</h4>
                  {!article.isVisible && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">비공개</span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{article.summary}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {article.sourceName || "출처 없음"} · {article.publishedAt} · 순서 {article.displayOrder}
                </p>
              </div>
              <button
                onClick={() => void toggleVisibility(article)}
                className={`flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-bold ${article.isVisible ? "text-brand-700" : "text-gray-500"}`}
              >
                {article.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                {article.isVisible ? "공개 중" : "비공개"}
              </button>
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditing(article)}
                  className="grid h-9 w-9 place-items-center text-gray-500"
                  aria-label={`${article.title} 수정`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => void remove(article)}
                  className="grid h-9 w-9 place-items-center text-red-500"
                  aria-label={`${article.title} 삭제`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          {!articles.length && <p className="py-16 text-center text-sm text-gray-500">등록된 뉴스가 없습니다.</p>}
        </div>
      </section>
      {editing && (
        <NewsForm
          article={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
