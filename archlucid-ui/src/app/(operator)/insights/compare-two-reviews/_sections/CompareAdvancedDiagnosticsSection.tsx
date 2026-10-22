"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchitectureComparisonReplayCostSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/ArchitectureComparisonReplayCostSection";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  compareAdvancedDiagnosticsHrefFromSearch,
  parseCompareAdvancedDiagnosticsOpenFromSearch,
} from "@/lib/compare/compare-advanced-diagnostics-url";

/** Collapsed advanced tooling on Compare — comparison replay cost estimate and related diagnostics. */
export function CompareAdvancedDiagnosticsSection() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const compareAdvancedDiagnosticsOpenParam = searchParams.get("compareAdvancedDiagnosticsOpen");
  const [open, setOpenState] = useState(() =>
    parseCompareAdvancedDiagnosticsOpenFromSearch(compareAdvancedDiagnosticsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(compareAdvancedDiagnosticsHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseCompareAdvancedDiagnosticsOpenFromSearch(compareAdvancedDiagnosticsOpenParam));
  }, [compareAdvancedDiagnosticsOpenParam]);

  return (
    <details
      className={cn(
        "mt-10 mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="compare-advanced-diagnostics"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>Advanced diagnostics</summary>
      <div className="mt-3">
        <ArchitectureComparisonReplayCostSection />
      </div>
    </details>
  );
}
