import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import type { ReactElement } from "react";

import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { StatusTag } from "@/components/ui/status-tag";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/findings/finding-policy-evidence-citations";

export type FindingPolicyProvenancePanelProps = {
  readonly model: FindingPolicyEvidenceCitationModel;
  /** Short server narrative linking evidence to the evaluated policy rule. */
  readonly traceExcerpt?: string | null;
  readonly compact?: boolean;
  readonly variant?: "default" | "prominent";
  readonly className?: string;
};

function ProvenanceLink(props: {
  readonly href: string;
  readonly label: string;
  readonly detail: string | null;
  readonly compact: boolean;
}): ReactElement {
  const { href, label, detail, compact } = props;

  return (
    <li className="m-0">
      <Link
        href={href}
        className={compact ? cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.badge) : OPERATOR_BODY_INLINE_LINK_CLASS}
        data-testid="finding-provenance-link"
      >
        {label}
      </Link>
      {detail !== null && detail.length > 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", compact ? OPERATOR_TYPOGRAPHY.badge : OPERATOR_TYPOGRAPHY.helper)}>
          {detail}
        </p>
      ) : null}
    </li>
  );
}

/** Prominent policy pack, rule, evidence, and trace excerpt for a finding. */
export function FindingPolicyProvenancePanel(props: FindingPolicyProvenancePanelProps): ReactElement | null {
  const { model, traceExcerpt, compact = false, variant = "default", className } = props;
  const trimmedTrace = traceExcerpt?.trim() ?? "";
  const hasPolicyContext = model.pack !== null || model.policy !== null;
  const prominent = variant === "prominent";

  if (!hasPolicyContext && model.evidence.length === 0 && trimmedTrace.length === 0) {
    return null;
  }

  const violationLabel =
    model.pack !== null ? `Policy violation: ${model.pack.packName}` : "Policy violation";

  const headingLabel = prominent ? "Triggered by policy" : "Policy provenance";

  return (
    <section
      className={cn(
        prominent
          ? "rounded-lg border border-teal-300/80 bg-teal-50/90 dark:border-teal-800 dark:bg-teal-950/30"
          : "rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
        compact ? "p-3 space-y-2" : "p-4 space-y-3",
        className,
      )}
      aria-label="Policy provenance"
      data-testid="finding-policy-provenance-panel"
    >
      <div className="flex flex-wrap items-center gap-2">
        {hasPolicyContext ? (
          <StatusTag kind="needs-attention" label={violationLabel} data-testid="finding-policy-violation-tag" />
        ) : null}
        <p
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            compact ? OPERATOR_TYPOGRAPHY.badge : OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {headingLabel}
        </p>
      </div>

      {hasPolicyContext ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-neutral-600 dark:text-neutral-400", compact ? OPERATOR_TYPOGRAPHY.badge : OPERATOR_TYPOGRAPHY.helper)}>
            Policy pack and rule
          </p>
          <FindingPolicyTraceabilityBadges pack={model.pack} policy={model.policy} />
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", compact ? OPERATOR_TYPOGRAPHY.badge : OPERATOR_TYPOGRAPHY.helper)}>
            {prominent
              ? "This finding exists because the policy rule evaluated your architecture evidence. Select a badge to preview rule text."
              : "Select a badge to preview the rule text without leaving this review."}
          </p>
        </div>
      ) : null}

      {model.evidence.length > 0 ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-neutral-600 dark:text-neutral-400", compact ? OPERATOR_TYPOGRAPHY.badge : OPERATOR_TYPOGRAPHY.helper)}>
            Evidence
          </p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {model.evidence.map((row) => (
              <ProvenanceLink
                key={`${row.href}:${row.label}:${row.detail ?? ""}`}
                href={row.href}
                label={row.label}
                detail={row.detail}
                compact={compact}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {trimmedTrace.length > 0 ? (
        <details className="rounded-md border border-neutral-200 bg-white/80 dark:border-neutral-700 dark:bg-neutral-950/50">
          <summary className={cn("cursor-pointer select-none px-3 py-2 font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            View evidence trace excerpt
          </summary>
          <p
            className={cn("m-0 border-t border-neutral-200 px-3 py-2 leading-relaxed text-neutral-700 dark:border-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="finding-policy-trace-excerpt"
          >
            {trimmedTrace}
          </p>
        </details>
      ) : null}
    </section>
  );
}
