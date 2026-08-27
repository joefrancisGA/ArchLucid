"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { ItsmOutboundCreateIssueDialog } from "@/components/itsm/ItsmOutboundCreateIssueDialog";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import { ITSM_NATIVE_CREATE_ADMIN_HREF } from "@/lib/itsm/itsm-native-create-readiness-alignment";
import { useItsmNativeCreateReadiness } from "@/lib/use-itsm-native-create-enabled";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingItsmExportPanelProps = {
  runId: string;
  findingId: string;
  payload: FindingInspectPayload;
};

/** Finding handoff: native Jira/ServiceNow create when probes validate; copy-as-work-item fallback otherwise (Tier 2 #6). */
export function FindingItsmExportPanel({ runId, findingId, payload }: FindingItsmExportPanelProps) {
  const { defaultPathReady, deploymentEnabled } = useItsmNativeCreateReadiness();

  if (defaultPathReady) {
    return (
      <section
        className={OPERATOR_RESUME.stripPadded}
        aria-labelledby="finding-itsm-native-default-heading"
        data-testid="finding-itsm-native-default-panel"
      >
        <h2
          id="finding-itsm-native-default-heading"
          className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sync to Jira, Azure Boards, or ServiceNow
        </h2>
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Tenant work management connectors passed connection validation — create a linked issue in one click. Clipboard
          export remains available below when you need manual paste.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <ItsmOutboundCreateIssueDialog findingId={findingId} prominent />
        </div>
        <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Prefer clipboard export?
          </p>
          <div className="pt-2">
            <CopyFindingAsWorkItemButton findingId={findingId} payload={payload} runId={runId} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={OPERATOR_RESUME.stripPadded}
      aria-labelledby="finding-itsm-export-heading"
      data-testid="finding-itsm-export-panel"
    >
      <h2
        id="finding-itsm-export-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Copy for Jira, Azure Boards, or ServiceNow
      </h2>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        One click copies Jira wiki markup ready to paste into a ticket. Choose ServiceNow, Azure DevOps markdown, or JSON
        for other trackers.
      </p>
      {deploymentEnabled ? (
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Native one-click create unlocks after ITSM connection validation —{" "}
          <Link
            href={ITSM_NATIVE_CREATE_ADMIN_HREF}
            className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
          >
            configure connectors
          </Link>
          .
        </p>
      ) : null}
      <div className="pt-3">
        <CopyFindingAsWorkItemButton findingId={findingId} payload={payload} runId={runId} prominent />
      </div>
    </section>
  );
}
