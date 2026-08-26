import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { FindingsHelpClaimDisciplineStrip } from "@/components/help/FindingsHelpClaimDisciplineStrip";
import { FindingsHelpEvidenceOrientationStrip } from "@/components/help/FindingsHelpEvidenceOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpFindingsWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpFindingsWorkspaceReadinessStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { SeverityTag } from "@/components/ui/severity-tag";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  FINDINGS_HELP_ACTIONS,
  FINDINGS_HELP_ACTIONS_INTRO,
  FINDINGS_HELP_ANATOMY_FIELDS,
  FINDINGS_HELP_CLAIM_HEADING_ID,
  FINDINGS_HELP_RELATED_PRODUCT_DOCS,
  FINDINGS_HELP_EVIDENCE_ACTIONS,
  FINDINGS_HELP_EVIDENCE_INTRO,
  FINDINGS_HELP_EVIDENCE_ITEMS,
  FINDINGS_HELP_GOVERNANCE_INTRO,
  FINDINGS_HELP_GOVERNANCE_ITEMS,
  FINDINGS_HELP_GUIDE_HEADINGS,
  FINDINGS_HELP_LIFECYCLE_STAGES,
  FINDINGS_HELP_OVERVIEW,
  FINDINGS_HELP_PAGE_SUBTITLE,
  FINDINGS_HELP_PAGE_TITLE,
  FINDINGS_HELP_PRIMARY_ACTIONS,
  FINDINGS_HELP_PROVENANCE_AXES,
  FINDINGS_HELP_PROVENANCE_INTRO,
  FINDINGS_HELP_PROVENANCE_NON_CLAIM,
  FINDINGS_HELP_PROVENANCE_ORIGINS,
  FINDINGS_HELP_PROVENANCE_TITLE,
  FINDINGS_HELP_RESPOND_INTRO,
  FINDINGS_HELP_ROLE_GUIDANCE,
  FINDINGS_HELP_SEVERITY_INTRO,
  FINDINGS_HELP_SEVERITY_ROWS,
  FINDINGS_HELP_WHAT_IS_BODY,
} from "@/lib/findings/findings-help-guide-content";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpFindingsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function FindingsAnatomyPanel(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-findings-anatomy-panel"
    >
      <p className={cn("m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
        Example finding
      </p>
      <dl className="m-0 grid gap-3 sm:grid-cols-2">
        {FINDINGS_HELP_ANATOMY_FIELDS.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{field.label}</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{field.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SeverityTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="help-findings-severity-table">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">Finding severity levels</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Severity
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Meaning
            </th>
          </tr>
        </thead>
        <tbody>
          {FINDINGS_HELP_SEVERITY_ROWS.map((row, index) => (
            <tr
              key={row.level}
              className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
            >
              <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <SeverityTag severity={row.level} />
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LifecycleList(): React.ReactElement {
  return (
    <ol className="m-0 list-none space-y-2 p-0" data-testid="help-findings-lifecycle">
      {FINDINGS_HELP_LIFECYCLE_STAGES.map((stage) => (
        <li
          key={stage.status}
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{stage.status}</p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{stage.meaning}</p>
        </li>
      ))}
    </ol>
  );
}

/** Buyer-safe findings orientation for `/help/findings`. */
export function HelpFindingsGuideView(props: HelpFindingsGuideViewProps): React.ReactElement {
  void props.entry;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "findings-help",
    FINDINGS_HELP_GUIDE_HEADINGS,
    FINDINGS_HELP_CLAIM_HEADING_ID,
  );

  return (
    <article className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)} data-testid="help-findings-guide">
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <HelpTopicTitleRow title={FINDINGS_HELP_PAGE_TITLE} actions={<PageContextualHelpButton />} />
        <p className={cn("m-0 max-w-[42rem]", OPERATOR_TYPOGRAPHY.helper)}>{FINDINGS_HELP_PAGE_SUBTITLE}</p>
      </header>

      <FindingsHelpClaimDisciplineStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-8", "max-w-[42rem] lg:max-w-none")}>
          <FindingsHelpEvidenceOrientationStrip />

          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-findings-overview">
            {FINDINGS_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-findings-action-panel"
            aria-labelledby="help-findings-action-panel-heading"
          >
            <h2
              id="help-findings-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Go to findings
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.href}>
                  {FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={FINDINGS_HELP_PRIMARY_ACTIONS.searchEvidence.href}>
                  {FINDINGS_HELP_PRIMARY_ACTIONS.searchEvidence.label}
                </Link>
              </Button>
              <Link
                href={FINDINGS_HELP_PRIMARY_ACTIONS.governanceDecisions.href}
                className={cn("inline-flex min-h-6 items-center py-1", OPERATOR_BODY_INLINE_LINK_CLASS)}
              >
                {FINDINGS_HELP_PRIMARY_ACTIONS.governanceDecisions.label}
              </Link>
            </div>
          </section>

          <HelpFindingsWorkspaceReadinessStrip />

          <section
            aria-labelledby="what-a-finding-is"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-a-finding-is">What a finding is</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_WHAT_IS_BODY}</p>
          </section>

          <section
            aria-labelledby="anatomy-of-a-finding"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="anatomy-of-a-finding">Anatomy of a finding</HelpSectionHeading>
            <FindingsAnatomyPanel />
          </section>

          <section
            aria-labelledby="where-findings-come-from"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="help-findings-provenance"
          >
            <HelpSectionHeading id="where-findings-come-from">{FINDINGS_HELP_PROVENANCE_TITLE}</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_PROVENANCE_INTRO}</p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {FINDINGS_HELP_PROVENANCE_AXES.map((row) => (
                <li key={row.axis}>
                  <span className="font-semibold">{row.axis}</span>
                  {" — "}
                  {row.answers} ({row.values})
                </li>
              ))}
            </ul>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {FINDINGS_HELP_PROVENANCE_ORIGINS.map((row) => (
                <li key={row.origin}>
                  <span className="font-semibold">{row.origin}</span>
                  {" — "}
                  {row.description}
                </li>
              ))}
            </ul>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_PROVENANCE_NON_CLAIM}</p>
          </section>

          <section
            aria-labelledby="severity-and-impact"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="severity-and-impact">Severity and impact</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_SEVERITY_INTRO}</p>
            <SeverityTable />
          </section>

          <section
            aria-labelledby="inspect-the-evidence"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="inspect-the-evidence">Inspect the evidence</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_EVIDENCE_INTRO}</p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {FINDINGS_HELP_EVIDENCE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-findings-evidence-actions">
              {FINDINGS_HELP_EVIDENCE_ACTIONS.map((action) => (
                <div
                  key={action.label}
                  className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <Link
                    href={action.href}
                    className={cn("inline-flex min-h-6 items-center py-1 font-semibold", OPERATOR_BODY_INLINE_LINK_CLASS)}
                  >
                    {action.label}
                  </Link>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{action.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="respond-to-a-finding"
            className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="respond-to-a-finding">Respond to a finding</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_RESPOND_INTRO}</p>
            <LifecycleList />
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_ACTIONS_INTRO}</p>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="help-findings-actions-list">
              {FINDINGS_HELP_ACTIONS.map((item) => (
                <li key={item.action}>
                  <span className="font-semibold">{item.action}</span>
                  {" — "}
                  {item.detail}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="findings-and-governance"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="findings-and-governance">Findings and approval</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{FINDINGS_HELP_GOVERNANCE_INTRO}</p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {FINDINGS_HELP_GOVERNANCE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="role-guidance"
            className="space-y-3 border-t border-neutral-200 pb-2 dark:border-neutral-800"
          >
            <HelpSectionHeading id="role-guidance">What each role usually does</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-findings-role-guidance">
              {FINDINGS_HELP_ROLE_GUIDANCE.map((entry) => (
                <div
                  key={entry.role}
                  className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
                >
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{entry.role}</h3>
                  <p className={cn("m-0 mt-1 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{entry.guidance}</p>
                </div>
              ))}
            </div>
          </section>

          <p className={cn("m-0 pt-2", OPERATOR_TYPOGRAPHY.label)}>
            <Link
              href={FINDINGS_HELP_RELATED_PRODUCT_DOCS.href}
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
            >
              {FINDINGS_HELP_RELATED_PRODUCT_DOCS.label}
            </Link>
          </p>
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} enableScrollSpy />
      </div>
    </article>
  );
}
