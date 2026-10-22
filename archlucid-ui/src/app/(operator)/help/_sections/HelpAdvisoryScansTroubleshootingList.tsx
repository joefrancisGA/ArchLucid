"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ADVISORY_SCANS_HELP_TROUBLESHOOTING } from "@/lib/advisory-scans-help-guide-content";
import {
  advisoryScansTroubleshootingIssueSlug,
  helpAdvisoryScansTroubleshootingDisclosureHrefFromSearch,
  parseHelpAdvisoryScansTroubleshootingIssueFromSearch,
} from "@/lib/help/help-advisory-scans-troubleshooting-disclosure-url";
import { cn } from "@/lib/utils";

/** Advisory scans help troubleshooting accordions synced to URL. */
export function HelpAdvisoryScansTroubleshootingList(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAdvisoryScansTroubleshootingIssueParam = searchParams.get("helpAdvisoryScansTroubleshootingIssue");
  const [openIssueSlug, setOpenIssueSlugState] = useState(() =>
    parseHelpAdvisoryScansTroubleshootingIssueFromSearch(helpAdvisoryScansTroubleshootingIssueParam),
  );

  const syncOpenIssueToUrl = useCallback(
    (issueSlug: string | null) => {
      router.replace(
        helpAdvisoryScansTroubleshootingDisclosureHrefFromSearch(searchParams.toString(), issueSlug, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setOpenIssueSlugState(
      parseHelpAdvisoryScansTroubleshootingIssueFromSearch(helpAdvisoryScansTroubleshootingIssueParam),
    );
  }, [helpAdvisoryScansTroubleshootingIssueParam]);

  return (
    <ul className="m-0 list-none space-y-2 p-0" data-testid="help-advisory-scans-troubleshooting">
      {ADVISORY_SCANS_HELP_TROUBLESHOOTING.map((item) => {
        const issueSlug = advisoryScansTroubleshootingIssueSlug(item.issue);

        return (
          <li key={item.issue}>
            <details
              className={cn(DESIGN_TOKENS.surface.card, "group p-3")}
              open={openIssueSlug === issueSlug}
              onToggle={(event) => {
                const open = (event.currentTarget as HTMLDetailsElement).open;
                const nextSlug = open ? issueSlug : null;
                setOpenIssueSlugState(nextSlug ?? "");
                syncOpenIssueToUrl(nextSlug);
              }}
            >
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-2 font-semibold text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
                  OPERATOR_TYPOGRAPHY.cardTitle,
                )}
              >
                <DisclosureTriangleIndicator />
                {item.issue}
              </summary>
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
                {item.resolution}
                {item.href !== undefined && item.linkLabel !== undefined ? (
                  <>
                    {" "}
                    <Link href={item.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                      {item.linkLabel}
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
