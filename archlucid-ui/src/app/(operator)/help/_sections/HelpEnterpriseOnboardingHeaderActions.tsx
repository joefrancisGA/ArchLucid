"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION } from "@/lib/enterprise-onboarding-help-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpEnterpriseOnboardingHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/enterprise-onboarding` (HEX). */
export function HelpEnterpriseOnboardingHeaderActions(
  props: HelpEnterpriseOnboardingHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-enterprise-onboarding-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.testId}>
        <Link href={ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.href}>
          {ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
