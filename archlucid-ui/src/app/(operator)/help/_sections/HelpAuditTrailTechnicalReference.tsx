import Link from "next/link";
import type { ReactElement } from "react";

import {
  AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR,
  AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS,
  AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_INTRO,
  AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_SECTIONS,
} from "@/lib/audit-trail-help-guide-content";
import { HelpStaticSection } from "@/components/help/HelpStaticSection";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Engineering detail for audit trail technical reference on `/help/audit-trail`. */
export function HelpAuditTrailTechnicalReference(): ReactElement {
  return (
    <HelpStaticSection
      id="technical-reference"
      headingLevel={2}
      title="Technical reference"
      testId="help-audit-trail-technical-reference"
      bodyClassName={HELP_PAGE_LAYOUT.detailsBody}
    >
      <span id={AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR} className="sr-only">
        Immutability enforcement
      </span>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_INTRO}</p>
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          href={AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.href}
          className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
        >
          {AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.label}
        </Link>
      </p>
      <div className="mt-4 space-y-4" data-testid="help-audit-trail-technical-reference-body">
        {AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{section.title}</h3>
            <ul className={cn("m-0 mt-2", HELP_PAGE_LAYOUT.bulletList)}>
              {section.lines.map((line) => (
                <li key={line}>
                  <code className="text-sm">{line}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </HelpStaticSection>
  );
}
