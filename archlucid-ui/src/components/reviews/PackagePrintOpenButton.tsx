"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { buildPackagePrintPath, PACKAGE_PRINT_OPEN_LABEL } from "@/lib/package-print-view";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { whyDisabledPolicy } from "@/lib/why-disabled-cta";

type PackagePrintOpenButtonProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
};

/** Opens the dedicated print stylesheet view from the review-package tab (TB-2205). */
export function PackagePrintOpenButton(props: PackagePrintOpenButtonProps): React.ReactElement {
  const blockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestVersion,
  });
  const hintId = "package-print-open-disabled-hint";

  if (blockedReason !== null) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <Button variant="outline" size="sm" disabled data-testid="package-print-open-blocked">
          {PACKAGE_PRINT_OPEN_LABEL}
        </Button>
        <WhyDisabledCtaHint id={hintId} reason={whyDisabledPolicy(blockedReason)} testId={hintId} />
      </div>
    );
  }

  const href = buildPackagePrintPath(props.runId);

  return (
    <Button variant="outline" size="sm" asChild className="print:hidden">
      <Link href={href} data-testid="package-print-open">
        {PACKAGE_PRINT_OPEN_LABEL}
      </Link>
    </Button>
  );
}
