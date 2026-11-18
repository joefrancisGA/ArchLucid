"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACKS_CATALOG_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-catalog-load-failure-partial-capture-copy";
import { cn } from "@/lib/utils";

export function PolicyPacksCatalogLoadFailurePartialHonesty(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="policy-packs-catalog-load-failure-partial-capture"
    >
      {POLICY_PACKS_CATALOG_LOAD_FAILURE_PARTIAL_CAPTURE_LINE}
    </p>
  );
}