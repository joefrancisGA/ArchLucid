"use client";

import Link from "next/link";

import { HelpAuditTrailPageHeader } from "@/app/(operator)/help/_sections/HelpAuditTrailPageHeader";
import { HelpAuditTrailSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpAuditTrailSourcesOrientationStrip";
import { HelpAuditTrailTechnicalReference } from "@/app/(operator)/help/_sections/HelpAuditTrailTechnicalReference";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AuditTrailHelpClaimDisciplineStrip } from "@/components/help/AuditTrailHelpClaimDisciplineStrip";
import { AuditTrailHelpEvidenceOrientationStrip } from "@/components/help/AuditTrailHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  AUDIT_TRAIL_HELP_ACTION_PANEL_INTRO,
  AUDIT_TRAIL_HELP_ANATOMY_FIELDS,
  AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT,
  AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR,
  AUDIT_TRAIL_HELP_CANONICAL_PATH,
  AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_INTRO,
  AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_ITEMS,
  AUDIT_TRAIL_HELP_GUIDE_HEADINGS,
  AUDIT_TRAIL_HELP_IMMUTABILITY_CLAIMS,
  AUDIT_TRAIL_HELP_IMMUTABILITY_INTRO,
  AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE,
  AUDIT_TRAIL_HELP_LIVE_VS_HELP_BODY,
  AUDIT_TRAIL_HELP_OVERVIEW,
  AUDIT_TRAIL_HELP_PAGE_TITLE,
  AUDIT_TRAIL_HELP_PRIMARY_ACTIONS,
  AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS,
  AUDIT_TRAIL_HELP_ROLE_GUIDANCE,
  AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF,
  AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_LABEL,
  AUDIT_TRAIL_HELP_WHAT_IS_BODY,
  auditTrailHelpPageSubtitle,
} from "@/lib/audit-trail-help-guide-content";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_CLAIM_HEADING_ID,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  AUDIT_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID,
  AUDIT_TRAIL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AUDIT_TRAIL_HELP_PRIMARY_CONTENT_ID,
  AUDIT_TRAIL_HELP_SKIP_LINK_LABEL,
  AUDIT_TRAIL_HELP_SKIP_TARGET_ID,
  AUDIT_TRAIL_HELP_START_HERE_CARD_TITLE,
} from "@/lib/audit-trail-help-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAuditTrailGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.JSX.Element {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function AuditTrailAnatomyPanel(): React.JSX.Element {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-audit-trail-anatomy-panel"
    >
      <p
        className={cn(
          "m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.label,
        )}
      >
        Example audit trail entry
      </p>
      <dl className="m-0 grid gap-3 sm:grid-cols-2">
        {AUDIT_TRAIL_HELP_ANATOMY_FIELDS.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {field.label}
            </dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{field.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AuditTrailStartHerePanel(): React.JSX.Element {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-audit-trail-action-panel"
      aria-labelledby="help-audit-trail-action-panel-heading"
    >
      <h2
        id="help-audit-trail-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {AUDIT_TRAIL_HELP_START_HERE_CARD_TITLE}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_ACTION_PANEL_INTRO}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary" data-testid="help-audit-trail-header-open-audit-trail">
          <Link href={AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.href}>
            {AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
          </Link>
        </Button>
        <Link href={AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.governanceApproval.href} className={OPERATOR_LINK.nav}>
          {AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.governanceApproval.label}
        </Link>
      </div>
    </section>
  );
}

function HelpAuditTrailGuideBody(props: { readonly readingBodyClass: string }): React.JSX.Element {
  const { readingBodyClass } = props;

  return (
    <>
      <p className={readingBodyClass} data-testid="help-audit-trail-overview">
        {AUDIT_TRAIL_HELP_OVERVIEW}
      </p>

      <section
        aria-labelledby="what-the-audit-trail-is-heading"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="what-the-audit-trail-is">What the audit trail is</HelpSectionHeading>
        <p id="what-the-audit-trail-is-heading" className="sr-only">
          What the audit trail is
        </p>
        <p className={readingBodyClass}>{AUDIT_TRAIL_HELP_WHAT_IS_BODY}</p>
      </section>

      <section
        aria-labelledby="anatomy-of-an-entry-heading"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="anatomy-of-an-entry">Anatomy of an audit trail entry</HelpSectionHeading>
        <p id="anatomy-of-an-entry-heading" className="sr-only">
          Anatomy of an audit trail entry
        </p>
        <AuditTrailAnatomyPanel />
      </section>

      <section
        aria-labelledby="immutability-and-export-heading"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
        data-testid="help-audit-trail-immutability"
      >
        <HelpSectionHeading id="immutability-and-export">{AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE}</HelpSectionHeading>
        <p id="immutability-and-export-heading" className="sr-only">
          {AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE}
        </p>
        <p className={readingBodyClass}>{AUDIT_TRAIL_HELP_IMMUTABILITY_INTRO}</p>
        <p className={readingBodyClass} data-testid="help-audit-trail-append-only-enforcement">
          {AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT}{" "}
          <Link href={`#${AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR}`} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Technical reference
          </Link>
          .
        </p>
        <ul className="m-0 list-none space-y-3 p-0" data-testid="help-audit-trail-immutability-claims">
          {AUDIT_TRAIL_HELP_IMMUTABILITY_CLAIMS.map((row) => (
            <li
              key={row.claim}
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{row.claim}</p>
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.label)}>
                Related guidance:{" "}
                <Link href={row.relatedGuidanceHref} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                  {row.relatedGuidanceLabel}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="evidence-trail-connection-heading"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <HelpSectionHeading id="evidence-trail-connection">Connection to the evidence trail</HelpSectionHeading>
        <p id="evidence-trail-connection-heading" className="sr-only">
          Connection to the evidence trail
        </p>
        <p className={readingBodyClass}>{AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_INTRO}</p>
        <ul className={HELP_PAGE_LAYOUT.bulletList}>
          {AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="live-surface-vs-help-heading"
        className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
        data-testid="help-audit-trail-live-vs-help"
      >
        <HelpSectionHeading id="live-surface-vs-help">Live audit trail vs this help topic</HelpSectionHeading>
        <p id="live-surface-vs-help-heading" className="sr-only">
          Live audit trail vs this help topic
        </p>
        <p className={readingBodyClass}>{AUDIT_TRAIL_HELP_LIVE_VS_HELP_BODY}</p>
      </section>

      <section
        aria-labelledby="role-guidance-heading"
        className="space-y-3 border-t border-neutral-200 pb-2 dark:border-neutral-800"
      >
        <HelpSectionHeading id="role-guidance">What each role usually does</HelpSectionHeading>
        <p id="role-guidance-heading" className="sr-only">
          What each role usually does
        </p>
        <div className="grid gap-3 sm:grid-cols-2" data-testid="help-audit-trail-role-guidance">
          {AUDIT_TRAIL_HELP_ROLE_GUIDANCE.map((roleEntry) => (
            <div
              key={roleEntry.role}
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            >
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{roleEntry.role}</h3>
              <p className={cn("m-0 mt-1 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{roleEntry.guidance}</p>
            </div>
          ))}
        </div>
      </section>

      <p className={cn("m-0 pt-2", OPERATOR_TYPOGRAPHY.label)}>
        <Link href={AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          {AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.label}
        </Link>
      </p>
    </>
  );
}

/** Buyer-safe audit trail orientation for `/help/audit-trail`. */
export function HelpAuditTrailGuideView(props: HelpAuditTrailGuideViewProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "audit-trail-help",
    AUDIT_TRAIL_HELP_GUIDE_HEADINGS,
    AUDIT_TRAIL_HELP_CLAIM_HEADING_ID,
  );
  const tocHeadings = buyerPolishedShell
    ? guideHeadings.filter((heading) => heading.id !== "where-to-go-next")
    : guideHeadings;
  const contentGridClass = resolveHelpPageContentGridClass(tocHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-audit-trail-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${AUDIT_TRAIL_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {AUDIT_TRAIL_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      <div
        id={AUDIT_TRAIL_HELP_PRIMARY_CONTENT_ID}
        data-testid={AUDIT_TRAIL_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={AUDIT_TRAIL_HELP_PAGE_TITLE}
            titleTestId="help-audit-trail-page-title"
            subtitle={auditTrailHelpPageSubtitle(true)}
            navHref={AUDIT_TRAIL_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={AUDIT_TRAIL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            metadata={
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)} data-testid="help-audit-trail-source-of-record">
                Related topic:{" "}
                <Link
                  href={AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF}
                  className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                >
                  {AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_LABEL}
                </Link>
              </span>
            }
          />
        ) : (
          <>
            <HelpAuditTrailPageHeader entry={entry} subtitle={auditTrailHelpPageSubtitle(false)} />
            <AuditTrailHelpClaimDisciplineStrip />
          </>
        )}

        {buyerPolishedShell ? (
          <div
            id={AUDIT_TRAIL_HELP_SKIP_TARGET_ID}
            data-testid={AUDIT_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <AuditTrailStartHerePanel />
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {!buyerPolishedShell ? <AuditTrailHelpEvidenceOrientationStrip /> : null}

            <HelpAuditTrailGuideBody readingBodyClass={readingBodyClass} />
          </div>

          <HelpTopicTableOfContents headings={tocHeadings} enableScrollSpy={!buyerPolishedShell} />
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-audit-trail-orientation-bottom">
            <HelpAuditTrailSourcesOrientationStrip />
          </div>
        ) : null}

        <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <HelpAuditTrailTechnicalReference />
        </section>
      </div>
    </article>
  );
}
