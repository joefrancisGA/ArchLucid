"use client";

import { GovernanceDryRunModal } from "@/components/GovernanceDryRunModal";

/**
 * Dry-run / what-if entry for a valid policy pack id.
 * Pack metadata, version history, and assignment surfaces are tracked separately in
 * `docs/PENDING_QUESTIONS.md` (Q37 / Q38) and will land alongside the existing `/governance` workflow page.
 */
export function PolicyPackDetailClient(props: { readonly policyPackId: string }) {
  const { policyPackId } = props;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h2 className="mt-0 text-2xl font-semibold tracking-tight">Policy pack</h2>
      <p className="mb-6 max-w-prose text-sm leading-snug text-neutral-600 dark:text-neutral-400">
        Dry-run / what-if mode lets you preview the impact of proposed threshold changes without committing them. Each
        request is captured in the audit log with its proposed payload run through the LLM-prompt redaction pipeline
        (PENDING_QUESTIONS Q37) before persistence.
      </p>

      <GovernanceDryRunModal policyPackId={policyPackId} />
    </main>
  );
}
