import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTroubleshootingAdvancedDiagnostics } from "@/app/(operator)/help/_sections/HelpTroubleshootingAdvancedDiagnostics";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { TroubleshootingCommonIssuesList } from "@/components/help/TroubleshootingCommonIssuesList";
import { TroubleshootingHelpEvidenceOrientationStrip } from "@/components/help/TroubleshootingHelpEvidenceOrientationStrip";
import { TroubleshootingStartHerePlatformStatus } from "@/components/help/TroubleshootingStartHerePlatformStatus";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  TROUBLESHOOTING_BEFORE_CONTACT_ITEMS,
  TROUBLESHOOTING_DECISION_TREE_STEPS,
  TROUBLESHOOTING_GUIDE_HEADINGS,
  TROUBLESHOOTING_PRIMARY_ACTIONS,
  TROUBLESHOOTING_START_HERE_ITEMS,
  TROUBLESHOOTING_HELP_SUBTITLE,
} from "@/lib/troubleshooting-help-guide-content";
import { EvidenceOrientationMetaLine } from "@/components/evidence-orientation/EvidenceOrientationMetaLine";
import {
  TROUBLESHOOTING_HELP_APPLICABILITY,
  TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL,
  TROUBLESHOOTING_SUPPORT_EXPECTATIONS,
} from "@/lib/troubleshooting-help-evidence-copy";
import {
  inAppHelpHref,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

type HelpTroubleshootingGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 mt-10 first:mt-0")}
    >
      {props.children}
    </h2>
  );
}

/** Buyer-safe troubleshooting guide for `/help/troubleshooting`. */
export function HelpTroubleshootingGuideView(props: HelpTroubleshootingGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-troubleshooting-guide">
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <HelpTopicTitleRow title={entry.title} actions={<PageContextualHelpButton />} />
        <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{TROUBLESHOOTING_HELP_SUBTITLE}</p>
      </header>
      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <Card
            id="start-here"
            className={cn(
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "border-neutral-200 bg-al-surface-raised dark:border-neutral-800",
            )}
            data-testid="troubleshooting-start-here-card"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Start here</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
              <TroubleshootingStartHerePlatformStatus />
              <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                {TROUBLESHOOTING_START_HERE_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={TROUBLESHOOTING_PRIMARY_ACTIONS.systemHealth.href}>
                    {TROUBLESHOOTING_PRIMARY_ACTIONS.systemHealth.label}
                  </Link>
                </Button>
                <SupportBundleDownloadButton showContentsDisclosure />
                <Button asChild size="sm" variant="outline">
                  <a href={TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.href}>
                    {TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.label}
                  </a>
                </Button>
              </div>
              <p
                className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="troubleshooting-support-expectations-start-here"
              >
                {TROUBLESHOOTING_SUPPORT_EXPECTATIONS}{" "}
                <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("report-a-problem")}>
                  Report a problem
                </Link>
              </p>
            </CardContent>
          </Card>

          <section aria-labelledby="common-issues" className="space-y-3">
            <HelpSectionHeading id="common-issues">Common issues</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Expand the symptom that matches what you see. Each card shows who can usually fix it and where to go next.
            </p>
            <TroubleshootingCommonIssuesList />
          </section>

          <section aria-labelledby="decision-tree" className="space-y-4">
            <HelpSectionHeading id="decision-tree">Decision tree</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Use this guided triage when quick fixes did not resolve the issue.
            </p>
            <ol className="m-0 list-none space-y-4 p-0" data-testid="troubleshooting-decision-tree">
              {TROUBLESHOOTING_DECISION_TREE_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  id={step.id}
                  className={cn(
                    "rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
                    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  )}
                >
                  <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {index + 1}. {step.question}
                  </p>
                  <ul className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
                    {step.branches.map((branch) => (
                      <li key={`${step.id}-${branch.label}`} className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-al-text-primary">{branch.label}</span>
                        <span aria-hidden className="text-al-text-secondary">
                          →
                        </span>
                        <Link
                          href={branch.href}
                          className={OPERATOR_BODY_INLINE_LINK_CLASS}
                        >
                          {branch.linkLabel}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="before-contacting-support" className="space-y-3">
            <HelpSectionHeading id="before-contacting-support">Before contacting support</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Collect these details before you email support. A support bundle helps support reproduce platform issues
              faster.
            </p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {TROUBLESHOOTING_BEFORE_CONTACT_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-start gap-2">
              <SupportBundleDownloadButton showContentsDisclosure />
              <Button asChild size="sm" variant="outline">
                <a href={TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.href}>
                  {TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.label}
                </a>
              </Button>
            </div>
            <p
              className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="troubleshooting-support-expectations"
            >
              {TROUBLESHOOTING_SUPPORT_EXPECTATIONS}{" "}
              <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("report-a-problem")}>
                Report a problem
              </Link>
            </p>
          </section>

          <HelpLazyDetails
            id="advanced-diagnostics"
            className={cn(HELP_PAGE_LAYOUT.details, OPERATOR_SHELL_SCROLL_OFFSET_CLASS)}
            data-testid="troubleshooting-advanced-diagnostics"
            summaryClassName={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}
            summary="Advanced diagnostics"
            bodyClassName={cn(HELP_PAGE_LAYOUT.detailsBody, "space-y-4")}
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Technical checks for workspace administrators and support. Most users should start with the quick fixes
              and decision tree above.
            </p>
            <HelpTroubleshootingAdvancedDiagnostics />
          </HelpLazyDetails>

          <TroubleshootingHelpEvidenceOrientationStrip />

          <EvidenceOrientationMetaLine
            testId="troubleshooting-help-freshness"
            label={TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL}
            text={TROUBLESHOOTING_HELP_APPLICABILITY}
          />
        </div>

        <HelpTopicTableOfContents headings={TROUBLESHOOTING_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
