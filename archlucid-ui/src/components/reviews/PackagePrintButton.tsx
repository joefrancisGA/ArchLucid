"use client";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { PACKAGE_PRINT_BUTTON_LABEL, printPackagePage } from "@/lib/package-print-view";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

type PackagePrintButtonProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
};

/** Screen-only print CTA on the dedicated package print view (TB-2205). */
export function PackagePrintButton(props: PackagePrintButtonProps): React.ReactElement {
  const blockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestVersion,
  });
  const hintId = "package-print-pdf-disabled-hint";

  if (blockedReason !== null) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="print:hidden"
          disabled
          data-testid="package-print-pdf-blocked"
        >
          {PACKAGE_PRINT_BUTTON_LABEL}
        </Button>
        <WhyDisabledCtaHint id={hintId} reason={blockedReason} testId={hintId} />
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="print:hidden"
      data-testid="package-print-pdf"
      onClick={() => {
        printPackagePage();
      }}
    >
      {PACKAGE_PRINT_BUTTON_LABEL}
    </Button>
  );
}
