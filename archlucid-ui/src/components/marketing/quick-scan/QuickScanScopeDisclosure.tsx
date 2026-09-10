"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { QUICK_SCAN_SCOPE_DISCLOSURE_BODY } from "@/lib/quick-scan-evidence-copy";
import {
  parseQuickScanScopeDisclosureOpenFromSearch,
  quickScanScopeDisclosureHrefFromSearch,
} from "@/lib/quick-scan/quick-scan-scope-disclosure-url";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

/** Demoted scope boundary — what this marketing page does not replace. */
export function QuickScanScopeDisclosure(): ReactNode {
  const router = useRouter();
  const pathname = usePathname() ?? "/quick-scan";
  const searchParams = useSearchParams();
  const quickScanScopeDisclosureOpenParam = searchParams.get("quickScanScopeDisclosureOpen");
  const [scopeDisclosureOpen, setScopeDisclosureOpenState] = useState(() =>
    parseQuickScanScopeDisclosureOpenFromSearch(quickScanScopeDisclosureOpenParam),
  );

  const syncScopeDisclosureOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(quickScanScopeDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setScopeDisclosureOpen = useCallback(
    (open: boolean) => {
      setScopeDisclosureOpenState(open);
      syncScopeDisclosureOpenToUrl(open);
    },
    [syncScopeDisclosureOpenToUrl],
  );

  useEffect(() => {
    setScopeDisclosureOpenState(parseQuickScanScopeDisclosureOpenFromSearch(quickScanScopeDisclosureOpenParam));
  }, [quickScanScopeDisclosureOpenParam]);

  return (
    <details
      className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
      data-testid="quick-scan-scope-disclosure"
      open={scopeDisclosureOpen}
      onToggle={(event) => {
        setScopeDisclosureOpen(event.currentTarget.open);
      }}
    >
      <summary className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularySummary}>What this page is not</summary>
      <div className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyBody}>
        <p className={cn("m-0 text-al-text-secondary", TRUST_CENTER_PUBLIC_LAYOUT.vocabularyIntro)}>
          {QUICK_SCAN_SCOPE_DISCLOSURE_BODY}
        </p>
      </div>
    </details>
  );
}
