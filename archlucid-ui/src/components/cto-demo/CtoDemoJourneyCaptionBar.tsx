"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buyerCtoDemoAudienceCaption } from "@/lib/buyer-cto-demo-orchestration";
import { readBuyerCtoDemoTourActive, resolveBuyerCtoDemoTourNavigation } from "@/lib/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Top caption bar summarizing the current journey screen for presenters (#15). */
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
      requestAnimationFrame(() => { setFaded(true); });
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
        "border-b border-teal-200/70 bg-teal-50/80 px-4 py-2 text-sm text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
        "transition-opacity duration-150",
        faded ? "opacity-100" : "opacity-0",
      )}
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.body)}>{caption}</p>
    </div>
  );
}
