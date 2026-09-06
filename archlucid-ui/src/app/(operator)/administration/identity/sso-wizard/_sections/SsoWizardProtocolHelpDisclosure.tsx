"use client";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseSsoProtocolHelpOpenFromSearch,
  ssoProtocolHelpDisclosureHrefFromSearch,
} from "@/lib/administration/sso-protocol-help-disclosure-url";
import {
  SSO_WIZARD_PROTOCOL_HELP_BODY,
  SSO_WIZARD_PROTOCOL_HELP_SUMMARY,
} from "@/lib/sso-wizard-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

export function SsoWizardProtocolHelpDisclosure(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? SSO_WIZARD_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const ssoProtocolHelpOpenParam = searchParams.get("ssoProtocolHelpOpen");
  const [open, setOpenState] = useState(() => parseSsoProtocolHelpOpenFromSearch(ssoProtocolHelpOpenParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(ssoProtocolHelpDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseSsoProtocolHelpOpenFromSearch(ssoProtocolHelpOpenParam));
  }, [ssoProtocolHelpOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-neutral-50/70 dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="sso-protocol-help-disclosure"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary
        className={cn(
          "cursor-pointer select-none px-3 py-2 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
          OPERATOR_DISCLOSURE_TRIGGER_CLASS,
        )}
      >
        {SSO_WIZARD_PROTOCOL_HELP_SUMMARY}
      </summary>
      <div className={cn("space-y-2 border-t border-neutral-200 px-3 py-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0 text-al-text-secondary">{SSO_WIZARD_PROTOCOL_HELP_BODY}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <InAppHelpLink helpSlug="authentication-sign-in" label="Authentication and sign-in" variant="text" />
        </p>
      </div>
    </details>
  );
}
