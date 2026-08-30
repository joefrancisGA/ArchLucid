export type GovernanceEnvironmentDefinition = {
  slug: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
};

export type GovernanceEnvironmentTransition = {
  sourceSlug: string;
  targetSlug: string;
};

export type GovernanceEnvironmentCatalog = {
  environments: GovernanceEnvironmentDefinition[];
  transitions: GovernanceEnvironmentTransition[];
};

export type ReplaceGovernanceEnvironmentCatalogRequest = {
  environments: GovernanceEnvironmentDefinition[];
  transitions: GovernanceEnvironmentTransition[];
};
