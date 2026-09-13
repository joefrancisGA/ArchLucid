"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import {
  architectureNestedSearchPath,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_START_REVIEW_LABEL,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { WorkingRecordSimulatorStartHonestyNotice } from "@/components/governance/WorkingRecordSimulatorStartHonestyNotice";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveWorkingDeskToolHref } from "@/lib/resolve-working-desk-tool-href";
import { resolveArchitectureDeskCompareHref } from "@/lib/system-not-job-compare-entry-from-desk";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { cn } from "@/lib/utils";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export const ARCHITECTURE_IDENTITY_DESK_COMMAND_BAR_TEST_ID = "architecture-identity-desk-command-bar" as const;

const DESK_TOOL_VERB_LABELS = {
  ask: "Ask",
  graph: "Graph",
  findings: "Findings",
  search: "Search",
} as const;

type ArchitectureIdentityDeskCommandBarProps = {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly latestReviewId?: string | null;
};

/** SG-055 / SY-60 — visible desk verbs for nested tools on the open architecture (Working only). */
export function ArchitectureIdentityDeskCommandBar(
  props: ArchitectureIdentityDeskCommandBarProps,
): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);

  if (!workingMode) {
    return null;
  }

  const startReviewHref = startReviewFromArchitectureNestedHref(props.architectureId);
  const compareResolution = resolveArchitectureDeskCompareHref({
    architectureId: props.architectureId,
    reviews: props.reviews,
    latestReviewId: props.latestReviewId,
    selectedChildRunId: null,
    workingMode: true,
  });

  const toolHref = (tool: "ask" | "graph" | "findings") =>
    resolveWorkingDeskToolHref({
      tool,
      pathname,
      lastOpenArchitectureId: props.architectureId,
      lastOpenReviewId: props.latestReviewId,
    });

  return (
    <div className="space-y-2" data-testid={ARCHITECTURE_IDENTITY_DESK_COMMAND_BAR_TEST_ID}>
      <WorkingRecordSimulatorStartHonestyNotice />
      <div className={cn("flex flex-wrap items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
      <Button asChild size="sm" variant="outline">
        <Link href={toolHref("ask")} data-testid="architecture-identity-desk-command-ask">
          {DESK_TOOL_VERB_LABELS.ask}
        </Link>
      </Button>

      {compareResolution.kind === "href" ? (
        <Button asChild size="sm" variant="outline">
          <Link href={compareResolution.href} data-testid="architecture-identity-desk-command-compare">
            {ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL}
          </Link>
        </Button>
      ) : null}

      <Button asChild size="sm" variant="outline">
        <Link href={toolHref("graph")} data-testid="architecture-identity-desk-command-graph">
          {DESK_TOOL_VERB_LABELS.graph}
        </Link>
      </Button>

      <Button asChild size="sm" variant="outline">
        <Link href={toolHref("findings")} data-testid="architecture-identity-desk-command-findings">
          {DESK_TOOL_VERB_LABELS.findings}
        </Link>
      </Button>

      <Button asChild size="sm" variant="outline">
        <Link
          href={architectureNestedSearchPath(props.architectureId)}
          data-testid="architecture-identity-desk-command-search"
        >
          {DESK_TOOL_VERB_LABELS.search}
        </Link>
      </Button>

      <Button asChild size="sm" variant="primary">
        <Link href={startReviewHref} data-testid="architecture-identity-desk-command-start-review">
          {ARCHITECTURE_IDENTITY_DESK_START_REVIEW_LABEL}
        </Link>
      </Button>
      </div>
    </div>
  );
}
