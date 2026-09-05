"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import {
  GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS,
  GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_INTRO,
  GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_SECTIONS,
} from "@/lib/governance/governance-approval-help-guide-content";
import {
  helpGovApprovalTechnicalReferenceHrefFromSearch,
  parseHelpGovApprovalTechRefOpenFromSearch,
} from "@/lib/help/help-governance-approval-technical-reference-url";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Lazy-mounts API detail so collapsed technical reference stays out of primary page text scans. */
export function HelpGovernanceApprovalTechnicalReference(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpGovApprovalTechRefParam = searchParams.get("helpGovApprovalTechRef");
  const [open, setOpenState] = useState(() => parseHelpGovApprovalTechRefOpenFromSearch(helpGovApprovalTechRefParam));

  const syncTechRefOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpGovApprovalTechnicalReferenceHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncTechRefOpenToUrl(detailsOpen);
    },
    [syncTechRefOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseHelpGovApprovalTechRefOpenFromSearch(helpGovApprovalTechRefParam));
  }, [helpGovApprovalTechRefParam]);

  return (
    <details
      id="technical-reference"
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-governance-approval-technical-reference"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary
        className={cn(
          "cursor-pointer select-none font-semibold text-al-text-primary",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        Technical reference
      </summary>
      <div className={HELP_PAGE_LAYOUT.detailsBody}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_INTRO}</p>
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            href={GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.href}
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
          >
            {GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.label}
          </Link>
        </p>
        {open ? (
          <div className="mt-4 space-y-4" data-testid="help-governance-approval-technical-reference-body">
            {GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{section.title}</h3>
                <ul className={cn("m-0 mt-2", HELP_PAGE_LAYOUT.bulletList)}>
                  {section.lines.map((line) => (
                    <li key={line}>
                      <code className="text-sm">{line}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
