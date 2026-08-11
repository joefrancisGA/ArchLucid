import Link from "next/link";

import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import {
  GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD,
  GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL,
  GLOSSARY_HELP_FOLLOW_UP_LINKS,
} from "@/lib/glossary-help-evidence-copy";
import { cn } from "@/lib/utils";

/** Separator before each follow-up link: nothing, a comma, or ", or " before the last one. */
function followUpSeparator(index: number): string | null {
  if (index === 0) {
    return null;
  }

  return index === GLOSSARY_HELP_FOLLOW_UP_LINKS.length - 1 ? ", or " : ", ";
}

/** Claim-discipline orientation for `/help/glossary` — no diligence Sources list (TB-2092). */
export function GlossaryHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="glossary-help-claim-discipline"
      body={
        <>
          {GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD} Open{" "}
          {GLOSSARY_HELP_FOLLOW_UP_LINKS.map((link, index) => (
            <span key={link.href}>
              {followUpSeparator(index)}
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </span>
          ))}{" "}
          {GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL}
        </>
      }
    />
  );
}
