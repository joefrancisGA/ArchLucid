import Link from "next/link";

import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
  CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";
import { cn } from "@/lib/utils";

/** Claim discipline + diligence artifact index for `/help/caiq-sig-response`. */
export function CaiqSigResponseHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="caiq-sig-response-help-orientation">
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="caiq-sig-response-help-lead">
        {CAIQ_SIG_RESPONSE_HELP_LEAD}
      </p>

      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="caiq-sig-response-help-claim-discipline"
        aria-labelledby="caiq-sig-response-help-claim-heading"
      >
        <h2
          id="caiq-sig-response-help-claim-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING}
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE}</p>
        <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="caiq-sig-response-help-sources-heading"
        data-testid="caiq-sig-response-help-sources"
      >
        <h2
          id="caiq-sig-response-help-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {CAIQ_SIG_RESPONSE_HELP_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                href={link.href}
              >
                {link.label}
              </Link>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{link.when}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
