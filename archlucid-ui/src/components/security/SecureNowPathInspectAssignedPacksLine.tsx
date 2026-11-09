"use client";

import Link from "next/link";

import { useEffectivePolicyPacksQuery } from "@/hooks/use-effective-policy-packs-query";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import {
  SECURENOW_COMPLIANCE_NOTES_EXPECTATION_KEYS_LEAD,
  SECURENOW_COMPLIANCE_NOTES_PACKS,
} from "@/lib/product-line/securenow-compliance-notes-copy";
import { cn } from "@/lib/utils";
import type { ResolvedPolicyPack } from "@/types/policy-packs";

function packNamesFromEffectiveSet(packs: readonly ResolvedPolicyPack[] | undefined): readonly string[] {
  if (packs === undefined) {
    return [];
  }

  const names = packs
    .map((pack) => pack.name?.trim() ?? "")
    .filter((name) => name.length > 0);

  return [...new Set(names)];
}

/** WK-21 honesty plus assigned pack names when the effective set loads. */
export function SecureNowPathInspectAssignedPacksLine(): React.JSX.Element {
  const query = useEffectivePolicyPacksQuery();
  const assignedNames = packNamesFromEffectiveSet(query.data?.packs);
  const displayNames = assignedNames.length > 0 ? assignedNames : SECURENOW_COMPLIANCE_NOTES_PACKS;

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-path-inspect-assigned-packs">
      {SECURENOW_COMPLIANCE_NOTES_EXPECTATION_KEYS_LEAD}{" "}
      {query.isPending ? (
        <span>Loading assigned packs…</span>
      ) : query.isError ? (
        <span>Assigned packs unavailable — showing fixture pack names.</span>
      ) : (
        <span>
          Assigned packs on this scope: {displayNames.join(", ")}.
        </span>
      )}{" "}
      <Link className={OPERATOR_LINK.inline} href={SECURENOW_STANDARDS_AND_RULES_PATH}>
        Standards and rules
      </Link>
    </p>
  );
}
