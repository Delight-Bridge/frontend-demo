import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const dialogStack: symbol[] = [];

type DialogProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  dismissible?: boolean;
  hideHeader?: boolean;
  closeOutside?: boolean;
  overlayClassName?: string;
  outsideControls?: React.ReactNode;
};

export function Dialog({
  title,
  children,
  onClose,
  size = "md",
  dismissible = true,
  hideHeader = false,
  closeOutside = false,
  overlayClassName = "bg-black/70",
  outsideControls,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  const width = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  useEffect(() => {
    const dialogToken = Symbol("dialog");
    dialogStack.push(dialogToken);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKey = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== dialogToken) return;
      if (event.key === "Escape" && dismissible) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
      const stackIndex = dialogStack.lastIndexOf(dialogToken);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      previousFocusRef.current?.focus();
    };
  }, [dismissible]);

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 ${overlayClassName}`}
      onMouseDown={(event) => dismissible && event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      {hideHeader && closeOutside && dismissible && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-30 grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/15"
          aria-label="닫기"
        >
          <X size={28} />
        </button>
      )}
      {outsideControls}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[90vh] w-full rounded-lg overflow-y-auto bg-white text-gray-900 shadow-2xl ${width}`}
      >
        {hideHeader ? (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {dismissible && !closeOutside && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-gray-500 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-gray-900"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            )}
          </>
        ) : (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              {title}
            </h2>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center text-gray-500 hover:text-gray-900"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
