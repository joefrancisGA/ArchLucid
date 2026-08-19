"use client";

import { useCallback, useEffect, useState } from "react";

import { ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY } from "@/lib/role-shaped-nav-density";

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
  const [showFullNav, setShowFullNavState] = useState(false);

  useEffect(() => {
    setShowFullNavState(readShowFullNavFromStorage());
  }, []);

  const setShowFullNav = useCallback((value: boolean) => {
    setShowFullNavState(value);
    writeShowFullNavToStorage(value);
  }, []);

  const toggleShowFullNav = useCallback(() => {
    setShowFullNav(!showFullNav);
  }, [setShowFullNav, showFullNav]);

  return {
    showFullNav,
    setShowFullNav,
    toggleShowFullNav,
  };
}
