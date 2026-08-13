import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAuthenticationSignInActionPanel } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInActionPanel";
import { HelpAuthenticationSignInHeaderActions } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInHeaderActions";
import { AuthenticationSignInHelpEvidenceOrientationStrip } from "@/components/help/AuthenticationSignInHelpEvidenceOrientationStrip";
import { HelpTopicSignInFailureTriageLine } from "@/components/help/HelpTopicSignInFailureTriageLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS,
  splitAuthenticationSignInHelpMarkdown,
} from "@/lib/authentication-sign-in-help-guide-content";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAuthenticationSignInGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function renderHelpMarkdownSection(
  markdownSection: string,
  entry: ProductDocumentationEntry,
  sourceDocPath: string,
): React.ReactElement | null {
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

/** Sign-in orientation for `/help/authentication-sign-in` (HEU). */
export function HelpAuthenticationSignInGuideView(
  props: HelpAuthenticationSignInGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const sections = splitAuthenticationSignInHelpMarkdown(preparedMarkdown);
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const collapsibleSections = AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-authentication-sign-in-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={entry.title}
        titleTestId="help-authentication-sign-in-page-title"
        subtitle={
          <>
            <p className="m-0">{entry.summary}</p>
            <p
              className="m-0 mt-2 text-al-text-secondary"
              data-testid="help-authentication-sign-in-page-scope"
            >
              {AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE}
            </p>
          </>
        }
        subtitleClassName="max-w-3xl"
        navHref={AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-authentication-sign-in-breadcrumb"
            items={[
              { label: "Help", href: "/help" },
              { label: entry.title },
            ]}
          />
        }
        actions={<HelpAuthenticationSignInHeaderActions entry={entry} />}
      >
        <HelpTopicSignInFailureTriageLine />
      </OperatorPageHeader>

      <AuthenticationSignInHelpEvidenceOrientationStrip />

      <HelpAuthenticationSignInActionPanel />

      <div className={contentGridClass}>
        <div className={cn("min-w-0 space-y-4", HELP_PAGE_LAYOUT.contentColumn)}>
          <div data-testid="help-authentication-sign-in-first-viewport" className="space-y-4">
            {renderHelpMarkdownSection(sections.introMarkdown, entry, sourceDocPath)}
            {renderHelpMarkdownSection(sections.howSignInWorksMarkdown, entry, sourceDocPath)}
          </div>

          <div data-testid="help-authentication-sign-in-content" className="space-y-4">
            <CollapsibleSection
              title={collapsibleSections.commonIssues.title}
              sectionTestId={collapsibleSections.commonIssues.testId}
              defaultOpen={false}
            >
              {renderHelpMarkdownSection(sections.commonIssuesMarkdown, entry, sourceDocPath)}
            </CollapsibleSection>

            <CollapsibleSection
              title={collapsibleSections.accountRecovery.title}
              sectionTestId={collapsibleSections.accountRecovery.testId}
              defaultOpen={false}
            >
              {renderHelpMarkdownSection(sections.accountRecoveryMarkdown, entry, sourceDocPath)}
            </CollapsibleSection>

            <CollapsibleSection
              title={collapsibleSections.acceptingInvitation.title}
              sectionTestId={collapsibleSections.acceptingInvitation.testId}
              defaultOpen={false}
            >
              {renderHelpMarkdownSection(sections.acceptingInvitationMarkdown, entry, sourceDocPath)}
            </CollapsibleSection>

            <CollapsibleSection
              title={collapsibleSections.enterpriseSso.title}
              sectionTestId={collapsibleSections.enterpriseSso.testId}
              defaultOpen={false}
            >
              {renderHelpMarkdownSection(sections.enterpriseSsoMarkdown, entry, sourceDocPath)}
            </CollapsibleSection>

            {renderHelpMarkdownSection(sections.securityPrivacyMarkdown, entry, sourceDocPath)}
            {renderHelpMarkdownSection(sections.relatedMarkdown, entry, sourceDocPath)}
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
