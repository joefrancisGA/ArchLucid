import Link from "next/link";

import {
  PATTERN_LIBRARY_POLICY_PACKS_GUIDANCE_LEAD,
  PATTERN_LIBRARY_POLICY_PACKS_HUB_LINK_LABEL,
  PATTERN_LIBRARY_POLICY_PACKS_HUB_PATH,
  PATTERN_LIBRARY_POLICY_RULES_GUIDANCE_LEAD,
} from "@/lib/pattern-library-policy-guidance-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type PatternLibraryRelatedPolicyRulesProps = {
  readonly rules: readonly string[];
};

export function PatternLibraryRelatedPolicyRules(props: PatternLibraryRelatedPolicyRulesProps): React.JSX.Element {
  return (
    <div className="space-y-2" data-testid="pattern-library-policy-rules-guidance">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PATTERN_LIBRARY_POLICY_RULES_GUIDANCE_LEAD}</p>
      <ul className="m-0 list-disc space-y-1 pl-5">
        {props.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}

type PatternLibraryRelatedPolicyPacksProps = {
  readonly packs: readonly string[];
};

export function PatternLibraryRelatedPolicyPacks(props: PatternLibraryRelatedPolicyPacksProps): React.JSX.Element | null {
  if (props.packs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="pattern-library-policy-packs-guidance">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PATTERN_LIBRARY_POLICY_PACKS_GUIDANCE_LEAD}</p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">Related policy packs:</span>{" "}
        {props.packs.join(" · ")}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href={PATTERN_LIBRARY_POLICY_PACKS_HUB_PATH} className={OPERATOR_LINK.inline}>
          {PATTERN_LIBRARY_POLICY_PACKS_HUB_LINK_LABEL}
        </Link>
      </p>
    </div>
  );
}
