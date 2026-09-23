"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  findingViewEvidenceDisclosureHrefFromSearch,
  parseFindingViewEvidenceOpenFromSearch,
} from "@/lib/findings/finding-view-evidence-disclosure-url";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

type FindingInspectViewEvidenceCollapsibleProps = {
  readonly children: ReactNode;
};

/** Detail-variant evidence block with URL-synced open state. */
export function FindingInspectViewEvidenceCollapsible({
  children,
}: FindingInspectViewEvidenceCollapsibleProps): ReactElement {
  const pathname = usePathname() ?? "/";
  const readOpenFromUrl = (): boolean =>
    parseFindingViewEvidenceOpenFromSearch(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("findingViewEvidenceOpen"),
    );
  const [open, setOpenState] = useState(() => readOpenFromUrl());
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        findingViewEvidenceDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = readOpenFromUrl();

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

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
