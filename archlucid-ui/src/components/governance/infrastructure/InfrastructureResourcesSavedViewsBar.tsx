"use client";

import { useCallback } from "react";

import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import {
  applyInfraResourcesSavedViewFilters,
  buildInfraResourcesSavedViewPayload,
} from "@/lib/infra-evidence/infra-evidence-explorer-saved-view-helpers";
import type { InfraResourcesSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

export type InfrastructureResourcesSavedViewsBarProps = {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
  readonly onLoadView: (filters: {
    readonly namePrefix: string;
    readonly resourceType: string;
    readonly resourceGroup: string;
    readonly workQueue: CloudResourceExplorerWorkQueue;
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
      }),
    [props.namePrefix, props.resourceGroup, props.resourceType, props.workQueue],
  );

  const onLoadView = useCallback(
    async (view: OperatorSavedView) => {
      const filters = view.payload.filters as InfraResourcesSavedViewFilters;
      props.onLoadView(applyInfraResourcesSavedViewFilters(filters));
    },
    [props],
  );

  return (
    <OperatorSavedViewsBar
      surface="infra-resources"
      getCurrentPayload={getCurrentPayload}
      onLoadView={onLoadView}
      className="mb-3"
    />
  );
}
