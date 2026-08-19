"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { OnboardingStartClient } from "@/components/OnboardingStartClient";
import { GETTING_STARTED_TRIAL_POST_REGISTRATION_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readLastRegistrationPayload } from "@/lib/registration-session";

export type GettingStartedTrialSectionProps = {
  fromRegistrationQuery: boolean;
};

/**
 * Trial status + sample run handoff: shown after signup (`?source=registration`) or while registration
 * scope is still in session (same heuristics as the former `/onboarding/start` page).
 */
export function GettingStartedTrialSection({ fromRegistrationQuery }: GettingStartedTrialSectionProps) {
  const [fromSession, setFromSession] = useState(false);

  useEffect(() => {
    if (fromRegistrationQuery) return;

    if (readLastRegistrationPayload() !== null) setFromSession(true);
  }, [fromRegistrationQuery]);

  if (!fromRegistrationQuery && !fromSession) return null;

  return (
    <div className="mb-8" data-testid="getting-started-trial-section">
      {fromRegistrationQuery ? (
        <p className={cn("mb-6 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {GETTING_STARTED_TRIAL_POST_REGISTRATION_LEAD}
        </p>
      ) : null}
      <OnboardingStartClient />
    </div>
  );
}
