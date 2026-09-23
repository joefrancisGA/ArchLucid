"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY } from "@/lib/role-shaped-nav-density";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRoleNavDensityShowFullNavOpenFromSearch,
  roleNavDensityShowFullNavDisclosureHrefFromSearch,
} from "@/lib/sidebar-nav/role-nav-density-show-full-nav-disclosure-url";

function readShowFullNavFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeShowFullNavToStorage(showFullNav: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY, showFullNav ? "true" : "false");
  } catch {
    // Ignore quota / private-mode failures — density falls back to collapsed defaults.
  }
}

/** Persists the sidebar “Show all destinations” escape hatch for role-shaped nav density (TB-2139). */
export function useRoleNavDensityExpanded(): {
  readonly showFullNav: boolean;
  readonly setShowFullNav: (value: boolean) => void;
  readonly toggleShowFullNav: () => void;
} {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const roleNavDensityShowFullNavOpenParam = searchParams.get("roleNavDensityShowFullNavOpen");
  const [showFullNav, setShowFullNavState] = useState(false);

  const syncShowFullNavToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        roleNavDensityShowFullNavDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  useEffect(() => {
    setShowFullNavState((current) => {
      const fromUrl = parseRoleNavDensityShowFullNavOpenFromSearch(roleNavDensityShowFullNavOpenParam);

      if (roleNavDensityShowFullNavOpenParam !== null) {
        return current === fromUrl ? current : fromUrl;
      }

      const fromStorage = readShowFullNavFromStorage();

      return current === fromStorage ? current : fromStorage;
    });
  }, [roleNavDensityShowFullNavOpenParam]);

  const setShowFullNav = useCallback(
    (value: boolean) => {
      if (value === showFullNav) {
        return;
      }

      setShowFullNavState(value);
      writeShowFullNavToStorage(value);
      syncShowFullNavToUrl(value);
    },
    [showFullNav, syncShowFullNavToUrl],
  );

  const toggleShowFullNav = useCallback(() => {
    setShowFullNav(!showFullNav);
  }, [setShowFullNav, showFullNav]);

  return {
    showFullNav,
    setShowFullNav,
    toggleShowFullNav,
  };
}
