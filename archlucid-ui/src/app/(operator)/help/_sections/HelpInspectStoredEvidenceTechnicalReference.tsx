"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_INTRO,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import {
  helpInspectStoredEvidenceTechnicalReferenceHrefFromSearch,
  parseHelpInspectStoredEvidenceTechnicalReferenceOpenFromSearch,
} from "@/lib/help/help-inspect-stored-evidence-technical-reference-url";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Keyboard-expandable engineering identifiers for `/help/inspect-stored-evidence`. */
export function HelpInspectStoredEvidenceTechnicalReference(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/help/inspect-stored-evidence";
  const searchParams = useSearchParams();
  const openParam = searchParams.get("helpInspectStoredEvidenceTechnicalReferenceOpen");
  const [open, setOpenState] = useState(() =>
    parseHelpInspectStoredEvidenceTechnicalReferenceOpenFromSearch(openParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpInspectStoredEvidenceTechnicalReferenceHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
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
    setOpenState(parseHelpInspectStoredEvidenceTechnicalReferenceOpenFromSearch(openParam));
  }, [openParam]);

  return (
    <details
      id={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID}
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-inspect-stored-evidence-technical-reference"
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary
        className={cn(
          "cursor-pointer select-none font-semibold text-al-text-primary",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING}
      </summary>
      <div className={HELP_PAGE_LAYOUT.detailsBody}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_INTRO}
        </p>
        <ul
          className={cn("m-0 mt-3 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}
          data-testid="help-inspect-stored-evidence-technical-reference-list"
        >
          {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS.map((identifier) => (
            <li key={identifier} className="flex flex-wrap items-center gap-2">
              <code className="text-sm">{identifier}</code>
              <CopyIdButton value={identifier} aria-label={`Copy ${identifier}`} />
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
