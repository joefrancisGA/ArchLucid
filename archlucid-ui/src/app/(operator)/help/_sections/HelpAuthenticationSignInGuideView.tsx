import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAuthenticationSignInActionPanel } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInActionPanel";
import { HelpAuthenticationSignInHeaderActions } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInHeaderActions";
import { HelpAuthenticationSignInRelatedTopics } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInRelatedTopics";
import { HelpAuthenticationSignInSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInSourcesOrientationStrip";
import { AuthenticationSignInHelpEvidenceOrientationStrip } from "@/components/help/AuthenticationSignInHelpEvidenceOrientationStrip";
import { HelpTopicSignInFailureTriageLine } from "@/components/help/HelpTopicSignInFailureTriageLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { HelpAuthenticationSignInCollapsibleSections } from "./HelpAuthenticationSignInCollapsibleSections";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH,
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_FIRST_VIEWPORT_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_LEAD,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_SUBTITLE_BUYER,
  AUTHENTICATION_SIGN_IN_HELP_PRIMARY_CONTENT_ID,
  AUTHENTICATION_SIGN_IN_HELP_SKIP_LINK_LABEL,
  AUTHENTICATION_SIGN_IN_HELP_SKIP_TARGET_ID,
  AUTHENTICATION_SIGN_IN_HELP_START_HERE_HELPER,
} from "@/lib/authentication-sign-in-help-page-copy";
import { splitAuthenticationSignInHelpMarkdown } from "@/lib/authentication-sign-in-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { appendHelpClaimDisciplineTocHeadings, extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
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

function authenticationSignInHelpPageSubtitle(
  entry: ProductDocumentationEntry,
  buyerPolishedShell: boolean,
): React.ReactNode {
  if (buyerPolishedShell) {
    return AUTHENTICATION_SIGN_IN_HELP_PAGE_SUBTITLE_BUYER;
  }

  return (
    <>
      <p className="m-0">{entry.summary}</p>
      <p className="m-0 mt-2 text-al-text-secondary" data-testid="help-authentication-sign-in-page-scope">
        {AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE}
      </p>
    </>
  );
}

/** Sign-in orientation for `/help/authentication-sign-in` (HEA). */
export function HelpAuthenticationSignInGuideView(
  props: HelpAuthenticationSignInGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const sections = splitAuthenticationSignInHelpMarkdown(preparedMarkdown);
  const headings = appendHelpClaimDisciplineTocHeadings(
    extractHelpMarkdownHeadings(preparedMarkdown).filter((heading) => heading.id !== "related"),
    AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID,
  );
  const showSectionNav = !buyerPolishedShell && headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? headings.length : 0);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  const pageBody = (
    <>
      <OperatorPageHeader
        title={entry.title}
        titleTestId="help-authentication-sign-in-page-title"
        subtitle={authenticationSignInHelpPageSubtitle(entry, buyerPolishedShell)}
        subtitleClassName="max-w-3xl"
        navHref={AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH}
        headingLevel="h1"
        claimDiscipline={buyerPolishedShell ? AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId={
          buyerPolishedShell ? AUTHENTICATION_SIGN_IN_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
        }
        actions={buyerPolishedShell ? undefined : <HelpAuthenticationSignInHeaderActions entry={entry} />}
      >
        {buyerPolishedShell ? null : <HelpTopicSignInFailureTriageLine />}
      </OperatorPageHeader>

      {buyerPolishedShell ? (
        <div
          id={AUTHENTICATION_SIGN_IN_HELP_SKIP_TARGET_ID}
          data-testid={AUTHENTICATION_SIGN_IN_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <div className="space-y-4" data-testid="help-authentication-sign-in-buyer-intro">
            <p className={readingBodyClass} data-testid="help-authentication-sign-in-intro">
              {AUTHENTICATION_SIGN_IN_HELP_PAGE_LEAD}
            </p>
          </div>
          <HelpAuthenticationSignInActionPanel />
          <p
            className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-authentication-sign-in-start-here-helper"
          >
            {AUTHENTICATION_SIGN_IN_HELP_START_HERE_HELPER}
          </p>
        </div>
      ) : (
        <HelpAuthenticationSignInActionPanel />
      )}

      <div className={contentGridClass}>
        <div className={cn("min-w-0 space-y-4", HELP_PAGE_LAYOUT.contentColumn)}>
          <div data-testid="help-authentication-sign-in-first-viewport" className="space-y-4">
            {renderHelpMarkdownSection(sections.introMarkdown, entry, sourceDocPath)}
            {renderHelpMarkdownSection(sections.howSignInWorksMarkdown, entry, sourceDocPath)}
          </div>

          <div data-testid="help-authentication-sign-in-content" className="space-y-4">
            <HelpAuthenticationSignInCollapsibleSections
              entry={entry}
              sourceDocPath={sourceDocPath}
              sections={sections}
            />

            {renderHelpMarkdownSection(sections.securityPrivacyMarkdown, entry, sourceDocPath)}
            {buyerPolishedShell ? null : <HelpAuthenticationSignInRelatedTopics />}
            {buyerPolishedShell ? null : <AuthenticationSignInHelpEvidenceOrientationStrip />}
          </div>
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
      </div>

      {buyerPolishedShell ? (
        <div data-testid={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID}>
          <HelpAuthenticationSignInSourcesOrientationStrip />
        </div>
      ) : null}
    </>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-authentication-sign-in-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${AUTHENTICATION_SIGN_IN_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {AUTHENTICATION_SIGN_IN_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerPolishedShell ? (
        <div
          id={AUTHENTICATION_SIGN_IN_HELP_PRIMARY_CONTENT_ID}
          data-testid={AUTHENTICATION_SIGN_IN_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          {pageBody}
        </div>
      ) : (
        pageBody
      )}
    </article>
  );
}
