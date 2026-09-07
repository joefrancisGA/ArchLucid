import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { PRODUCT_LINE_LABELS } from "@/lib/product-line/product-line-copy";

export type ProductLinePlaygroundEnvSummary = {
  readonly buildEnvProductLine: ProductLineId;
  readonly cookieProductLine: ProductLineId | null;
  readonly activeProductLine: ProductLineId;
  readonly assignmentOverrideCount: number;
};

export function countProductLineAssignmentOverrides(
  overrides: Readonly<Record<string, unknown>>,
): number {
  return Object.keys(overrides).length;
}

export function formatProductLinePlaygroundBuildEnvLabel(productLine: ProductLineId): string {
  return `Build env (NEXT_PUBLIC_ARCHLUCID_PRODUCT): ${PRODUCT_LINE_LABELS[productLine]}`;
}

export function formatProductLinePlaygroundCookieLabel(cookieProductLine: ProductLineId | null): string {
  if (cookieProductLine === null) {
    return "Cookie override: none (using build env)";
  }

  return `Cookie override: ${PRODUCT_LINE_LABELS[cookieProductLine]}`;
}

export function formatProductLinePlaygroundActiveShellLabel(activeProductLine: ProductLineId): string {
  return `Active shell: ${PRODUCT_LINE_LABELS[activeProductLine]}`;
}

export function formatProductLinePlaygroundOverrideCountLabel(overrideCount: number): string {
  if (overrideCount === 0) {
    return "Href overrides: none (catalog defaults only)";
  }

  return `Href overrides: ${overrideCount} in localStorage`;
}

export function buildProductLinePlaygroundEnvSummary(input: {
  readonly buildEnvProductLine: ProductLineId;
  readonly cookieProductLine: ProductLineId | null;
  readonly activeProductLine: ProductLineId;
  readonly assignmentOverrides: Readonly<Record<string, unknown>>;
}): ProductLinePlaygroundEnvSummary {
  return {
    buildEnvProductLine: input.buildEnvProductLine,
    cookieProductLine: input.cookieProductLine,
    activeProductLine: input.activeProductLine,
    assignmentOverrideCount: countProductLineAssignmentOverrides(input.assignmentOverrides),
  };
}
