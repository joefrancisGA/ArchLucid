"use client";

import { Suspense } from "react";

import { SignupAccessRequestForm } from "@/components/marketing/SignupAccessRequestForm";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNUP_INVITE_ONLY_PANEL_HEADING, SIGNUP_INVITE_ONLY_PANEL_LEAD } from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

/** Shown when public self-service signup is disabled (invite-only posture). */
export function SignupAccessRequestPanel() {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-al-border-subtle bg-al-surface-raised p-6 text-left",
        MARKETING_SURFACES.card,
      )}
      data-testid="signup-access-request-panel"
    >
      <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {SIGNUP_INVITE_ONLY_PANEL_HEADING}
      </h2>
      <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        {SIGNUP_INVITE_ONLY_PANEL_LEAD}
      </p>
      <Suspense
        fallback={
          <p className={cn("mt-6 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>Loading request form…</p>
        }
      >
        <SignupAccessRequestForm />
      </Suspense>
    </div>
  );
}
