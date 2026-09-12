import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL } from "@/lib/architecture/architecture-identity-desk-copy";
import { parseFinalizeSuccessHighlightReviewId } from "@/lib/architecture/finalize-success-desk-href";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import {
  ARCHITECTURE_DESK_COMPARE_DISABLED_REASON,
  resolveArchitectureDeskCompareHref,
} from "@/lib/system-not-job-compare-entry-from-desk";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export { ARCHITECTURE_DESK_COMPARE_DISABLED_REASON as ARCHITECTURE_IDENTITY_DESK_COMPARE_DISABLED_REASON };

type ArchitectureIdentityDeskCompareActionProps = {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly latestReviewId?: string | null;
};

/** Compare CTA scoped to sibling reviews on the architecture desk (CA-30 / AO-29 / SN-027). */
export function ArchitectureIdentityDeskCompareAction(
  props: ArchitectureIdentityDeskCompareActionProps,
): React.JSX.Element {
  const searchParams = useSearchParams();
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);
  const compareResolution = resolveArchitectureDeskCompareHref({
    architectureId: props.architectureId,
    reviews: props.reviews,
    latestReviewId: props.latestReviewId,
    selectedChildRunId: parseFinalizeSuccessHighlightReviewId(searchParams),
    workingMode,
  });

  if (compareResolution.kind === "disabled") {
    return (
      <p
        className={OPERATOR_TYPOGRAPHY.helper}
        data-testid="architecture-identity-compare-disabled-reason"
      >
        {compareResolution.reason}
      </p>
    );
  }

  return (
    <Link href={compareResolution.href} className={OPERATOR_LINK.nav} data-testid="architecture-identity-compare-entry">
      {ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL}
    </Link>
  );
}
