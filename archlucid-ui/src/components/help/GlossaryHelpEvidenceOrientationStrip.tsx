import Link from "next/link";

import {
  GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD,
  GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL,
  GLOSSARY_HELP_FOLLOW_UP_LINKS,
} from "@/lib/glossary-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/glossary` — no diligence Sources list (TB-2092). */
export function GlossaryHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <aside className={cn(DESIGN_TOKENS.callout.warn, "p-3")} data-testid="glossary-help-claim-discipline">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        {GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD} Open{" "}
        {GLOSSARY_HELP_FOLLOW_UP_LINKS.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? (index === GLOSSARY_HELP_FOLLOW_UP_LINKS.length - 1 ? ", or " : ", ") : null}
            <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
              {link.label}
            </Link>
          </span>
        ))}{" "}
        {GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL}
      </p>
    </aside>
  );
}
