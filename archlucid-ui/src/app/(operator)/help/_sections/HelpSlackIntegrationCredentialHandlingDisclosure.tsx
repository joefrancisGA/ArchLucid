"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  helpSlackCredentialHandlingDisclosureHrefFromSearch,
  parseHelpSlackCredentialHandlingOpenFromSearch,
} from "@/lib/help/help-slack-credential-handling-disclosure-url";
import {
  SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY,
  SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE,
} from "@/lib/slack-integration-help-guide-content";
import { cn } from "@/lib/utils";

/** Credential handling disclosure on the Slack integration help page, synced to URL. */
export function HelpSlackIntegrationCredentialHandlingDisclosure(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpSlackCredentialHandlingOpenParam = searchParams.get("helpSlackCredentialHandlingOpen");
  const [credentialHandlingOpen, setCredentialHandlingOpenState] = useState(() =>
    parseHelpSlackCredentialHandlingOpenFromSearch(helpSlackCredentialHandlingOpenParam),
  );

  const syncCredentialHandlingOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpSlackCredentialHandlingDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setCredentialHandlingOpen = useCallback(
    (open: boolean) => {
      setCredentialHandlingOpenState(open);
      syncCredentialHandlingOpenToUrl(open);
    },
    [syncCredentialHandlingOpenToUrl],
  );

  useEffect(() => {
    setCredentialHandlingOpenState(
      parseHelpSlackCredentialHandlingOpenFromSearch(helpSlackCredentialHandlingOpenParam),
    );
  }, [helpSlackCredentialHandlingOpenParam]);

  return (
    <details
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-slack-integration-credential-handling-details"
      open={credentialHandlingOpen}
      onToggle={(event) => {
        setCredentialHandlingOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE}
      </summary>
      <div className={HELP_PAGE_LAYOUT.detailsBody}>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY}</p>
      </div>
    </details>
  );
}
