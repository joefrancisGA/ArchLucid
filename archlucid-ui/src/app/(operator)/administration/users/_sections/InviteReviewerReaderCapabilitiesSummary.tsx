"use client";

import { Check, X } from "lucide-react";

import {
  INVITE_REVIEWER_READER_CAPABILITIES,
  INVITE_REVIEWER_READER_CAPABILITIES_HEADING,
} from "@/lib/invite-reviewer-flow";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function InviteReviewerReaderCapabilitiesSummary(): React.JSX.Element {
  return (
    <section
      className="mt-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      aria-labelledby="invite-reviewer-reader-capabilities-heading"
      data-testid="invite-reviewer-reader-capabilities"
    >
      <h2
        id="invite-reviewer-reader-capabilities-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        {INVITE_REVIEWER_READER_CAPABILITIES_HEADING}
      </h2>
      <ul className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {INVITE_REVIEWER_READER_CAPABILITIES.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            {item.allowed ? (
              <Check className="mt-0.5 size-4 shrink-0 text-neutral-600 dark:text-neutral-400" aria-hidden />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
            )}
            <span className={item.allowed ? "text-al-text-primary" : "text-al-text-secondary"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
