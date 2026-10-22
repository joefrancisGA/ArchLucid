import Link from "next/link";

import {
  AUTHENTICATION_SIGN_IN_HELP_RELATED_HEADING,
  authenticationSignInHelpRelatedTopics,
} from "@/lib/authentication-sign-in-help-related-topics";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Buyer-safe Related guides for `/help/authentication-sign-in` (HEU / TB-1617). */
export function HelpAuthenticationSignInRelatedTopics(): React.ReactElement {
  const relatedTopics = authenticationSignInHelpRelatedTopics();

  return (
    <section
      className="space-y-2"
      aria-labelledby="help-authentication-sign-in-related-heading"
      data-testid="help-authentication-sign-in-related-topics"
    >
      <h2 id="help-authentication-sign-in-related-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {AUTHENTICATION_SIGN_IN_HELP_RELATED_HEADING}
      </h2>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {relatedTopics.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
