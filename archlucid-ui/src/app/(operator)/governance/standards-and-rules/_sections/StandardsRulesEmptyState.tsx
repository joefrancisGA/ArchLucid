"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveStandardsRulesEmptyCompact } from "@/lib/enterprise-compact-empty-state-presets-governance";
import { STANDARDS_RULES_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/standards-rules-catalog-empty-not-load-failure-copy";
import { StandardsRulesCatalogEmptyPartialHonesty } from "@/app/(operator)/governance/standards-and-rules/_sections/StandardsRulesCatalogEmptyPartialHonesty";
import { cn } from "@/lib/utils";

export function StandardsRulesEmptyState() {
  const { productLine } = useProductLine();
  const preset = resolveStandardsRulesEmptyCompact(productLine);

  return (
    <EnterpriseCompactEmptyState
      {...preset}
      footer={
        <div className="space-y-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="standards-rules-catalog-empty-not-load-failure">
            {STANDARDS_RULES_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE}
          </p>
          <StandardsRulesCatalogEmptyPartialHonesty />
        </div>
      }
    />
  );
}
