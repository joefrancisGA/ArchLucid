"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import {
  CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO,
  CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_SKIP_WARNING,
} from "@/lib/cloud-connections-copy";
import type { CloudSecurityPreflightTopic } from "@/lib/cloud-security-preflight-topics";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CloudSecurityPreflightDisposition = "confirmed" | "not-applicable" | "needs-review" | "unset";

export type CloudSecurityPreflightPanelProps = {
  readonly topics: readonly CloudSecurityPreflightTopic[];
  readonly providerLabel: string;
  readonly allowProceedWithoutFullConfirmation?: boolean;
  readonly onDispositionChange?: (dispositions: Readonly<Record<string, CloudSecurityPreflightDisposition>>) => void;
};

function createInitialDispositions(
  topics: readonly CloudSecurityPreflightTopic[],
): Record<string, CloudSecurityPreflightDisposition> {
  return Object.fromEntries(topics.map((topic) => [topic.id, "unset"]));
}

export function CloudSecurityPreflightPanel(props: CloudSecurityPreflightPanelProps) {
  const { topics, providerLabel, allowProceedWithoutFullConfirmation = true, onDispositionChange } = props;
  const [dispositions, setDispositions] = useState<Record<string, CloudSecurityPreflightDisposition>>(() =>
    createInitialDispositions(topics),
  );

  const allConfirmedOrNa = useMemo(
    () => topics.every((topic) => {
      const value = dispositions[topic.id];

      return value === "confirmed" || value === "not-applicable";
    }),
    [dispositions, topics],
  );

  const setDisposition = (topicId: string, value: CloudSecurityPreflightDisposition) => {
    setDispositions((current) => {
      const next = { ...current, [topicId]: value };
      onDispositionChange?.(next);

      return next;
    });
  };

  return (
    <section className="space-y-4" data-testid="cloud-security-preflight" aria-labelledby="cloud-security-preflight-heading">
      <div>
        <h3 id="cloud-security-preflight-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Security preflight
        </h3>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO}</p>
      </div>

      <ul className="space-y-4">
        {topics.map((topic) => (
          <li key={topic.id} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{topic.label}</p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{topic.detail}</p>
            <fieldset className="mt-3">
              <legend className="sr-only">{`${providerLabel} — ${topic.label} disposition`}</legend>
              <div className="flex flex-wrap gap-3">
                {(["confirmed", "not-applicable", "needs-review"] as const).map((option) => (
                  <label key={option} className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
                    <input
                      type="radio"
                      name={`preflight-${topic.id}`}
                      checked={dispositions[topic.id] === option}
                      onChange={() => setDisposition(topic.id, option)}
                    />
                    <span>
                      {option === "confirmed" ? "Confirmed" : option === "not-applicable" ? "Not applicable" : "Needs review"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>

      {!allConfirmedOrNa && allowProceedWithoutFullConfirmation ? (
        <p className={cn("m-0 rounded-md border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
          {CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_SKIP_WARNING}
        </p>
      ) : null}
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
