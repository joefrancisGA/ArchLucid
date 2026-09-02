import Link from "next/link";
import type { ReactElement } from "react";

import {
  GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS,
  GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_INTRO,
  GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_SECTIONS,
} from "@/lib/governance/governance-approval-help-guide-content";
import { HelpStaticSection } from "@/components/help/HelpStaticSection";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** API detail for governance approval technical reference on `/help/governance-approval`. */
export function HelpGovernanceApprovalTechnicalReference(): ReactElement {
  return (
    <HelpStaticSection
      id="technical-reference"
      headingLevel={2}
      title="Technical reference"
      testId="help-governance-approval-technical-reference"
      bodyClassName={HELP_PAGE_LAYOUT.detailsBody}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_INTRO}</p>
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <Link href={GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          {GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.label}
        </Link>
      </p>
      <div className="mt-4 space-y-4" data-testid="help-governance-approval-technical-reference-body">
        {GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_SECTIONS.map((section) => (
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
