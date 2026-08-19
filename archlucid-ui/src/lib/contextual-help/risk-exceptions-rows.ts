/** Risk exceptions register surface. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  RISK_EXCEPTIONS_CANONICAL_PATH,
} from "@/lib/risk-exceptions-evidence-copy";

export const RISK_EXCEPTIONS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: RISK_EXCEPTIONS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Risk exceptions — time-bounded waivers for accepted findings that need renewal, revocation, or audit-friendly tracking.",
      whatToDoNext:
        "Review expiring exceptions, renew or revoke with justification, then open Findings when the underlying concern still needs disposition.",
      whyEmpty: "Exceptions appear after findings are accepted with waiver or exception governance decisions.",
      whereToConfigurePrerequisite:
        "Risk exceptions are separate from the findings queue — waivers do not dispose the underlying finding.",
      whatToDoNextAction: {
        label: "Open findings queue",
        href: "/governance/findings",
      },
    },
  },
];
