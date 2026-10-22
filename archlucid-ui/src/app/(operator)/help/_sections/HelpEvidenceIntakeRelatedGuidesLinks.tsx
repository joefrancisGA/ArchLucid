import Link from "next/link";

import { EVIDENCE_INTAKE_HELP_RELATED_GUIDES } from "@/lib/evidence-intake-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Related in-app guides for `/help/evidence-intake` (TB-1352). */
export function HelpEvidenceIntakeRelatedGuidesLinks(): React.ReactElement {
  return (
    <ul
      className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}
      data-testid="help-evidence-intake-related-guides-links"
    >
      {EVIDENCE_INTAKE_HELP_RELATED_GUIDES.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={link.href}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
