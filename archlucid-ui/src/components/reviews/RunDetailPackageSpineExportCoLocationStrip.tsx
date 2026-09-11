"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { ExportDeliverableDialog } from "@/components/usability/ExportDeliverableDialog";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailPackageSpineExportCoLocationStripProps = {
  readonly runId: string;
  readonly manifestId: string;
};

/** TB-1030 package spine: finalize and sponsor export affordances stay on the same viewport band. */
export function RunDetailPackageSpineExportCoLocationStrip(
  props: RunDetailPackageSpineExportCoLocationStripProps,
): ReactElement {
  const manifestId = props.manifestId.trim();

  if (manifestId.length === 0) {
    return <></>;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.infoShell, "mb-3 flex-col gap-2")}
      data-testid="run-detail-package-spine-export-co-location"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Review finalized — sponsor exports are ready here without leaving the package spine.
      </p>
      <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
        <ExportDeliverableDialog runId={props.runId} manifestId={manifestId} />
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="#artifacts-exports" data-testid="run-detail-package-spine-all-deliverables-link">
            All deliverables
          </Link>
        </Button>
      </div>
    </div>
  );
}
