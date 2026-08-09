import Link from "next/link";

import {
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_GCP_SECURELY_SOURCES,
  CONNECT_GCP_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim discipline + Sources orientation for `/help/cloud-connections/gcp`. */
export function ConnectGcpSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="connect-gcp-securely-help-orientation">
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="connect-gcp-securely-help-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE}</p>
      </aside>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="connect-gcp-securely-help-sources-heading"
        data-testid="connect-gcp-securely-help-sources"
      >
        <h2
          id="connect-gcp-securely-help-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CONNECT_GCP_SECURELY_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {CONNECT_GCP_SECURELY_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
