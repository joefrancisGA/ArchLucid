"use client";

import Link from "next/link";
import { Suspense } from "react";

import { SignupAccessRequestForm } from "@/components/marketing/SignupAccessRequestForm";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SIGNUP_INVITE_ONLY_OUTCOMES,
  SIGNUP_INVITE_ONLY_PANEL_HEADING,
  SIGNUP_INVITE_ONLY_PANEL_LEAD,
} from "@/lib/signup-invite-only-copy";
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
      <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
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
      <ul className={cn("mt-6 list-none space-y-2 border-t border-al-border-subtle pt-4 p-0", MARKETING_TYPOGRAPHY.body)}>
        {SIGNUP_INVITE_ONLY_OUTCOMES.map((outcome) => (
          <li key={outcome.label}>
            <span className="font-medium text-al-text-primary">{outcome.label}. </span>
            <span className="text-al-text-secondary">{outcome.detail}</span>
          </li>
        ))}
        <li>
          <span className="font-medium text-al-text-primary">Inspect first. </span>
          <span className="text-al-text-secondary">
            <Link href="/see-it" className={MARKETING_SURFACES.inlineLink}>
              See a sample review
            </Link>{" "}
            with no account required while your request is reviewed.
          </span>
        </li>
      </ul>
    </div>
  );
}
