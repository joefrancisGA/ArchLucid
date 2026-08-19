"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  CONTACT_SUPPORT_HELP_CHECKLIST_TITLE,
  CONTACT_SUPPORT_HELP_EMAIL_BODY,
  CONTACT_SUPPORT_HELP_EMAIL_SLA_NOTE,
  CONTACT_SUPPORT_PRIMARY_ACTIONS,
} from "@/lib/contact-support-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  buildSupportRequestMailtoHref,
  SUPPORT_REQUEST_CHECKLIST,
} from "@/lib/support-workspace-present";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Email support block with checklist and templated mailto for `/help/contact-support`. */
export function ContactSupportHelpEmailSection(): React.JSX.Element {
  const workspaceLabel = useMemo(() => {
    const scope = readOperatorScopeFromStorage();

    if (scope === null) {
      return null;
    }

    if (scope.workspaceLabel.trim().length > 0) {
      return scope.workspaceLabel.trim();
    }

    return scope.workspaceId;
  }, []);

  const mailtoHref = buildSupportRequestMailtoHref(workspaceLabel);

  return (
    <section
      aria-labelledby="contact-support-email-support"
      className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      data-testid="contact-support-help-email-section"
    >
      <h2
        id="contact-support-email-support"
        className={cn("m-0 scroll-mt-24", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Email support
      </h2>

      <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)} data-testid="contact-support-help-support-email">
        <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>
          {ARCHLUCID_SUPPORT_EMAIL}
        </Link>
        {" — "}
        {CONTACT_SUPPORT_HELP_EMAIL_BODY}
      </p>

      <p className={cn("m-0 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}>
        {CONTACT_SUPPORT_HELP_EMAIL_SLA_NOTE}
      </p>

      <div>
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {CONTACT_SUPPORT_HELP_CHECKLIST_TITLE}
        </p>
        <ul
          className={cn("m-0 mt-2 list-disc space-y-1 pl-5", HELP_PAGE_LAYOUT.readingBody)}
          data-testid="contact-support-help-request-checklist"
        >
          {SUPPORT_REQUEST_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="primary" data-testid="contact-support-help-email-template">
          <a href={mailtoHref}>{CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.label}</a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>Email without template</a>
        </Button>
      </div>
    </section>
  );
}
