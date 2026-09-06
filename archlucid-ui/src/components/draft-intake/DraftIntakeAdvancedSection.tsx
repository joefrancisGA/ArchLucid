"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  draftIntakeAdvancedDisclosureHrefFromSearch,
  parseDraftIntakeAdvancedOpenFromSearch,
} from "@/lib/draft-intake/draft-intake-advanced-disclosure-url";
import { GUIDED_INTAKE_ADVANCED_OPTIONS_LABEL } from "@/lib/guided-intake-copy";

export type DraftIntakeAdvancedSectionProps = {
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
};

/** Progressive disclosure for power-user intake tools (what-if branching, etc.). */
export function DraftIntakeAdvancedSection(props: DraftIntakeAdvancedSectionProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const draftIntakeAdvancedOpenParam = searchParams.get("draftIntakeAdvancedOpen");
  const [open, setOpenState] = useState(() => {
    if (draftIntakeAdvancedOpenParam !== null) {
      return parseDraftIntakeAdvancedOpenFromSearch(draftIntakeAdvancedOpenParam);
    }

    return props.defaultOpen === true;
  });

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(draftIntakeAdvancedDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
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
    setOpenState(parseDraftIntakeAdvancedOpenFromSearch(draftIntakeAdvancedOpenParam));
  }, [draftIntakeAdvancedOpenParam]);

  return (
    <CollapsibleSection
      title={GUIDED_INTAKE_ADVANCED_OPTIONS_LABEL}
      open={open}
      onToggle={setOpen}
      sectionTestId="draft-intake-advanced-section"
    >
      <div className="space-y-4">{props.children}</div>
    </CollapsibleSection>
  );
}
