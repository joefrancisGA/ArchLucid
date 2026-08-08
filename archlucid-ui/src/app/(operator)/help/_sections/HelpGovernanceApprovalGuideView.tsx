import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpGovernanceApprovalRoleGuide } from "@/app/(operator)/help/_sections/HelpGovernanceApprovalRoleGuide";
import { HelpGovernanceApprovalTechnicalReference } from "@/app/(operator)/help/_sections/HelpGovernanceApprovalTechnicalReference";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_DECISION_OUTCOMES,
  GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS,
  GOVERNANCE_APPROVAL_HELP_OVERVIEW,
  GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE,
  GOVERNANCE_APPROVAL_HELP_PAGE_TITLE,
  GOVERNANCE_APPROVAL_HELP_PREREQUISITES,
  GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_ROLES,
  GOVERNANCE_APPROVAL_HELP_STATUS_ROWS,
  GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING,
  GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS,
} from "@/lib/governance-approval-help-guide-content";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpGovernanceApprovalGuideViewProps = {
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

function GovernanceWorkflowStepper(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-governance-approval-workflow-stepper"
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0 xl:grid xl:grid-cols-3 xl:gap-3 2xl:grid-cols-6">
        {GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS.map((step, index) => (
          <li key={step} className="min-w-0">
            <div className="flex h-full flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {index + 1}
              </span>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RoleEntryCards(): React.ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="help-governance-approval-role-cards">
      {GOVERNANCE_APPROVAL_HELP_ROLES.map((role) => (
        <a
          key={role.id}
          href={`#${role.id}`}
          className="rounded-md border border-neutral-200 bg-white p-4 no-underline transition-colors hover:border-teal-600/40 hover:bg-teal-50/30 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-600/40 dark:hover:bg-teal-950/20"
        >
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{role.title}</h3>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{role.description}</p>
        </a>
      ))}
    </div>
  );
}

function StatusTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="help-governance-approval-status-table">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">Governance approval statuses</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Status
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Meaning
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Who can act
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Typical next step
            </th>
          </tr>
        </thead>
        <tbody>
          {GOVERNANCE_APPROVAL_HELP_STATUS_ROWS.map((row, index) => (
            <tr
              key={row.status}
              className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
            >
              <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <span className="inline-flex rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-900">
                  {row.status}
                </span>
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.meaning}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.whoCanAct}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Buyer-safe governance approval orientation for `/help/governance-approval`. */
export function HelpGovernanceApprovalGuideView(props: HelpGovernanceApprovalGuideViewProps): React.ReactElement {
  void props.entry;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-governance-approval-guide"
    >
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{GOVERNANCE_APPROVAL_HELP_PAGE_TITLE}</h1>
          <PageContextualHelpButton />
        </div>
        <p className={cn("m-0 max-w-[42rem]", OPERATOR_TYPOGRAPHY.helper)}>{GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE}</p>
      </header>
<div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-governance-approval-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Go to governance</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.href}>
                {GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openDashboard.href}>
                {GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openDashboard.label}
              </Link>
            </Button>
            <Link
              href={GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openRiskRegister.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openRiskRegister.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div
          className={cn("min-w-0 space-y-8", "max-w-[42rem] lg:max-w-none")}
          data-testid="help-governance-approval-primary"
        >
          <section aria-labelledby="overview-heading" className="space-y-3">
            <HelpSectionHeading id="overview">Overview</HelpSectionHeading>
            <p id="overview-heading" className="sr-only">
              Overview
            </p>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-governance-approval-overview">
              {GOVERNANCE_APPROVAL_HELP_OVERVIEW}
            </p>
            <RoleEntryCards />
          </section>

          <section
            aria-labelledby="governance-workflow-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="governance-workflow">Governance workflow</HelpSectionHeading>
            <p id="governance-workflow-heading" className="sr-only">
              Governance workflow
            </p>
            <GovernanceWorkflowStepper />
          </section>

          <section
            aria-labelledby="role-guides-heading"
            className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="role-guides">Role guides</HelpSectionHeading>
            <p id="role-guides-heading" className="sr-only">
              Role guides
            </p>
            <HelpGovernanceApprovalRoleGuide />
          </section>

          <section
            aria-labelledby="statuses-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="statuses">Statuses</HelpSectionHeading>
            <p id="statuses-heading" className="sr-only">
              Statuses
            </p>
            <StatusTable />
          </section>

          <section
            aria-labelledby="prerequisites-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="prerequisites">Prerequisites</HelpSectionHeading>
            <p id="prerequisites-heading" className="sr-only">
              Prerequisites
            </p>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="help-governance-approval-prerequisites">
              {GOVERNANCE_APPROVAL_HELP_PREREQUISITES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="decision-outcomes-heading"
            className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="decision-outcomes">Decision outcomes</HelpSectionHeading>
            <p id="decision-outcomes-heading" className="sr-only">
              Decision outcomes
            </p>
            <div className="grid gap-3 lg:grid-cols-3" data-testid="help-governance-approval-decision-outcomes">
              {GOVERNANCE_APPROVAL_HELP_DECISION_OUTCOMES.map((outcome) => (
                <div
                  key={outcome.outcome}
                  className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
                >
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{outcome.outcome}</h3>
                  <ul className="m-0 mt-2 list-disc space-y-1.5 pl-5">
                    {outcome.bullets.map((bullet) => (
                      <li key={bullet} className={OPERATOR_TYPOGRAPHY.body}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="common-actions-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="common-actions">Common actions</HelpSectionHeading>
            <p id="common-actions-heading" className="sr-only">
              Common actions
            </p>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-governance-approval-common-actions">
              {GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS.map((action) => (
                <div
                  key={action.label}
                  className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <Link
                    href={action.href}
                    className={cn("font-semibold underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                  >
                    {action.label}
                  </Link>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{action.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="troubleshooting-heading"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="troubleshooting">Troubleshooting</HelpSectionHeading>
            <p id="troubleshooting-heading" className="sr-only">
              Troubleshooting
            </p>
            <ul className="m-0 list-none space-y-3 p-0" data-testid="help-governance-approval-troubleshooting">
              {GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING.map((item) => (
                <li
                  key={item.issue}
                  className="rounded-md border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
                >
                  <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {item.issue}
                  </p>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
                    {item.resolution}
                    {item.href ? (
                      <>
                        {" "}
                        <Link href={item.href} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
                          Open governance resolution
                        </Link>
                        .
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <HelpTopicTableOfContents headings={GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>

      <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <HelpGovernanceApprovalTechnicalReference />
      </section>
    </article>
  );
}
