"use client";

import { useCallback } from "react";

import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import {
  applyInfraResourcesSavedViewFilters,
  buildInfraResourcesSavedViewPayload,
} from "@/lib/infra-evidence/infra-evidence-explorer-saved-view-helpers";
import type { ResourcesExplorerTableSortKey } from "@/lib/infra-evidence/resources-explorer-table-sort";
import type { InfraResourcesSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

export type InfrastructureResourcesSavedViewsBarProps = {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
  readonly sortKey?: ResourcesExplorerTableSortKey;
  readonly sortAsc?: boolean;
  readonly className?: string;
  readonly onLoadView: (filters: {
    readonly namePrefix: string;
    readonly resourceType: string;
    readonly resourceGroup: string;
    readonly workQueue: CloudResourceExplorerWorkQueue;
    readonly sortKey?: ResourcesExplorerTableSortKey;
    readonly sortAsc?: boolean;
  }) => void;
};

export function InfrastructureResourcesSavedViewsBar(props: InfrastructureResourcesSavedViewsBarProps) {
  const getCurrentPayload = useCallback(
    () =>
      buildInfraResourcesSavedViewPayload({
        namePrefix: props.namePrefix,
        resourceType: props.resourceType,
        resourceGroup: props.resourceGroup,
        workQueue: props.workQueue,
        sortKey: props.sortKey,
        sortAsc: props.sortAsc,
      }),
    [props.namePrefix, props.resourceGroup, props.resourceType, props.sortAsc, props.sortKey, props.workQueue],
  );

  const onLoadView = useCallback(
    async (view: OperatorSavedView) => {
      const filters = view.payload.filters as InfraResourcesSavedViewFilters;
      props.onLoadView(applyInfraResourcesSavedViewFilters(filters, view.payload.sort));
    },
    [props],
  );

  return (
    <OperatorSavedViewsBar
      surface="infra-resources"
      getCurrentPayload={getCurrentPayload}
      onLoadView={onLoadView}
      className={props.className ?? "mb-3"}
    />
  );
}
