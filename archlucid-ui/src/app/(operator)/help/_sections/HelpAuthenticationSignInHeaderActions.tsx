"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION } from "@/lib/authentication-sign-in-help-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAuthenticationSignInHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Primary return-to-sign-in CTA plus contextual help and print for authentication help (HEU). */
export function HelpAuthenticationSignInHeaderActions(
  props: HelpAuthenticationSignInHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="help-authentication-sign-in-header-actions"
    >
      <Button asChild size="sm" variant="primary" data-testid={AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.testId}>
        <Link href={AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.href}>
          {AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
