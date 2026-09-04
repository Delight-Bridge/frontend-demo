import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  inverse?: boolean;
};

export function Pagination({ page, totalPages, totalItems, onPageChange, inverse = false }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );
  const buttonClass = inverse ? "border-white/30 text-white" : "border-gray-300 bg-white";
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="페이지 탐색">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`grid h-10 w-10 place-items-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40 ${buttonClass}`}
        aria-label="이전 페이지"
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((value, index) => (
        <span key={value} className="contents">
          {index > 0 && value - pages[index - 1] > 1 && (
            <span aria-hidden="true" className={inverse ? "text-white/60" : "text-gray-400"}>
              …
            </span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(value)}
            aria-current={value === page ? "page" : undefined}
            className={`h-10 min-w-10 rounded-md border px-3 text-sm font-bold ${value === page ? "border-brand-600 bg-brand-600 text-white" : buttonClass}`}
          >
            {value}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`grid h-10 w-10 place-items-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40 ${buttonClass}`}
        aria-label="다음 페이지"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
