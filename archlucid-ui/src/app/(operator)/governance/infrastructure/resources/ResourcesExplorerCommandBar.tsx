"use client";

import { InfrastructureResourcesSavedViewsBar } from "@/components/governance/infrastructure/InfrastructureResourcesSavedViewsBar";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLEAR_FILTERS_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_FILTER_MAX_LENGTH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_UNAPPLIED_FILTERS_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS,
  type CloudResourceExplorerWorkQueue,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type { ResourcesExplorerTableSortKey } from "@/lib/infra-evidence/resources-explorer-table-sort";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function clampResourceExplorerTopFilterDraft(raw: string): string {
  return raw.slice(0, GOVERNANCE_INFRASTRUCTURE_RESOURCES_FILTER_MAX_LENGTH);
}

function formatWorkQueueLabel(
  option: (typeof CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS)[number],
  count: number | undefined,
): string {
  if (count === undefined) {
    return option.label;
  }

  return `${option.label} (${count})`;
}

export type ResourcesExplorerCommandBarProps = {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
  readonly urlNamePrefix: string;
  readonly urlResourceType: string;
  readonly urlResourceGroup: string;
  readonly urlWorkQueue: CloudResourceExplorerWorkQueue;
  readonly sortKey: ResourcesExplorerTableSortKey;
  readonly sortAsc: boolean;
  readonly workQueueExplicitlySet: boolean;
  readonly activeWorkQueueCount?: number;
  readonly hasAppliedFilters: boolean;
  readonly hasUnappliedFilterChanges: boolean;
  readonly onNamePrefixChange: (value: string) => void;
  readonly onResourceTypeChange: (value: string) => void;
  readonly onResourceGroupChange: (value: string) => void;
  readonly onApplyFilters: () => void;
  readonly onClearFilters: () => void;
  readonly onApplyWorkQueue: (workQueue: CloudResourceExplorerWorkQueue) => void;
  readonly onLoadSavedView: (filters: {
    readonly namePrefix: string;
    readonly resourceType: string;
    readonly resourceGroup: string;
    readonly workQueue: CloudResourceExplorerWorkQueue;
    readonly sortKey?: ResourcesExplorerTableSortKey;
    readonly sortAsc?: boolean;
  }) => void;
};

export function ResourcesExplorerCommandBar(props: ResourcesExplorerCommandBarProps): React.JSX.Element {
  const selectedWorkQueue = props.workQueueExplicitlySet ? props.urlWorkQueue : "all";

  return (
    <section
      className={cn("grid gap-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950")}
      aria-label="Resource explorer command bar"
      data-testid="infra-resource-explorer-command-bar"
    >
      <InfrastructureResourcesSavedViewsBar
        namePrefix={props.urlNamePrefix}
        resourceType={props.urlResourceType}
        resourceGroup={props.urlResourceGroup}
        workQueue={props.urlWorkQueue}
        sortKey={props.sortKey}
        sortAsc={props.sortAsc}
        onLoadView={props.onLoadSavedView}
        className="mb-0"
      />

      <FilterChipGroup
        aria-label="Resource explorer work queues"
        className="flex flex-wrap gap-2"
        data-testid="infra-resource-explorer-work-queue-group"
      >
        {CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS.map((option) => {
          const pressed = selectedWorkQueue === option.id;
          const count = pressed ? props.activeWorkQueueCount : undefined;

          return (
            <FilterChip
              key={option.id}
              aria-pressed={pressed}
              data-testid={`infra-resource-explorer-work-queue-${option.id}`}
              onClick={() => props.onApplyWorkQueue(option.id)}
            >
              {formatWorkQueueLabel(option, count)}
            </FilterChip>
          );
        })}
      </FilterChipGroup>

      {props.workQueueExplicitlySet ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS.find((option) => option.id === props.urlWorkQueue)?.summary}
        </p>
      ) : null}

      <form
        className="grid gap-3"
        data-testid="infra-resource-explorer-filters-form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onApplyFilters();
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2 text-sm">
            <Label
              htmlFor="infra-resource-explorer-name-prefix"
              className={OPERATOR_FORM_FIELD_LABEL_CLASS}
            >
              {GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL}
            </Label>
            <Input
              id="infra-resource-explorer-name-prefix"
              data-testid="infra-resource-explorer-name-prefix"
              value={props.namePrefix}
              maxLength={GOVERNANCE_INFRASTRUCTURE_RESOURCES_FILTER_MAX_LENGTH}
              onChange={(event) => props.onNamePrefixChange(clampResourceExplorerTopFilterDraft(event.target.value))}
            />
          </div>
          <div className="grid gap-2 text-sm">
            <Label
              htmlFor="infra-resource-explorer-resource-type"
              className={OPERATOR_FORM_FIELD_LABEL_CLASS}
            >
              {GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL}
            </Label>
            <Input
              id="infra-resource-explorer-resource-type"
              data-testid="infra-resource-explorer-resource-type"
              value={props.resourceType}
              maxLength={GOVERNANCE_INFRASTRUCTURE_RESOURCES_FILTER_MAX_LENGTH}
              onChange={(event) => props.onResourceTypeChange(clampResourceExplorerTopFilterDraft(event.target.value))}
            />
          </div>
          <div className="grid gap-2 text-sm">
            <Label
              htmlFor="infra-resource-explorer-resource-group"
              className={OPERATOR_FORM_FIELD_LABEL_CLASS}
            >
              {GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL}
            </Label>
            <Input
              id="infra-resource-explorer-resource-group"
              data-testid="infra-resource-explorer-resource-group"
              value={props.resourceGroup}
              maxLength={GOVERNANCE_INFRASTRUCTURE_RESOURCES_FILTER_MAX_LENGTH}
              onChange={(event) => props.onResourceGroupChange(clampResourceExplorerTopFilterDraft(event.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" data-testid="infra-resource-explorer-apply">
            Apply filters
          </Button>
          {props.hasAppliedFilters ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="infra-resource-explorer-clear-filters"
              onClick={props.onClearFilters}
            >
              {GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLEAR_FILTERS_LABEL}
            </Button>
          ) : null}
          {props.hasUnappliedFilterChanges ? (
            <StatusTag
              kind="needs-attention"
              label={GOVERNANCE_INFRASTRUCTURE_RESOURCES_UNAPPLIED_FILTERS_LABEL}
              data-testid="infra-resource-explorer-unapplied-filters"
            />
          ) : null}
        </div>
      </form>
    </section>
  );
}
