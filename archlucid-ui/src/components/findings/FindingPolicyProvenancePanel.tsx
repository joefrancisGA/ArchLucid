import Link from "next/link";

import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/finding-policy-evidence-citations";
import { cn } from "@/lib/utils";

export type FindingPolicyProvenancePanelProps = {
  readonly model: FindingPolicyEvidenceCitationModel;
  /** Short server narrative linking evidence to the evaluated policy rule. */
  readonly traceExcerpt?: string | null;
  readonly compact?: boolean;
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
        className={cn(
          "font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-100",
          compact ? OPERATOR_TYPOGRAPHY.badge : "text-sm",
        )}
        data-testid="finding-provenance-link"
      >
        {label}
      </Link>
      {detail !== null && detail.length > 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>
          {detail}
        </p>
      ) : null}
    </li>
  );
}

/** Prominent policy pack, rule, evidence, and trace excerpt for a finding. */
export function FindingPolicyProvenancePanel(props: FindingPolicyProvenancePanelProps): ReactElement | null {
  const { model, traceExcerpt, compact = false, className } = props;
  const trimmedTrace = traceExcerpt?.trim() ?? "";
  const hasPolicyContext = model.pack !== null || model.policy !== null;

  if (!hasPolicyContext && model.evidence.length === 0 && trimmedTrace.length === 0) {
    return null;
  }

  const violationLabel =
    model.pack !== null ? `Policy violation: ${model.pack.packName}` : "Policy violation";

  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
        compact ? "p-3 space-y-2" : "p-4 space-y-3",
        className,
      )}
      aria-label="Policy provenance"
      data-testid="finding-policy-provenance-panel"
    >
      <div className="flex flex-wrap items-center gap-2">
        {hasPolicyContext ? <StatusTag kind="warning" label={violationLabel} data-testid="finding-policy-violation-tag" /> : null}
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", compact ? OPERATOR_TYPOGRAPHY.badge : "text-sm")}>
          Policy provenance
        </p>
      </div>

      {model.pack !== null ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-neutral-600 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>
            Policy pack
          </p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            <ProvenanceLink
              href={model.pack.href}
              label={model.pack.packName}
              detail={model.pack.packId !== model.pack.packName ? model.pack.packId : null}
              compact={compact}
            />
          </ul>
        </div>
      ) : null}

      {model.policy !== null ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-neutral-600 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>
            Policy rule
          </p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            <ProvenanceLink
              href={model.policy.href}
              label={model.policy.ruleLabel}
              detail={model.policy.ruleId !== model.policy.ruleLabel ? model.policy.ruleId : null}
              compact={compact}
            />
          </ul>
        </div>
      ) : null}

      {model.evidence.length > 0 ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-neutral-600 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>
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
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            View evidence trace excerpt
          </summary>
          <p
            className="m-0 border-t border-neutral-200 px-3 py-2 text-xs leading-relaxed text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
            data-testid="finding-policy-trace-excerpt"
          >
            {trimmedTrace}
          </p>
        </details>
      ) : null}
    </section>
  );
}
