"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  dispatchOnboardingTourStart,
  hasConsumedRegistrationTourAutoStart,
  markRegistrationTourAutoStartConsumed,
  shouldAutoStartRegistrationTour,
} from "@/lib/usability/onboarding-registration-tour";
import { readOnboardingTourCompleted } from "@/lib/onboarding-tour";

/** Auto-starts the onboarding tour once after registration verify lands on Home or onboarding. */
export function RegistrationOnboardingTourAutoStart() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/" && !pathname.startsWith("/onboarding")) {
      return;
    }

    const search = searchParams?.toString() ?? "";

    if (!shouldAutoStartRegistrationTour(search.length > 0 ? `?${search}` : "")) {
      return;
    }

    if (hasConsumedRegistrationTourAutoStart() || readOnboardingTourCompleted()) {
      return;
    }

    markRegistrationTourAutoStartConsumed();

    const timer = window.setTimeout(() => {
      dispatchOnboardingTourStart();
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return null;
}
