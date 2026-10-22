"use client";

import { useCallback, useEffect, useState, type ReactElement, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS,
  type AuthenticationSignInHelpMarkdownSections,
} from "@/lib/authentication-sign-in-help-guide-content";
import {
  helpAuthenticationSignInDisclosureHrefFromSearch,
  parseHelpAuthAcceptingInvitationOpenFromSearch,
  parseHelpAuthAccountRecoveryOpenFromSearch,
  parseHelpAuthCommonIssuesOpenFromSearch,
  parseHelpAuthEnterpriseSsoOpenFromSearch,
  type HelpAuthenticationSignInDisclosureUrlState,
} from "@/lib/help/help-authentication-sign-in-disclosure-url";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAuthenticationSignInCollapsibleSectionsProps = {
  readonly entry: ProductDocumentationEntry;
  readonly sourceDocPath: string;
  readonly sections: Pick<
    AuthenticationSignInHelpMarkdownSections,
    "commonIssuesMarkdown" | "accountRecoveryMarkdown" | "acceptingInvitationMarkdown" | "enterpriseSsoMarkdown"
  >;
};

function renderHelpMarkdownSection(
  markdownSection: string,
  entry: ProductDocumentationEntry,
  sourceDocPath: string,
): ReactElement | null {
  if (markdownSection.trim().length === 0) {
    return null;
  }

  return (
    <MarketingAccessibilityMarkdownFragment
      markdownBody={markdownSection}
      tableCaption={`${entry.title} reference table`}
      presentation="help"
      sourceDocPath={sourceDocPath}
      helpTopicSlug={entry.slug}
      preparedMarkdownOverride={markdownSection}
    />
  );
}

/** Authentication sign-in help collapsible sections synced to URL params. */
export function HelpAuthenticationSignInCollapsibleSections(
  props: HelpAuthenticationSignInCollapsibleSectionsProps,
): ReactElement {
  const { entry, sourceDocPath, sections } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAuthCommonIssuesOpenParam = searchParams.get("helpAuthCommonIssuesOpen");
  const helpAuthAccountRecoveryOpenParam = searchParams.get("helpAuthAccountRecoveryOpen");
  const helpAuthAcceptingInvitationOpenParam = searchParams.get("helpAuthAcceptingInvitationOpen");
  const helpAuthEnterpriseSsoOpenParam = searchParams.get("helpAuthEnterpriseSsoOpen");
  const collapsibleSections = AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS;

  const [disclosureState, setDisclosureState] = useState<HelpAuthenticationSignInDisclosureUrlState>(() => ({
    commonIssuesOpen: parseHelpAuthCommonIssuesOpenFromSearch(helpAuthCommonIssuesOpenParam),
    accountRecoveryOpen: parseHelpAuthAccountRecoveryOpenFromSearch(helpAuthAccountRecoveryOpenParam),
    acceptingInvitationOpen: parseHelpAuthAcceptingInvitationOpenFromSearch(helpAuthAcceptingInvitationOpenParam),
    enterpriseSsoOpen: parseHelpAuthEnterpriseSsoOpenFromSearch(helpAuthEnterpriseSsoOpenParam),
  }));

  const syncDisclosuresToUrl = useCallback(
    (state: HelpAuthenticationSignInDisclosureUrlState) => {
      router.replace(helpAuthenticationSignInDisclosureHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDisclosurePanelOpen = useCallback(
    (key: keyof HelpAuthenticationSignInDisclosureUrlState, value: SetStateAction<boolean>) => {
      setDisclosureState((current) => {
        const nextValue = typeof value === "function" ? value(current[key]) : value;
        const nextState = { ...current, [key]: nextValue };
        syncDisclosuresToUrl(nextState);

        return nextState;
      });
    },
    [syncDisclosuresToUrl],
  );

  useEffect(() => {
    setDisclosureState({
      commonIssuesOpen: parseHelpAuthCommonIssuesOpenFromSearch(helpAuthCommonIssuesOpenParam),
      accountRecoveryOpen: parseHelpAuthAccountRecoveryOpenFromSearch(helpAuthAccountRecoveryOpenParam),
      acceptingInvitationOpen: parseHelpAuthAcceptingInvitationOpenFromSearch(helpAuthAcceptingInvitationOpenParam),
      enterpriseSsoOpen: parseHelpAuthEnterpriseSsoOpenFromSearch(helpAuthEnterpriseSsoOpenParam),
    });
  }, [
    helpAuthAcceptingInvitationOpenParam,
    helpAuthAccountRecoveryOpenParam,
    helpAuthCommonIssuesOpenParam,
    helpAuthEnterpriseSsoOpenParam,
  ]);

  return (
    <>
      <CollapsibleSection
        title={collapsibleSections.commonIssues.title}
        sectionTestId={collapsibleSections.commonIssues.testId}
        open={disclosureState.commonIssuesOpen}
        onToggle={(open) => setDisclosurePanelOpen("commonIssuesOpen", open)}
      >
        {renderHelpMarkdownSection(sections.commonIssuesMarkdown, entry, sourceDocPath)}
      </CollapsibleSection>

      <CollapsibleSection
        title={collapsibleSections.accountRecovery.title}
        sectionTestId={collapsibleSections.accountRecovery.testId}
        open={disclosureState.accountRecoveryOpen}
        onToggle={(open) => setDisclosurePanelOpen("accountRecoveryOpen", open)}
      >
        {renderHelpMarkdownSection(sections.accountRecoveryMarkdown, entry, sourceDocPath)}
      </CollapsibleSection>

      <CollapsibleSection
        title={collapsibleSections.acceptingInvitation.title}
        sectionTestId={collapsibleSections.acceptingInvitation.testId}
        open={disclosureState.acceptingInvitationOpen}
        onToggle={(open) => setDisclosurePanelOpen("acceptingInvitationOpen", open)}
      >
        {renderHelpMarkdownSection(sections.acceptingInvitationMarkdown, entry, sourceDocPath)}
      </CollapsibleSection>

      <CollapsibleSection
        title={collapsibleSections.enterpriseSso.title}
        sectionTestId={collapsibleSections.enterpriseSso.testId}
        open={disclosureState.enterpriseSsoOpen}
        onToggle={(open) => setDisclosurePanelOpen("enterpriseSsoOpen", open)}
      >
        {renderHelpMarkdownSection(sections.enterpriseSsoMarkdown, entry, sourceDocPath)}
      </CollapsibleSection>
    </>
  );
}
