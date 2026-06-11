"use client";

import Link from "next/link";
import { Pin, PinOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  isNavLinkPinned,
  readNavPinnedLinks,
  toggleNavPinnedLink,
  writeNavPinnedLinks,
  type NavPinnedLink,
} from "@/lib/usability/nav-pinned-links";
import { flattenNavLinks } from "@/lib/nav-config";

/** Pinned + pin-current controls in the sidebar. */
export function NavPinnedLinksPanel() {
  const pathname = usePathname() ?? "/";
  const [pinned, setPinned] = useState<NavPinnedLink[]>([]);

  useEffect(() => {
    setPinned(readNavPinnedLinks());
  }, []);

  const pinCurrent = useCallback(() => {
    const links = flattenNavLinks();
    const match = links.find((link) => {
      const path = link.href.split("?")[0] ?? "";

      return path === pathname || pathname.startsWith(`${path}/`);
    });

    if (match === undefined) {
      return;
    }

    const next = toggleNavPinnedLink(pinned, { href: match.href, label: match.label });
    setPinned(next);
    writeNavPinnedLinks(next);
  }, [pathname, pinned]);

  const unpin = useCallback((href: string) => {
    const next = toggleNavPinnedLink(pinned, { href, label: "" });
    setPinned(next);
    writeNavPinnedLinks(next);
  }, [pinned]);

  const currentPinned = isNavLinkPinned(pinned, pathname);

  return (
    <div className="mb-3 space-y-2" data-testid="nav-pinned-links-panel">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pinned</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={pinCurrent}
          aria-pressed={currentPinned}
        >
          {currentPinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
          {currentPinned ? "Unpin page" : "Pin page"}
        </Button>
      </div>

      {pinned.length === 0 ? (
        <p className="m-0 px-1 text-xs text-neutral-500">Pin frequently used pages for quick access.</p>
      ) : (
        <ul className="m-0 list-none space-y-0.5 p-0">
          {pinned.map((row) => (
            <li key={row.href} className="flex items-center gap-1 rounded px-1 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <Link
                href={row.href}
                className="min-w-0 flex-1 truncate rounded px-1 py-1 text-sm text-neutral-800 dark:text-neutral-200"
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
