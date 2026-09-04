import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { GalleryPost, MinistryTeam } from "../../types/platform";
import { SectionHeading } from "../SectionHeading";
import { GalleryForm } from "./GalleryForm";
import { MinistryCard } from "./MinistryCard";
import { MinistryModal } from "./MinistryModal";
import { Pagination } from "../common/Pagination";
import { PageBreadcrumb } from "../common/PageBreadcrumb";

export function MinistrySection({ showBreadcrumb = false }: { showBreadcrumb?: boolean }) {
  const { user } = useAuth();
  const canCreate = user?.role === "ADMIN" || user?.role === "AUTHORIZED_UPLOADER";
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<GalleryPost | null>(null);
  const [editing, setEditing] = useState<GalleryPost | "new" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [canScrollTeamsLeft, setCanScrollTeamsLeft] = useState(false);
  const [canScrollTeamsRight, setCanScrollTeamsRight] = useState(false);
  const teamScrollerRef = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      const [teamData, postData] = await Promise.all([
        api<MinistryTeam[]>("/teams"),
        api<GalleryPost[]>(`/gallery${canCreate ? "?includeHidden=true" : ""}`),
      ]);
      setTeams(teamData);
      setPosts(postData);
      setPage(1);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사역 현장을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [canCreate]);
  useEffect(() => {
    void load();
  }, [load]);

  const updateTeamScrollControls = useCallback(() => {
    const scroller = teamScrollerRef.current;
    if (!scroller) return;
    setCanScrollTeamsLeft(scroller.scrollLeft > 4);
    setCanScrollTeamsRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const scroller = teamScrollerRef.current;
    if (!scroller) return;
    updateTeamScrollControls();
    const observer = new ResizeObserver(updateTeamScrollControls);
    observer.observe(scroller);
    scroller.addEventListener("scroll", updateTeamScrollControls, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", updateTeamScrollControls);
    };
  }, [teams, updateTeamScrollControls]);

  const scrollTeams = (direction: -1 | 1) => {
    const scroller = teamScrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.75, behavior: "smooth" });
  };

  const visiblePosts = filter === "all" ? posts : posts.filter((post) => post.ministryTeamId === filter);
  const pagePosts = visiblePosts.slice((page - 1) * pageSize, page * pageSize);
  const selectedIndex = selected ? visiblePosts.findIndex((post) => post.id === selected.id) : -1;
  const openPostAtIndex = (index: number) => {
    const target = visiblePosts[index];
    if (!target) return;
    setPage(Math.floor(index / pageSize) + 1);
    setSelected(target);
  };
  const remove = async (post: GalleryPost) => {
    if (!window.confirm(`‘${post.title}’ 게시물을 삭제할까요?`)) return;
    try {
      await api(`/gallery/${post.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    }
  };

  return (
    <section id="ministries" className="scroll-mt-16 bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        {showBreadcrumb && <PageBreadcrumb items={[{ label: "우리의 응답" }]} className="mb-8" />}
        <div className="mb-10 flex items-end justify-between gap-4">
          <SectionHeading title="우리의 응답" description="어둠 속에 빛을 비추는 15개 사역팀의 현장" align="left" />
          {canCreate && (
            <button
              onClick={() => setEditing("new")}
              className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-gray-900 px-3 text-sm font-bold text-white"
            >
              <Plus size={17} />
              현장 등록
            </button>
          )}
        </div>
        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTeams(-1)}
            disabled={!canScrollTeamsLeft}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-900 text-white shadow-md transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            aria-label="이전 사역팀 보기"
          >
            <ChevronLeft size={21} />
          </button>
          <div
            ref={teamScrollerRef}
            className="hide-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto py-1"
            role="group"
            aria-label="사역팀 필터"
          >
            <button
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              aria-pressed={filter === "all"}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100"}`}
            >
              전체
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  setFilter(team.id);
                  setPage(1);
                }}
                aria-pressed={filter === team.id}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${filter === team.id ? "bg-gray-900 text-white" : "bg-gray-100"}`}
              >
                {team.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollTeams(1)}
            disabled={!canScrollTeamsRight}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-900 text-white shadow-md transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            aria-label="다음 사역팀 보기"
          >
            <ChevronRight size={21} />
          </button>
        </div>
        {error && <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && (
          <p role="status" className="border-y py-16 text-center text-sm text-gray-500">
            사역 현장을 불러오는 중입니다.
          </p>
        )}
        {!loading && visiblePosts.length ? (
          <div className="grid grid-cols-2 gap-1 md:grid-cols-3 md:gap-4">
            {pagePosts.map((post) => (
              <MinistryCard
                key={post.id}
                post={post}
                canManage={post.canManage}
                onSelect={() => setSelected(post)}
                onEdit={() => setEditing(post)}
                onDelete={() => void remove(post)}
              />
            ))}
          </div>
        ) : (
          !loading && (
            <p className="border-y py-16 text-center text-sm text-gray-500">
              선택한 사역팀의 현장 기록이 아직 없습니다.
            </p>
          )
        )}
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(visiblePosts.length / pageSize))}
          totalItems={visiblePosts.length}
          onPageChange={setPage}
        />
      </div>
      {selected && (
        <MinistryModal
          post={selected}
          onClose={() => setSelected(null)}
          onChanged={() => void load()}
          onPrevious={selectedIndex > 0 ? () => openPostAtIndex(selectedIndex - 1) : undefined}
          onNext={
            selectedIndex >= 0 && selectedIndex < visiblePosts.length - 1
              ? () => openPostAtIndex(selectedIndex + 1)
              : undefined
          }
        />
      )}
      {editing && (
        <GalleryForm
          post={editing === "new" ? undefined : editing}
          teams={teams}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </section>
  );
}
