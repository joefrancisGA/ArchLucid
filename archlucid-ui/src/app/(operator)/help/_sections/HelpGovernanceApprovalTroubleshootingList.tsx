"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING } from "@/lib/governance/governance-approval-help-guide-content";
import {
  governanceApprovalTroubleshootingIssueSlug,
  helpGovernanceApprovalTroubleshootingDisclosureHrefFromSearch,
  parseHelpGovernanceApprovalTroubleshootingIssueFromSearch,
} from "@/lib/help/help-governance-approval-troubleshooting-disclosure-url";
import { cn } from "@/lib/utils";

/** Governance approval help troubleshooting accordions synced to URL. */
export function HelpGovernanceApprovalTroubleshootingList(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpGovernanceApprovalTroubleshootingIssueParam = searchParams.get("helpGovernanceApprovalTroubleshootingIssue");
  const [openIssueSlug, setOpenIssueSlugState] = useState(() =>
    parseHelpGovernanceApprovalTroubleshootingIssueFromSearch(helpGovernanceApprovalTroubleshootingIssueParam),
  );

  const syncOpenIssueToUrl = useCallback(
    (issueSlug: string | null) => {
      router.replace(
        helpGovernanceApprovalTroubleshootingDisclosureHrefFromSearch(searchParams.toString(), issueSlug, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setOpenIssueSlugState(
      parseHelpGovernanceApprovalTroubleshootingIssueFromSearch(helpGovernanceApprovalTroubleshootingIssueParam),
    );
  }, [helpGovernanceApprovalTroubleshootingIssueParam]);

  return (
    <ul className="m-0 list-none space-y-2 p-0" data-testid="help-governance-approval-troubleshooting">
      {GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING.map((item) => {
        const issueSlug = governanceApprovalTroubleshootingIssueSlug(item.issue);

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
