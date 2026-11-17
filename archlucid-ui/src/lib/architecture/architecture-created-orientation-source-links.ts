import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  findingsPathForProductLine,
  remapGovernanceOperatorHref,
} from "@/lib/product-line/securenow-compliance-routes";

export type ArchitectureCreatedOrientationSourceLink = {
  readonly label: string;
  readonly href: string;
};

const FINDINGS_QUEUE_SOURCE_LABEL = "Findings queue" as const;

/** Remaps create-home orientation Sources findings queue (and related governance hubs) for SecureNow. */
export function remapArchitectureCreatedOrientationSources<T extends ArchitectureCreatedOrientationSourceLink>(
  sources: readonly T[],
  productLine: ProductLineId,
): readonly T[] {
  if (productLine === "architecture") {
    return sources;
  }

  return sources.map((source) => {
    if (source.label === FINDINGS_QUEUE_SOURCE_LABEL) {
      return { ...source, href: findingsPathForProductLine(productLine) };
    }

    return { ...source, href: remapGovernanceOperatorHref(source.href, productLine) };
  });
}
