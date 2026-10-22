import Link from "next/link";

import { cn } from "@/lib/utils";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_LINKS, AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_PROMPT } from "@/lib/authentication-sign-in-help-triage";

/** Header-adjacent jump anchors for locked-out admins on authentication help. */
export function HelpTopicSignInFailureTriageLine(): React.ReactElement {
  return (
    <p
      className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="help-topic-sign-in-failure-triage"
    >
      <span className="font-medium">{AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_PROMPT}</span>
      <span aria-hidden="true"> → </span>
      {AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_LINKS.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? (
            <span aria-hidden="true" className="text-al-text-secondary">
              {" "}
              ·{" "}
            </span>
          ) : null}
          <Link
            href={link.href}
            className={cn(
              "inline-flex min-h-6 items-center py-1 font-medium underline-offset-2 hover:underline",
              DESIGN_TOKENS.accent.link,
              DESIGN_TOKENS.accent.focusRing,
            )}
          >
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
