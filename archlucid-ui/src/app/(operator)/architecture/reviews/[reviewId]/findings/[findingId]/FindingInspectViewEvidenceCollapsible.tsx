"use client";

import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  findingViewEvidenceDisclosureHrefFromSearch,
  parseFindingViewEvidenceOpenFromSearch,
} from "@/lib/findings/finding-view-evidence-disclosure-url";

type FindingInspectViewEvidenceCollapsibleProps = {
  readonly children: ReactNode;
};

/** Detail-variant evidence block with URL-synced open state. */
export function FindingInspectViewEvidenceCollapsible({
  children,
}: FindingInspectViewEvidenceCollapsibleProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingViewEvidenceOpenParam = searchParams.get("findingViewEvidenceOpen");
  const [open, setOpenState] = useState(() => parseFindingViewEvidenceOpenFromSearch(findingViewEvidenceOpenParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(findingViewEvidenceDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
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
    setOpenState(parseFindingViewEvidenceOpenFromSearch(findingViewEvidenceOpenParam));
  }, [findingViewEvidenceOpenParam]);

  return (
    <CollapsibleSection
      title="View evidence"
      open={open}
      onToggle={setOpen}
      sectionTestId="finding-evidence-collapsible"
    >
      {children}
    </CollapsibleSection>
  );
}
