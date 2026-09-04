import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageBreadcrumb({
  items,
  inverse = false,
  className = "",
}: {
  items: BreadcrumbItem[];
  inverse?: boolean;
  className?: string;
}) {
  const linkClass = inverse ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-950";
  const currentClass = inverse ? "text-white" : "text-gray-900";
  const separatorClass = inverse ? "text-white/35" : "text-gray-300";

  return (
    <nav aria-label="현재 위치" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium sm:text-sm">
        <li>
          <a href="/" className={`inline-flex items-center gap-1.5 ${linkClass}`}>
            <Home size={14} aria-hidden="true" />홈
          </a>
        </li>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight size={14} className={`shrink-0 ${separatorClass}`} aria-hidden="true" />
              {item.href && !current ? (
                <a href={item.href} className={`truncate ${linkClass}`}>
                  {item.label}
                </a>
              ) : (
                <span className={`truncate font-bold ${currentClass}`} aria-current={current ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
