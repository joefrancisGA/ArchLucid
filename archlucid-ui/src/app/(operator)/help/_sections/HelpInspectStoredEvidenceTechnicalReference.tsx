"use client";

import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_INTRO,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Keyboard-expandable engineering identifiers for `/help/inspect-stored-evidence`. */
export function HelpInspectStoredEvidenceTechnicalReference(): React.ReactElement {
  return (
    <details
      id={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_HEADING_ID}
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-inspect-stored-evidence-technical-reference"
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
            <li key={identifier}>
              <code className="text-sm">{identifier}</code>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
