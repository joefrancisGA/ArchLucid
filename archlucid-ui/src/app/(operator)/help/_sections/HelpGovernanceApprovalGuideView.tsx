import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpGovernanceApprovalRoleGuide } from "@/app/(operator)/help/_sections/HelpGovernanceApprovalRoleGuide";
import { HelpGovernanceApprovalTechnicalReference } from "@/app/(operator)/help/_sections/HelpGovernanceApprovalTechnicalReference";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE,
  GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_DECISION_OUTCOMES,
  GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE,
  GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY,
  GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS,
  GOVERNANCE_APPROVAL_HELP_OVERVIEW,
  GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE,
  GOVERNANCE_APPROVAL_HELP_PAGE_TITLE,
  GOVERNANCE_APPROVAL_HELP_PREREQUISITES,
  GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_ROLES,
  GOVERNANCE_APPROVAL_HELP_STATUS_PHASES,
  GOVERNANCE_APPROVAL_HELP_STATUS_ROWS,
  GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING,
  GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS,
} from "@/lib/governance/governance-approval-help-guide-content";
import { GovernanceApprovalHelpEvidenceOrientationStrip } from "@/components/help/GovernanceApprovalHelpEvidenceOrientationStrip";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
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
    <div className="space-y-4">
      <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="help-governance-approval-status-table">
        <table className={HELP_PAGE_LAYOUT.table}>
          <caption className="sr-only">Resolve outcomes statuses</caption>
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
                  <StatusTag kind={row.kind} label={row.status} />
                </th>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.meaning}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.whoCanAct}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div data-testid="help-governance-approval-status-phases">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Phases and outcomes, not statuses</h3>
        <ul className={cn("m-0 mt-2", HELP_PAGE_LAYOUT.bulletList)}>
          {GOVERNANCE_APPROVAL_HELP_STATUS_PHASES.map((phase) => (
            <li key={phase.phase}>
              <span className="font-semibold text-al-text-primary">{phase.phase}</span>
              {": "}
              {phase.meaning}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TroubleshootingList(): React.ReactElement {
  return (
    <ul className="m-0 list-none space-y-2 p-0" data-testid="help-governance-approval-troubleshooting">
      {GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING.map((item) => (
        <li key={item.issue}>
          <details className={cn(DESIGN_TOKENS.surface.card, "group p-3")}>
            <summary
              className={cn(
                "cursor-pointer list-none font-semibold text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
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
      ))}
    </ul>
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
        <HelpTopicTitleRow title={GOVERNANCE_APPROVAL_HELP_PAGE_TITLE} actions={<PageContextualHelpButton />} />
        <p className={cn("m-0 max-w-[42rem]", OPERATOR_TYPOGRAPHY.helper)}>{GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE}</p>
      </header>

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-governance-approval-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE}
            </CardTitle>
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
              href={GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openFindings.href}
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
            >
              {GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openFindings.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div
          className={cn("min-w-0 space-y-8", "max-w-[42rem] lg:max-w-none")}
          data-testid="help-governance-approval-primary"
        >
          <section aria-labelledby="overview" className="space-y-3">
            <HelpSectionHeading id="overview">Overview</HelpSectionHeading>
            <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-governance-approval-overview">
              {GOVERNANCE_APPROVAL_HELP_OVERVIEW}
            </p>
            <RoleEntryCards />
          </section>

          <section
            aria-labelledby="governance-workflow"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="governance-workflow">Resolve outcomes workflow</HelpSectionHeading>
            <GovernanceWorkflowStepper />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY}</p>
            <div
              className={cn(
                "space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="help-governance-approval-state-diagram"
            >
              <MermaidDiagram
                source={GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE}
                accessibleName="Resolve outcomes state diagram"
              />
            </div>
          </section>

          <section
            aria-labelledby="role-guides"
            className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="role-guides">Role guides</HelpSectionHeading>
            <HelpGovernanceApprovalRoleGuide />
          </section>

          <section
            aria-labelledby="statuses"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="statuses">Statuses</HelpSectionHeading>
            <StatusTable />
          </section>

          <section
            aria-labelledby="prerequisites"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="prerequisites">Prerequisites</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="help-governance-approval-prerequisites">
              {GOVERNANCE_APPROVAL_HELP_PREREQUISITES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="decision-outcomes"
            className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="decision-outcomes">Decision outcomes</HelpSectionHeading>
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
            aria-labelledby="common-actions"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="common-actions">Common actions</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-governance-approval-common-actions">
              {GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS.map((action) => (
                <div
                  key={action.href}
                  className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <Link
                    href={action.href}
                    className={OPERATOR_BODY_INLINE_LINK_CLASS}
                  >
                    {action.label}
                  </Link>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{action.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="troubleshooting"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="troubleshooting">Troubleshooting</HelpSectionHeading>
            <TroubleshootingList />
          </section>

          <GovernanceApprovalHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>

      <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <HelpGovernanceApprovalTechnicalReference />
      </section>
    </article>
  );
}
