"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { resolveStandardsRulesEmptyCompact } from "@/lib/enterprise-compact-empty-state-presets-governance";

export function StandardsRulesEmptyState() {
  const { productLine } = useProductLine();

  return <EnterpriseCompactEmptyState {...resolveStandardsRulesEmptyCompact(productLine)} />;
}
