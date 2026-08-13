"use client";

import Link from "next/link";

import { HelpAuditTrailPageHeader } from "@/app/(operator)/help/_sections/HelpAuditTrailPageHeader";
import { HelpAuditTrailTechnicalReference } from "@/app/(operator)/help/_sections/HelpAuditTrailTechnicalReference";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AuditTrailHelpEvidenceOrientationStrip } from "@/components/help/AuditTrailHelpEvidenceOrientationStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import {
  AUDIT_TRAIL_HELP_ANATOMY_FIELDS,
  AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT,
  AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR,
  AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_INTRO,
  AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_ITEMS,
  AUDIT_TRAIL_HELP_GUIDE_HEADINGS,
  AUDIT_TRAIL_HELP_IMMUTABILITY_CLAIMS,
  AUDIT_TRAIL_HELP_IMMUTABILITY_INTRO,
  AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE,
  AUDIT_TRAIL_HELP_LIVE_VS_HELP_BODY,
  AUDIT_TRAIL_HELP_OVERVIEW,
  AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS,
  AUDIT_TRAIL_HELP_ROLE_GUIDANCE,
  AUDIT_TRAIL_HELP_WHAT_IS_BODY,
  auditTrailHelpPageSubtitle,
} from "@/lib/audit-trail-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
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

/** Buyer-safe audit trail orientation for `/help/audit-trail`. */
export function HelpAuditTrailGuideView(props: HelpAuditTrailGuideViewProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-audit-trail-guide"
    >
      <HelpTopicHashScroll />

      <HelpAuditTrailPageHeader entry={entry} subtitle={auditTrailHelpPageSubtitle(buyerPolishedShell)} />

      <AuditTrailHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-8", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-audit-trail-overview">
            {AUDIT_TRAIL_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="what-the-audit-trail-is-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-the-audit-trail-is">What the audit trail is</HelpSectionHeading>
            <p id="what-the-audit-trail-is-heading" className="sr-only">
              What the audit trail is
            </p>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_WHAT_IS_BODY}</p>
          </section>

          <section
            aria-labelledby="anatomy-of-an-entry-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="anatomy-of-an-entry">Anatomy of an audit trail entry</HelpSectionHeading>
            <p id="anatomy-of-an-entry-heading" className="sr-only">
              Anatomy of an audit trail entry
            </p>
            <AuditTrailAnatomyPanel />
          </section>

          <section
            aria-labelledby="immutability-and-export-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="help-audit-trail-immutability"
          >
            <HelpSectionHeading id="immutability-and-export">{AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE}</HelpSectionHeading>
            <p id="immutability-and-export-heading" className="sr-only">
              {AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE}
            </p>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_IMMUTABILITY_INTRO}</p>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-audit-trail-append-only-enforcement">
              {AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT}{" "}
              <Link
                href={`#${AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR}`}
                className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
              >
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
                    <Link
                      href={row.relatedGuidanceHref}
                      className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                    >
                      {row.relatedGuidanceLabel}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="evidence-trail-connection-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="evidence-trail-connection">Connection to the evidence trail</HelpSectionHeading>
            <p id="evidence-trail-connection-heading" className="sr-only">
              Connection to the evidence trail
            </p>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_INTRO}</p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="live-surface-vs-help-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="help-audit-trail-live-vs-help"
          >
            <HelpSectionHeading id="live-surface-vs-help">Live audit trail vs this help topic</HelpSectionHeading>
            <p id="live-surface-vs-help-heading" className="sr-only">
              Live audit trail vs this help topic
            </p>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{AUDIT_TRAIL_HELP_LIVE_VS_HELP_BODY}</p>
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
            <Link
              href={AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.href}
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              {AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS.label}
            </Link>
          </p>
        </div>

        <HelpTopicTableOfContents headings={AUDIT_TRAIL_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>

      <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <HelpAuditTrailTechnicalReference />
      </section>
    </article>
  );
}
