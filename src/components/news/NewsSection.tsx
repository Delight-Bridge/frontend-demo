import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { NewsArticle } from "../../types/platform";
import { SectionHeading } from "../SectionHeading";
import { NewsCard } from "./NewsCard";
import { NewsForm } from "./NewsForm";

export function NewsSection() {
  const { user } = useAuth();
  const admin = user?.role === "ADMIN";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [editing, setEditing] = useState<NewsArticle | "new" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setArticles(await api(`/news${admin ? "?includeHidden=true" : ""}`));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "소식을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [admin]);
  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (article: NewsArticle) => {
    if (!window.confirm(`‘${article.title}’ 소식을 삭제할까요?`)) return;
    try {
      await api(`/news/${article.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    }
  };

  return (
    <section id="attention" className="scroll-mt-16 bg-darkness px-4 py-20 text-white md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <SectionHeading
            title="우리 곁의 아픔"
            description="외면할 수 없는 다음 세대와 청년들의 이야기"
            align="left"
            inverse
            titleClassName="font-serif"
          />
          {admin && (
            <button
              onClick={() => setEditing("new")}
              className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-gray-900"
            >
              <Plus size={17} />
              소식 등록
            </button>
          )}
        </div>
        {error && <p className="mb-5 rounded-md bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        {loading && (
          <p role="status" className="py-16 text-center text-sm text-white/70">
            소식을 불러오는 중입니다.
          </p>
        )}
        {!loading && !articles.length && (
          <p className="py-16 text-center text-sm text-white/70">등록된 소식이 없습니다.</p>
        )}
        {!loading && articles.length > 0 && (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            role="region"
            aria-label="우리 곁의 아픔 주요 기사 3개"
          >
            {articles.slice(0, 3).map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                canManage={admin}
                onEdit={() => setEditing(article)}
                onDelete={() => void remove(article)}
              />
            ))}
          </div>
        )}
      </div>
      {editing && (
        <NewsForm
          article={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </section>
  );
}
