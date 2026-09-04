import { Check, ChevronDown } from "lucide-react";
import type { MinistryTeam } from "../../types/platform";

export function MinistryAccordion({
  team,
  open,
  onToggle,
  onSelect,
  selected,
}: {
  team: MinistryTeam;
  open: boolean;
  onToggle: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  const contentId = `${team.id}-details`;
  return (
    <article
      className={`overflow-hidden rounded-lg border transition ${selected ? "border-brand-300 bg-brand-800" : "border-brand-700 bg-brand-800/50"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span>
          <span className="block font-bold">{team.name}</span>
          <span className="mt-1 block text-xs leading-5 text-brand-100">{team.shortDescription}</span>
        </span>
        <ChevronDown className={`shrink-0 text-brand-300 transition-transform ${open ? "rotate-180" : ""}`} size={20} />
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-brand-700/60 px-5 py-5 text-sm text-brand-50">
            <dl className="grid gap-4">
              <div>
                <dt className="text-xs font-bold text-brand-300">비전</dt>
                <dd className="mt-1 leading-6">{team.vision}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-brand-300">주요 활동</dt>
                <dd className="mt-1 leading-6">{team.activities}</dd>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold text-brand-300">활동 일정</dt>
                  <dd className="mt-1">{team.schedule}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-brand-300">모집 대상</dt>
                  <dd className="mt-1">{team.targetAudience || "누구나"}</dd>
                </div>
              </div>
              {team.contactInfo && (
                <div>
                  <dt className="text-xs font-bold text-brand-300">문의</dt>
                  <dd className="mt-1">{team.contactInfo}</dd>
                </div>
              )}
            </dl>
            <button
              onClick={onSelect}
              className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-bold ${selected ? "bg-white text-brand-800" : "bg-brand-600 text-white"}`}
            >
              {selected ? "선택한 사역팀" : "이 사역팀 선택"}
              <Check size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
