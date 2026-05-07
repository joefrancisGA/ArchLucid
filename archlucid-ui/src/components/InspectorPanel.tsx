"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InspectorPanelProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind width for docked layout; default `w-96` (24rem). */
  widthClassName?: string;
  className?: string;
  /** When false, Escape is not registered (e.g. empty docked column). */
  listenEscape?: boolean;
};

/**
 * Right-side inspector shell: title bar, close control, scrollable body. Not a modal — no trap when docked beside the table on large viewports.
 * On narrow viewports the reviews list mounts a focus trap around the slide-over overlay so Tab stays inside the sheet until dismissed.
 */
export function InspectorPanel({
  title,
  onClose,
  children,
  widthClassName = "w-96",
  className,
  listenEscape = true,
}: InspectorPanelProps) {
  useEffect(() => {
    if (!listenEscape) {
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [listenEscape, onClose]);

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-l border-neutral-300 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:border-neutral-600 dark:bg-neutral-900 dark:shadow-none",
        widthClassName,
        className,
      )}
      aria-label="Inspector"
    >
      <div className="flex shrink-0 flex-col gap-1 border-b border-neutral-300 bg-gradient-to-b from-neutral-50 to-white px-3 py-3 dark:border-neutral-600 dark:from-neutral-900 dark:to-neutral-950">
        <div className="flex items-start justify-between gap-2">
        <h2
          className="m-0 min-w-0 flex-1 line-clamp-3 break-words text-lg font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-50"
          title={title}
        >
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Close inspector"
          data-testid="inspector-panel-close"
          onClick={() => {
            onClose();
          }}
        >
          <X className="size-4" aria-hidden />
        </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{children}</div>
    </aside>
  );
}
