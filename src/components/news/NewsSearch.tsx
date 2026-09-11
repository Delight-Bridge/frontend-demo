import { Search, X } from "lucide-react";
import { useRef } from "react";
import type { NewsArticle } from "../../types/platform";
import { inputClass } from "../common/FormControls";

export function filterNews(articles: NewsArticle[], query: string) {
  const keyword = query.trim().toLocaleLowerCase();
  return articles.filter((article) => `${article.title} ${article.sourceName}`.toLocaleLowerCase().includes(keyword));
}

export function NewsSearch({
  query,
  onChange,
  count,
  inverse = false,
}: {
  query: string;
  onChange: (query: string) => void;
  count?: number;
  inverse?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3" role="search" aria-label="뉴스 검색">
      <div className="relative w-full sm:max-w-md">
        <Search size={18} className="pointer-events-none absolute left-3 top-3 text-gray-500" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          aria-label="뉴스 제목 또는 출처 검색"
          placeholder="뉴스 제목 또는 출처 검색"
          value={query}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} h-11 pl-10 pr-11 [&::-webkit-search-cancel-button]:appearance-none`}
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {query.trim() && count !== undefined && (
        <p role="status" className={`text-sm ${inverse ? "text-gray-300" : "text-gray-600"}`}>
          검색 결과 {count}건
        </p>
      )}
    </div>
  );
}
