"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const FOCUS_TARGET_IDS: Readonly<Record<string, string>> = {
  isolation: "isolation-section",
  "data-handling": "data-handling-section",
};

/** Scrolls trust center sections into view when opened from CTO demo cheat-panel links. */
export function TrustCenterFocusScroll(): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");

  useEffect(() => {
    if (focus === null || focus.trim().length === 0) {
      return;
    }

    const targetId = FOCUS_TARGET_IDS[focus.trim()];

    if (targetId === undefined) {
      return;
    }

    const element = document.getElementById(targetId);

    if (element === null) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  return null;
}
