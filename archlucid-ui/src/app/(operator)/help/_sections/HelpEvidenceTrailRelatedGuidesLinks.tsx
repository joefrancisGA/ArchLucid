import Link from "next/link";

import { EVIDENCE_TRAIL_HELP_RELATED_GUIDES } from "@/lib/evidence-trail-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Related in-app guides for `/help/evidence-trail` (TB-1362). */
export function HelpEvidenceTrailRelatedGuidesLinks(): React.ReactElement {
  return (
    <ul
      className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}
      data-testid="help-evidence-trail-related-guides-links"
    >
      {EVIDENCE_TRAIL_HELP_RELATED_GUIDES.map((link) => (
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
