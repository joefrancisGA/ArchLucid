import Link from "next/link";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/finding-policy-evidence-citations";
import { cn } from "@/lib/utils";

export type FindingPolicyEvidenceCitationLinksProps = {
  readonly model: FindingPolicyEvidenceCitationModel;
  readonly compact?: boolean;
  readonly className?: string;
};

function CitationLink(props: {
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
        data-testid="finding-citation-link"
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

/** Surfaces explicit policy rule and evidence trail links for a finding. */
export function FindingPolicyEvidenceCitationLinks(props: FindingPolicyEvidenceCitationLinksProps): ReactElement | null {
  const { model, compact = false, className } = props;

  if (model.policy === null && model.evidence.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        compact ? "space-y-2" : "space-y-3",
        className,
      )}
      aria-label="Policy and evidence citations"
      data-testid="finding-policy-evidence-citations"
    >
      <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", compact ? OPERATOR_TYPOGRAPHY.badge : "text-sm")}>
        Policy and evidence citations
      </p>

      {model.policy !== null ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-neutral-600 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>
            Policy rule
          </p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            <CitationLink
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
              <CitationLink
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
    </section>
  );
}
