"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
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
 * Auto-surfaces a one-time tip on operator home for buyer-default shells.
 * Full architect workspace skips this coach banner — Overview already exposes Architecture workflow help.
 */
export function FirstVisitHelpAutoOpen() {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const slug = firstVisitHelpSlugForPathname(pathname);
  const isOperatorHome = pathname === "/";
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  useEffect(() => {
    if (
      fullOperatorShell ||
      !isOperatorHome ||
      slug === null ||
      isFirstVisitHelpDismissed(pathname) ||
      isFirstVisitHelpSessionDone()
    ) {
      setVisible(false);

      return;
    }

    setVisible(true);
  }, [fullOperatorShell, isOperatorHome, pathname, slug]);

  if (fullOperatorShell || !visible || slug === null || !isOperatorHome) {
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
