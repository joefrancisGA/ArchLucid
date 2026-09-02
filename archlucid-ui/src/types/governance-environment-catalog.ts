import type { components } from "@/lib/openapi-schemas";

type GovernanceEnvironmentDefinitionSchema = components["schemas"]["GovernanceEnvironmentDefinition"];

export type GovernanceEnvironmentDefinition = GovernanceEnvironmentDefinitionSchema &
  Required<Pick<GovernanceEnvironmentDefinitionSchema, "slug" | "displayName" | "sortOrder" | "isActive">>;

type GovernanceEnvironmentTransitionSchema = components["schemas"]["GovernanceEnvironmentTransition"];

export type GovernanceEnvironmentTransition = GovernanceEnvironmentTransitionSchema &
  Required<Pick<GovernanceEnvironmentTransitionSchema, "sourceSlug" | "targetSlug">>;

type GovernanceEnvironmentCatalogSchema = components["schemas"]["GovernanceEnvironmentCatalog"];

export type GovernanceEnvironmentCatalog = Omit<
  GovernanceEnvironmentCatalogSchema,
  "environments" | "transitions"
> &
  Required<Pick<GovernanceEnvironmentCatalogSchema, "isAdministratorConfigured">> & {
    environments: GovernanceEnvironmentDefinition[];
    transitions: GovernanceEnvironmentTransition[];
  };

export type ReplaceGovernanceEnvironmentCatalogRequest =
  components["schemas"]["ReplaceGovernanceEnvironmentCatalogRequest"];
