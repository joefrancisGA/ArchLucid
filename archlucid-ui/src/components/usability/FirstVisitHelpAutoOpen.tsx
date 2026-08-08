"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import {
  dismissFirstVisitHelp,
  firstVisitHelpSlugForPathname,
  isFirstVisitHelpDismissed,
  isFirstVisitHelpSessionDone,
  markFirstVisitHelpSessionDone,
} from "@/lib/usability/first-visit-help";
import { FIRST_VISIT_HELP_THREE_THINGS } from "@/lib/onboarding-secondary-surfaces";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/**
 * Auto-surfaces a one-time tip on operator home.
 * Deep-link CTA is omitted — Overview already exposes Architecture workflow via PageContextualHelpButton.
 */
export function FirstVisitHelpAutoOpen() {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const slug = firstVisitHelpSlugForPathname(pathname);
  const isOperatorHome = pathname === "/";

  useEffect(() => {
    if (!isOperatorHome || slug === null || isFirstVisitHelpDismissed(pathname) || isFirstVisitHelpSessionDone()) {
      setVisible(false);

      return;
    }

    setVisible(true);
  }, [isOperatorHome, pathname, slug]);

  if (!visible || slug === null || !isOperatorHome) {
    return null;
  }

  function close(): void {
    dismissFirstVisitHelp(pathname);
    markFirstVisitHelpSessionDone();
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-700",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="note"
      data-testid="first-visit-help-auto-open"
    >
      <p className="m-0 text-al-text-primary">
        <span className="font-medium">3 things to know:</span> {FIRST_VISIT_HELP_THREE_THINGS}
      </p>
      <DismissControl variant="outline" onDismiss={close} />
    </div>
  );
}
