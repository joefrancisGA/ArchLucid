"use client";

import type { JSX } from "react";

import {
  buildItsmOutboundTriadClarity,
  type ItsmOutboundTriadClarityModel,
} from "@/lib/itsm-outbound-triad-clarity";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ItsmOutboundTriadClarityStripProps = {
  /** Compact one-line strip (default) vs fuller why-three explanation with job cards. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildItsmOutboundTriadClarity}. */
  readonly model?: ItsmOutboundTriadClarityModel;
};

/**
 * TB-2236 — Compact clarity strip for the ITSM outbound triad on a finding.
 * Vocabulary only — does not invent new API.
 */
export function ItsmOutboundTriadClarityStrip(
  props: ItsmOutboundTriadClarityStripProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildItsmOutboundTriadClarity();

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="itsm-outbound-triad-clarity"
        data-variant="compact"
      >
        {model.compactLine}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="itsm-outbound-triad-clarity-heading"
      data-testid="itsm-outbound-triad-clarity"
      data-variant="full"
    >
      <h2
        id="itsm-outbound-triad-clarity-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {model.jobs.map((job) => (
          <div
            key={job.id}
            className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            data-testid={`itsm-outbound-triad-clarity-job-${job.id}`}
          >
            <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}>
              {job.label}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {job.whenToUse}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
