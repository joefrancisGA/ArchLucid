"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { Badge } from "@/components/ui/badge";
import {
  WIZARD_ADVANCED_SECTION_KEY_PARAM,
  parseWizardAdvancedSectionKeyFromSearch,
  wizardAdvancedSectionDisclosureHrefFromSearch,
} from "@/lib/wizard/wizard-advanced-section-disclosure-url";

export function WizardAdvancedCollapsibleSection(props: {
  sectionKey: string;
  title: string;
  count: number;
  children: ReactNode;
}): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const wizardAdvancedSectionKeyParam = searchParams.get(WIZARD_ADVANCED_SECTION_KEY_PARAM);
  const [openSectionKey, setOpenSectionKeyState] = useState(() =>
    parseWizardAdvancedSectionKeyFromSearch(wizardAdvancedSectionKeyParam),
  );
  const syncOpenSectionKeyToUrl = useCallback(
    (sectionKey: string | null) => {
      router.replace(
        wizardAdvancedSectionDisclosureHrefFromSearch(searchParams.toString(), sectionKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenSectionKey = useCallback(
    (sectionKey: string | null) => {
      setOpenSectionKeyState(sectionKey ?? "");
      syncOpenSectionKeyToUrl(sectionKey);
    },
    [syncOpenSectionKeyToUrl],
  );
  const sectionOpen = openSectionKey === props.sectionKey;

  useEffect(() => {
    setOpenSectionKeyState(parseWizardAdvancedSectionKeyFromSearch(wizardAdvancedSectionKeyParam));
  }, [wizardAdvancedSectionKeyParam]);

  return (
    <details
      className="group rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
      open={sectionOpen}
      onToggle={(event) => setOpenSectionKey(event.currentTarget.open ? props.sectionKey : null)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
        <DisclosureTriangleIndicator />
        <span className="flex flex-wrap items-center gap-2">
          <span>{props.title}</span>
          {props.count > 0 ? (
            <Badge variant="secondary" className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
              {props.count}
            </Badge>
          ) : null}
        </span>
      </summary>
      <div className="mt-4 space-y-4">{props.children}</div>
    </details>
  );
}
