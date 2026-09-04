import { EyeOff, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { TestimonyPost } from "../../types/platform";
import { Pagination } from "../common/Pagination";
import { Footer } from "../layout/Footer";
import { SiteHeader } from "../layout/SiteHeader";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

const pageSize = 10;

export function TestimonyListPage() {
  const { user, openLogin } = useAuth();
  const [posts, setPosts] = useState<TestimonyPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPosts(await api<TestimonyPost[]>("/testimonies"));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "간증 게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const write = () => {
    if (!user) {
      openLogin("/testimony/new");
      return;
    }
    window.location.href = "/testimony/new";
  };

  const pagePosts = posts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[75vh] bg-gray-50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb items={[{ label: "회복 간증" }]} className="mb-8" />
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-brand-700">COMMUNITY</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-gray-950 md:text-4xl">회복 간증</h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">나눔을 통해 경험한 은혜의 이야기를 함께 나눕니다.</p>
            </div>
            <button
              type="button"
              onClick={write}
              className="flex h-11 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700"
            >
              <Plus size={17} />
              글쓰기
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-8 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          {loading && (
            <p role="status" className="py-24 text-center text-sm text-gray-500">
              게시글을 불러오는 중입니다.
            </p>
          )}
          {!loading && (
            <section className="mt-10" aria-label="회복 간증 게시글 목록">
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead className="border-b bg-gray-100 text-xs font-bold text-gray-600">
                    <tr>
                      <th className="w-40 px-5 py-4 text-center">사역팀</th>
                      <th className="px-5 py-4 text-center">제목</th>
                      <th className="w-36 px-5 py-4 text-center">작성자</th>
                      <th className="w-36 px-5 py-4 text-center">날짜</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagePosts.map((post) => (
                      <tr key={post.id} className="text-gray-700 hover:bg-gray-50">
                        <td className="px-5 py-5 text-gray-600 text-center">{post.team?.name ?? "함께하는 사역"}</td>
                        <td className="px-5 py-5">
                          <a
                            href={`/testimony/${post.id}`}
                            className="inline-flex items-center gap-2 font-bold text-gray-950 hover:text-brand-700"
                          >
                            {post.visibility === "PRIVATE" && (
                              <EyeOff size={15} className="shrink-0 text-gray-400" aria-label="비공개" />
                            )}
                            {post.title}
                            <span className="font-normal text-gray-400">[{post.commentCount}]</span>
                          </a>
                        </td>
                        <td className="px-5 py-5 text-center">{post.author.nickname}</td>
                        <td className="px-5 py-5 text-center text-gray-500">
                          <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</time>
                        </td>
                      </tr>
                    ))}
                    {!pagePosts.length && (
                      <tr>
                        <td colSpan={4} className="h-56 text-center text-gray-500">
                          등록된 간증이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(posts.length / pageSize))}
                totalItems={posts.length}
                onPageChange={setPage}
              />
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
