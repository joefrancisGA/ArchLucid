"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_SHOW_ADMINISTRATION = "archlucid_nav_show_administration";

function readBooleanStorage(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) {
      return defaultValue;
    }

    return raw === "1";
  } catch {
    return defaultValue;
  }
}

function writeBooleanStorage(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* private mode */
  }
}

/** Platform-admin sidebar section visibility — independent from operate governance disclosure. */
export function useSidebarAdministrationVisibility(): {
  showAdministration: boolean;
  setShowAdministration: (value: boolean) => void;
} {
  const [showAdministration, setShowAdministrationState] = useState(false);

  useEffect(() => {
    setShowAdministrationState(readBooleanStorage(STORAGE_SHOW_ADMINISTRATION, false));
  }, []);

  const setShowAdministration = useCallback((value: boolean) => {
    setShowAdministrationState(value);
    writeBooleanStorage(STORAGE_SHOW_ADMINISTRATION, value);
  }, []);

  return {
    showAdministration,
    setShowAdministration,
  };
}
