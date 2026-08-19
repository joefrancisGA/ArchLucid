"use client";

import { Button } from "@/components/ui/button";
import { PACKAGE_PRINT_BUTTON_LABEL, printPackagePage } from "@/lib/package-print-view";

/** Screen-only print CTA on the dedicated package print view (TB-2205). */
export function PackagePrintButton(): React.ReactElement {
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
