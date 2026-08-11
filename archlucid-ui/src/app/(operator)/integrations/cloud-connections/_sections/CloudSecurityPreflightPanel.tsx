"use client";

import { cn } from "@/lib/utils";

import type { CloudSecurityPreflightTopic } from "@/lib/cloud-security-preflight-topics";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CloudSecurityPreflightPanelProps = {
  readonly topics: readonly CloudSecurityPreflightTopic[];
  readonly providerLabel: string;
};

/** Read-only security review checklist — not a persisted attestation control. */
export function CloudSecurityPreflightPanel(props: CloudSecurityPreflightPanelProps) {
  const { topics, providerLabel } = props;

  return (
    <section
      className="space-y-4"
      data-testid="cloud-security-preflight"
      aria-label={`${providerLabel} security preflight checklist`}
    >
      <ul className="space-y-4">
        {topics.map((topic) => (
          <li key={topic.id} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{topic.label}</p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{topic.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type CloudSecurityPreflightTechnicalDetailsProps = {
  readonly children: React.ReactNode;
};

/** Collapsed implementation notes — provider-specific technical content only. */
export function CloudSecurityPreflightTechnicalDetails(props: CloudSecurityPreflightTechnicalDetailsProps) {
  return (
    <details className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Technical details
      </summary>
      <div className={cn("mt-2 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.children}</div>
    </details>
  );
}
