"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buyerCtoDemoAudienceCaption } from "@/lib/buyer/buyer-cto-demo-orchestration";
import { readBuyerCtoDemoTourActive, resolveBuyerCtoDemoTourNavigation } from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/**
 * Journey caption for CTO demo presenters (#15).
 * Renders outside the sticky header stack so it does not inflate `--app-shell-sticky`.
 */
export function CtoDemoJourneyCaptionBar(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isActive = readBuyerCtoDemoTourActive();

    setActive(isActive);

    if (isActive) {
      requestAnimationFrame(() => {
        setFaded(true);
      });
    }
  }, [pathname]);

  if (!mounted || !isBuyerPolishedOperatorShellEnv() || !active) {
    return null;
  }

  const navigation = resolveBuyerCtoDemoTourNavigation(pathname);
  const stepIndex = navigation.stepIndex ?? 0;
  const caption = buyerCtoDemoAudienceCaption(stepIndex);

  return (
    <div
      role="status"
      data-testid="cto-demo-journey-caption-bar"
      className={cn(
        OPERATOR_TYPOGRAPHY.helper,
        "border-b border-neutral-200 bg-neutral-50/80 px-4 py-1.5 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
        "transition-opacity duration-150",
        faded ? "opacity-100" : "opacity-0",
      )}
    >
      <p className={cn("m-0 truncate", OPERATOR_TYPE_SCALE.helper, "text-inherit")}>{caption}</p>
    </div>
  );
}
