import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { NewsArticle } from "../../types/platform";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

export function NewsDetailPage() {
  const { articleId } = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!articleId) {
      setError("기사 주소가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    api<NewsArticle>(`/news/${articleId}`)
      .then((data) => {
        setArticle(data);
        setError("");
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "기사를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [articleId]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-4xl">
          <PageBreadcrumb
            items={[{ label: "우리 곁의 아픔", href: "/news" }, { label: article?.title ?? "기사 상세" }]}
            className="mb-6"
          />
          <a
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            기사 목록으로 돌아가기
          </a>
          {loading && (
            <div className="mt-8 rounded-lg border bg-white p-12 text-center text-sm text-gray-500" role="status">
              기사를 불러오는 중입니다.
            </div>
          )}
          {!loading && error && (
            <div className="mt-8 rounded-lg border bg-white p-10 text-center">
              <p role="alert" className="font-bold text-gray-900">
                {error}
              </p>
              <a
                href="/news"
                className="mt-5 inline-flex rounded-md bg-gray-900 px-5 py-3 text-sm font-bold text-white"
              >
                기사 목록 보기
              </a>
            </div>
          )}
          {article && (
            <article className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="aspect-[16/8] overflow-hidden bg-gray-200">
                <img src={article.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="font-bold text-brand-700">{article.sourceName || "출처 미상"}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                </div>
                <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-gray-950 md:text-4xl">
                  {article.title}
                </h1>
                <div className="mt-8 border-y py-7">
                  <h2 className="text-sm font-bold tracking-wide text-gray-900">기사 요약</h2>
                  <p className="mt-3 whitespace-pre-line text-base leading-8 text-gray-700">{article.summary}</p>
                </div>
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs leading-5 text-gray-500">
                    기사 전문과 최신 내용은 원문 사이트에서 확인해 주세요.
                  </p>
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-gray-900 px-5 text-sm font-bold text-white hover:bg-gray-700"
                  >
                    원문 보기
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
