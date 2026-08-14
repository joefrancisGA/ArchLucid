import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { STANDARDS_RULES_INLINE_LINK_CLASS } from "@/lib/standards-rules-table-presentation";

export type StandardsRulesPolicyPackReferenceProps = {
  readonly label: string;
  readonly href: string | null;
  readonly provenanceLabel?: string | null;
};

export function StandardsRulesPolicyPackReference(props: StandardsRulesPolicyPackReferenceProps) {
  const { label, href, provenanceLabel } = props;
  const normalizedProvenance = provenanceLabel?.trim() ?? "";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {href === null ? (
        <span>{label}</span>
      ) : (
        <Link className={STANDARDS_RULES_INLINE_LINK_CLASS} href={href}>
          {label}
        </Link>
      )}
      {normalizedProvenance.length > 0 ? (
        <StatusTag
          kind="neutral"
          label={normalizedProvenance}
          data-testid="standards-rules-policy-pack-provenance-tag"
        />
      ) : null}
    </div>
  );
}
