"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { Pin, PinOff } from "lucide-react";
import { useCallback } from "react";
import { usePathname } from "next/navigation";

import { FavoriteReviewsVsNavPinsVocabularyRail } from "@/components/FavoriteReviewsVsNavPinsVocabularyRail";
import { Button } from "@/components/ui/button";
import { useNavPinnedLinks } from "@/hooks/use-nav-pinned-links";
import { flattenNavLinks } from "@/lib/nav-config";

/** Pinned + pin-current controls in the sidebar (V1.1+; not mounted in V1 {@link SidebarNav}). */
export function NavPinnedLinksPanel() {
  const pathname = usePathname() ?? "/";
  const { pinned, togglePin, isPinned } = useNavPinnedLinks();

  const pinCurrent = useCallback(() => {
    const links = flattenNavLinks();
    const match = links.find((link) => {
      const path = link.href.split("?")[0] ?? "";

      return path === pathname || pathname.startsWith(`${path}/`);
    });

    if (match === undefined) {
      return;
    }

    togglePin({ href: match.href, label: match.label });
  }, [pathname, togglePin]);

  const unpin = useCallback(
    (href: string) => {
      togglePin({ href, label: "" });
    },
    [togglePin],
  );

  const currentPinned = isPinned(pathname);

  return (
    <div
      id="nav-pinned-links-panel"
      className="mb-3 space-y-2"
      data-testid="nav-pinned-links-panel"
    >
      <FavoriteReviewsVsNavPinsVocabularyRail currentSurfaceId="nav-pins" />
      <div className="flex items-center justify-between gap-2 px-1">
        <span className={cn("font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Pinned</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-7 gap-1 px-2", OPERATOR_TYPOGRAPHY.helper)}
          onClick={pinCurrent}
          aria-pressed={currentPinned}
        >
          {currentPinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
          {currentPinned ? "Unpin page" : "Pin page"}
        </Button>
      </div>

      {pinned.length === 0 ? (
        <p className={cn("m-0 px-1 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Pin frequently used pages for quick access.</p>
      ) : (
        <ul className="m-0 list-none space-y-0.5 p-0">
          {pinned.map((row) => (
            <li key={row.href} className="flex items-center gap-1 rounded px-1 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <Link
                href={row.href}
                className={cn("min-w-0 flex-1 truncate rounded px-1 py-1 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
              >
                {row.label}
              </Link>
              <button
                type="button"
                className="shrink-0 rounded p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                aria-label={`Unpin ${row.label}`}
                onClick={() => {
                  unpin(row.href);
                }}
              >
                <PinOff className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
