"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

import { CreateWorkItemButton } from "@/components/work-items/CreateWorkItemButton";
import {
  CREATE_WORK_ITEM_SECTION_HELPER,
  CREATE_WORK_ITEM_SECTION_TITLE,
} from "@/lib/create-work-item-copy";

export type ArchitectureCreateWorkItemSectionProps = {
  readonly runId: string;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly ownerLabel: string | null;
  readonly findings: readonly QuickDecisionFinding[];
};

/** Collapsed-by-default secondary work-management section on the architecture-creation review page. */
export function ArchitectureCreateWorkItemSection(
  props: ArchitectureCreateWorkItemSectionProps,
): React.JSX.Element {
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-workspace-disclosure
      data-testid="architecture-create-work-item-section"
    >
      <summary className={cn("cursor-pointer list-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {CREATE_WORK_ITEM_SECTION_TITLE}
      </summary>
      <div className="mt-3 space-y-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CREATE_WORK_ITEM_SECTION_HELPER}
        </p>
        <CreateWorkItemButton
          runId={props.runId}
          architectureName={props.architectureName}
          architectureOverview={props.architectureOverview}
          ownerLabel={props.ownerLabel}
          findings={props.findings}
          siteOrigin={siteOrigin}
        />
      </div>
    </details>
  );
}
