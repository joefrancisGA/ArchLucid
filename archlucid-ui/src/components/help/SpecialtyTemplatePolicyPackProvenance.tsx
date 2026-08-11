import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SpecialtyReviewPolicyPackReference } from "@/lib/specialty-review-templates";

export type SpecialtyTemplatePolicyPackProvenanceProps = {
  readonly policyPacks: readonly SpecialtyReviewPolicyPackReference[];
  readonly lastReviewedUtc: string;
  readonly testId?: string;
};

function formatLastReviewedLabel(lastReviewedUtc: string): string {
  const parsed = new Date(lastReviewedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return lastReviewedUtc;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Named policy-pack provenance line for specialty template cards. */
export function SpecialtyTemplatePolicyPackProvenance(
  props: SpecialtyTemplatePolicyPackProvenanceProps,
): React.ReactElement {
  const testId = props.testId ?? "specialty-template-policy-pack-provenance";

  return (
    <div data-testid={testId}>
      <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>Backed by</p>
      <ul className={cn("m-0 mt-1 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {props.policyPacks.map((pack) => (
          <li key={pack.id}>
            <Link href={pack.href} className={cn(OPERATOR_LINK.inline)}>
              {pack.label} v{pack.version}
            </Link>
          </li>
        ))}
      </ul>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.micro, "text-al-text-secondary")}>
        Pack guidance last reviewed {formatLastReviewedLabel(props.lastReviewedUtc)}.
      </p>
    </div>
  );
}
