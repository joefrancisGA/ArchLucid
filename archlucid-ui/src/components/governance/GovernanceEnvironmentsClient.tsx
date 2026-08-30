"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { replaceGovernanceEnvironmentCatalog } from "@/lib/api/policy-governance-api";
import {
  GOVERNANCE_ENVIRONMENTS_PAGE_SUBTITLE,
  GOVERNANCE_ENVIRONMENTS_PAGE_TITLE,
  GOVERNANCE_ENVIRONMENTS_PATH,
} from "@/lib/governance/governance-environments-route";
import {
  governanceEnvironmentOptionsFromCatalog,
  isGovernanceEnvironmentTransitionAllowed,
  nextGovernanceEnvironmentSortOrder,
} from "@/lib/governance/governance-environment-catalog-helpers";
import {
  governanceEnvironmentCatalogQueryKey,
  useGovernanceEnvironmentCatalogQuery,
} from "@/hooks/use-governance-environment-catalog-query";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { showError, showSuccess } from "@/lib/toast";
import type {
  GovernanceEnvironmentCatalog,
  GovernanceEnvironmentDefinition,
  GovernanceEnvironmentTransition,
} from "@/types/governance-environment-catalog";
import { whyDisabledNeedsRole } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

function cloneCatalog(catalog: GovernanceEnvironmentCatalog): GovernanceEnvironmentCatalog {
  return {
    isAdministratorConfigured: catalog.isAdministratorConfigured,
    environments: catalog.environments.map((environment) => ({ ...environment })),
    transitions: catalog.transitions.map((transition) => ({ ...transition })),
  };
}

function toggleTransition(
  transitions: GovernanceEnvironmentTransition[],
  sourceSlug: string,
  targetSlug: string,
  enabled: boolean,
): GovernanceEnvironmentTransition[] {
  const withoutEdge = transitions.filter(
    (transition) => !(transition.sourceSlug === sourceSlug && transition.targetSlug === targetSlug),
  );

  if (!enabled) {
    return withoutEdge;
  }

  return [...withoutEdge, { sourceSlug, targetSlug }];
}

export default function GovernanceEnvironmentsClient() {
  const canMutate = useOperateCapability();
  const queryClient = useQueryClient();
  const catalogQuery = useGovernanceEnvironmentCatalogQuery();
  const [draft, setDraft] = useState<GovernanceEnvironmentCatalog | null>(null);

  useEffect(() => {
    if (catalogQuery.data !== undefined) {
      setDraft(cloneCatalog(catalogQuery.data));
    }
  }, [catalogQuery.data]);

  const saveMutation = useMutation({
    mutationFn: replaceGovernanceEnvironmentCatalog,
    onSuccess: async (saved) => {
      queryClient.setQueryData(governanceEnvironmentCatalogQueryKey, saved);
      setDraft(cloneCatalog(saved));
      showSuccess("Approval environments saved.");
    },
    onError: (error: unknown) => {
      showError(error instanceof Error ? error.message : "Could not save approval environments.");
    },
  });

  const activeEnvironments = useMemo(
    () => (draft?.environments ?? []).filter((environment) => environment.isActive),
    [draft],
  );

  const validationMessage = useMemo(() => {
    if (draft === null) {
      return null;
    }

    if (draft.environments.length === 0) {
      return "Add at least one environment.";
    }

    for (const environment of draft.environments) {
      if (environment.slug.trim().length === 0) {
        return "Every environment needs a slug.";
      }

      if (environment.displayName.trim().length === 0) {
        return `Display name is required for '${environment.slug}'.`;
      }
    }

    if (draft.transitions.length === 0) {
      return "Define at least one allowed transition.";
    }

    return null;
  }, [draft]);

  const updateEnvironment = useCallback(
    (index: number, patch: Partial<GovernanceEnvironmentDefinition>) => {
      setDraft((current) => {
        if (current === null) {
          return current;
        }

        const environments = current.environments.map((environment, environmentIndex) =>
          environmentIndex === index ? { ...environment, ...patch } : environment,
        );

        return { ...current, environments };
      });
    },
    [],
  );

  const addEnvironment = useCallback(() => {
    setDraft((current) => {
      const environments = current?.environments ?? [];

      return {
        environments: [
          ...environments,
          {
            slug: "",
            displayName: "",
            sortOrder: nextGovernanceEnvironmentSortOrder(environments),
            isActive: true,
          },
        ],
        transitions: current?.transitions ?? [],
      };
    });
  }, []);

  const removeEnvironment = useCallback((slug: string) => {
    setDraft((current) => {
      if (current === null) {
        return current;
      }

      return {
        environments: current.environments.filter((environment) => environment.slug !== slug),
        transitions: current.transitions.filter(
          (transition) => transition.sourceSlug !== slug && transition.targetSlug !== slug,
        ),
      };
    });
  }, []);

  const setTransitionEnabled = useCallback((sourceSlug: string, targetSlug: string, enabled: boolean) => {
    setDraft((current) => {
      if (current === null) {
        return current;
      }

      return {
        ...current,
        transitions: toggleTransition(current.transitions, sourceSlug, targetSlug, enabled),
      };
    });
  }, []);

  if (catalogQuery.isError) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4" data-testid="governance-environments-page">
        <OperatorSectionLoadFailure
          message="Could not load approval environments."
          onRetry={() => {
            void catalogQuery.refetch();
          }}
        />
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4" data-testid="governance-environments-page">
      <OperatorPageHeader
        navHref={GOVERNANCE_ENVIRONMENTS_PATH}
        title={GOVERNANCE_ENVIRONMENTS_PAGE_TITLE}
        subtitle={GOVERNANCE_ENVIRONMENTS_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton />}
      />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Environment slots</CardTitle>
          <CardDescription>
            Slugs are stored on approval requests. Display names appear in the approval queue dropdowns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(draft?.environments ?? []).map((environment, index) => (
            <div
              key={`${environment.slug}-${index}`}
              className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800 md:grid-cols-[1fr_1fr_auto_auto]"
              data-testid={`governance-environment-row-${index}`}
            >
              <div className="grid gap-2">
                <Label htmlFor={`gov-env-slug-${index}`}>Slug</Label>
                <Input
                  id={`gov-env-slug-${index}`}
                  value={environment.slug}
                  disabled={!canMutate}
                  onChange={(event) => updateEnvironment(index, { slug: event.target.value })}
                  placeholder="e.g. staging"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`gov-env-display-${index}`}>Display name</Label>
                <Input
                  id={`gov-env-display-${index}`}
                  value={environment.displayName}
                  disabled={!canMutate}
                  onChange={(event) => updateEnvironment(index, { displayName: event.target.value })}
                  placeholder="e.g. Staging"
                />
              </div>
              <div className="flex items-end gap-2">
                <Checkbox
                  id={`gov-env-active-${index}`}
                  checked={environment.isActive}
                  disabled={!canMutate}
                  onCheckedChange={(checked) => updateEnvironment(index, { isActive: checked === true })}
                />
                <Label htmlFor={`gov-env-active-${index}`}>Active</Label>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canMutate}
                  onClick={() => removeEnvironment(environment.slug)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={!canMutate} onClick={addEnvironment}>
            Add environment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Allowed transitions</CardTitle>
          <CardDescription>
            Check the transitions approvers may request. Each row is a source environment; each column is a permitted target.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activeEnvironments.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Add at least one active environment to configure transitions.
            </p>
          ) : (
            <table className="min-w-full border-collapse text-left" data-testid="governance-environment-transition-matrix">
              <thead>
                <tr>
                  <th className={cn("border-b border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
                    Source \ Target
                  </th>
                  {activeEnvironments.map((environment) => (
                    <th
                      key={environment.slug}
                      className={cn("border-b border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
                    >
                      {environment.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeEnvironments.map((source) => (
                  <tr key={source.slug}>
                    <th
                      scope="row"
                      className={cn("border-b border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
                    >
                      {source.displayName}
                    </th>
                    {activeEnvironments.map((target) => {
                      const isSelf = source.slug === target.slug;
                      const enabled = isGovernanceEnvironmentTransitionAllowed(draft ?? undefined, source.slug, target.slug);

                      return (
                        <td key={`${source.slug}-${target.slug}`} className="border-b border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">
                          {isSelf ? (
                            <span className="text-al-text-secondary">—</span>
                          ) : (
                            <Checkbox
                              aria-label={`Allow ${source.displayName} to ${target.displayName}`}
                              checked={enabled}
                              disabled={!canMutate}
                              onCheckedChange={(checked) => setTransitionEnabled(source.slug, target.slug, checked === true)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={!canMutate || draft === null || validationMessage !== null || saveMutation.isPending}
            onClick={() => {
              if (draft === null) {
                return;
              }

              saveMutation.mutate(draft);
            }}
          >
            Save approval environments
          </Button>
          {validationMessage !== null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
              {validationMessage}
            </p>
          ) : null}
          {!canMutate ? (
            <WhyDisabledCtaHint reason={whyDisabledNeedsRole("Execute authority")} />
          ) : null}
        </CardFooter>
      </Card>

      {draft !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="governance-environment-preview">
          Preview: {governanceEnvironmentOptionsFromCatalog(draft).map((option) => option.label).join(" → ")}
        </p>
      ) : null}
    </OperatorPageContainer>
  );
}
