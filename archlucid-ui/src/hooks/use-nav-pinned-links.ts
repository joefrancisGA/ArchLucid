"use client";

import { useCallback, useEffect, useState } from "react";

import {
  isNavLinkPinned,
  readNavPinnedLinks,
  toggleNavPinnedLink,
  writeNavPinnedLinks,
  NAV_PINNED_LINKS_STORAGE_KEY,
  type NavPinnedLink,
} from "@/lib/usability/nav-pinned-links";

export const NAV_PINNED_LINKS_CHANGED_EVENT = "archlucid:nav-pinned-links-changed";

/** Shared pinned-link state for sidebar rows and the pinned-links panel. */
export function useNavPinnedLinks(): {
  readonly pinned: NavPinnedLink[];
  readonly togglePin: (link: NavPinnedLink) => void;
  readonly isPinned: (href: string) => boolean;
} {
  const [pinned, setPinned] = useState<NavPinnedLink[]>([]);

  useEffect(() => {
    setPinned(readNavPinnedLinks());

    const refresh = (): void => {
      setPinned(readNavPinnedLinks());
    };

    const onStorage = (event: StorageEvent): void => {
      if (event.key === NAV_PINNED_LINKS_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(NAV_PINNED_LINKS_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(NAV_PINNED_LINKS_CHANGED_EVENT, refresh);
    };
  }, []);

  const togglePin = useCallback(
    (link: NavPinnedLink) => {
      const next = toggleNavPinnedLink(pinned, link);
      setPinned(next);
      writeNavPinnedLinks(next);
      window.dispatchEvent(new Event(NAV_PINNED_LINKS_CHANGED_EVENT));
    },
    [pinned],
  );

  const isPinned = useCallback((href: string) => isNavLinkPinned(pinned, href), [pinned]);

  return { pinned, togglePin, isPinned };
}
