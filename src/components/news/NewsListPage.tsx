import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { NewsArticle } from "../../types/platform";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { Pagination } from "../common/Pagination";
import { NewsForm } from "./NewsForm";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

const pageSize = 10;

export function NewsListPage() {
  const { user } = useAuth();
  const admin = user?.role === "ADMIN";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [editing, setEditing] = useState<NewsArticle | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setArticles(await api(`/news${admin ? "?includeHidden=true" : ""}`));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "기사 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(articles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageArticles = articles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const remove = async (article: NewsArticle) => {
    if (!window.confirm(`‘${article.title}’ 기사를 삭제할까요?`)) return;
    try {
      await api(`/news/${article.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "기사를 삭제하지 못했습니다.");
    }
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb items={[{ label: "우리 곁의 아픔" }]} className="mb-8" />
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-brand-700">NEWS & CONTENTS</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-gray-950 md:text-4xl">우리 곁의 아픔</h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                외면할 수 없는 다음 세대와 청년들의 이야기
              </p>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="flex h-11 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-bold text-white"
              >
                <Plus size={17} />
                기사 등록
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-8 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          {loading && (
            <p role="status" className="py-24 text-center text-sm text-gray-500">
              기사 목록을 불러오는 중입니다.
            </p>
          )}
          {!loading && (
            <section className="mt-10" aria-label="기사 목록">
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="border-b bg-gray-100 text-xs font-bold text-gray-600">
                    <tr>
                      <th className="w-20 px-4 py-4 text-center">No.</th>
                      <th className="px-5 py-4 text-center">기사 제목</th>
                      <th className="w-40 px-5 py-4 text-center">출처</th>
                      <th className="w-36 px-5 py-4 text-center">게시일</th>
                      {admin && <th className="w-24 px-4 py-4 text-center">관리</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pageArticles.map((article, index) => (
                      <tr key={article.id} className="text-gray-700 hover:bg-gray-50">
                        <td className="px-4 py-5 text-center text-gray-500">
                          {articles.length - ((currentPage - 1) * pageSize + index)}
                        </td>
                        <td className="px-5 py-5">
                          <a
                            href={`/news/${article.id}`}
                            className="flex items-center gap-4 font-bold text-gray-950 hover:text-brand-700"
                          >
                            <img
                              src={article.thumbnailUrl}
                              alt=""
                              className="h-14 w-20 shrink-0 rounded-md bg-gray-100 object-cover"
                            />
                            <span className="inline-flex items-center gap-2">
                              {!article.isVisible && (
                                <EyeOff size={15} className="shrink-0 text-gray-400" aria-label="비공개" />
                              )}
                              {article.title}
                            </span>
                          </a>
                        </td>
                        <td className="px-5 py-5 text-center text-gray-600">{article.sourceName || "출처 미상"}</td>
                        <td className="px-5 py-5 text-center text-gray-500">
                          <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                        </td>
                        {admin && (
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => setEditing(article)}
                                className="grid h-9 w-9 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
                                aria-label={`${article.title} 수정`}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void remove(article)}
                                className="grid h-9 w-9 place-items-center rounded-md text-red-500 hover:bg-red-50"
                                aria-label={`${article.title} 삭제`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {!articles.length && (
                      <tr>
                        <td colSpan={admin ? 5 : 4} className="h-56 text-center text-gray-500">
                          등록된 기사가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={articles.length}
                onPageChange={setPage}
              />
            </section>
          )}
        </div>
      </main>
      <Footer />
      {editing && (
        <NewsForm
          article={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </>
  );
}
