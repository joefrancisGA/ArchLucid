import type {
  GovernanceEnvironmentCatalog,
  GovernanceEnvironmentDefinition,
} from "@/types/governance-environment-catalog";

export type GovernanceEnvironmentOption = {
  value: string;
  label: string;
};

/** Maps catalog definitions to select options, preserving administrator display names. */
export function governanceEnvironmentOptionsFromCatalog(
  catalog: GovernanceEnvironmentCatalog | undefined,
): GovernanceEnvironmentOption[] {
  if (catalog === undefined) {
    return [];
  }

  return catalog.environments
    .filter((environment) => environment.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((environment) => ({
      value: environment.slug,
      label: environment.displayName,
    }));
}

/** Allowed target slugs for a selected source environment. */
export function governanceAllowedTargetSlugs(
  catalog: GovernanceEnvironmentCatalog | undefined,
  sourceSlug: string,
): string[] {
  if (catalog === undefined || sourceSlug.trim().length === 0) {
    return [];
  }

  return catalog.transitions
    .filter((transition) => transition.sourceSlug === sourceSlug)
    .map((transition) => transition.targetSlug);
}

export function governanceEnvironmentPairDisplayFromCatalog(
  catalog: GovernanceEnvironmentCatalog | undefined,
  source: string,
  target: string,
): string {
  const options = governanceEnvironmentOptionsFromCatalog(catalog);
  const src = options.find((option) => option.value === source)?.label ?? source;
  const tgt = options.find((option) => option.value === target)?.label ?? target;

  return `${src} → ${tgt}`;
}

export function governanceEnvironmentLabel(
  catalog: GovernanceEnvironmentCatalog | undefined,
  slug: string,
): string {
  const match = catalog?.environments.find((environment) => environment.slug === slug);

  return match?.displayName ?? slug;
}

export function isGovernanceEnvironmentTransitionAllowed(
  catalog: GovernanceEnvironmentCatalog | undefined,
  sourceSlug: string,
  targetSlug: string,
): boolean {
  if (catalog === undefined) {
    return false;
  }

  return catalog.transitions.some(
    (transition) => transition.sourceSlug === sourceSlug && transition.targetSlug === targetSlug,
  );
}

export function nextGovernanceEnvironmentSortOrder(environments: GovernanceEnvironmentDefinition[]): number {
  if (environments.length === 0) {
    return 0;
  }

  return Math.max(...environments.map((environment) => environment.sortOrder)) + 1;
}
