"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildPackagePrintPath, PACKAGE_PRINT_OPEN_LABEL } from "@/lib/package-print-view";

type PackagePrintOpenButtonProps = {
  readonly runId: string;
};

/** Opens the dedicated print stylesheet view from the review-package tab (TB-2205). */
export function PackagePrintOpenButton(props: PackagePrintOpenButtonProps): React.ReactElement {
  const href = buildPackagePrintPath(props.runId);

  return (
    <Button variant="outline" size="sm" asChild className="print:hidden">
      <Link href={href} data-testid="package-print-open">
        {PACKAGE_PRINT_OPEN_LABEL}
      </Link>
    </Button>
  );
}
