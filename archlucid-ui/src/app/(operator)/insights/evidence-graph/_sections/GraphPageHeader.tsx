"use client";

import { EvidenceGraphBreadcrumb } from "@/components/insights/EvidenceGraphBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { EVIDENCE_GRAPH_CLAIM_DISCIPLINE } from "@/lib/evidence-graph-evidence-copy";
import { EVIDENCE_GRAPH_PAGE_SHORTCUTS } from "@/lib/evidence-graph-page-shortcuts";

export type GraphPageHeaderProps = {
  readonly title: string;
  readonly subtitle: string;
};

/** Shared `/insights/evidence-graph` hero — breadcrumb, help, and buyer-safe subtitle. */
export function GraphPageHeader(props: GraphPageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      navHref={EVIDENCE_GRAPH_PATH}
      title={props.title}
      titleTestId="evidence-graph-page-title"
      subtitle={props.subtitle}
      claimDiscipline={EVIDENCE_GRAPH_CLAIM_DISCIPLINE}
      claimDisciplineTestId="evidence-graph-claim-discipline"
      breadcrumb={<EvidenceGraphBreadcrumb />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="evidence-graph-header-actions">
          <PageShortcutsDisclosure
            testId="evidence-graph-page-shortcuts"
            entries={EVIDENCE_GRAPH_PAGE_SHORTCUTS}
          />
          <PageContextualHelpButton />
        </div>
      }
    />
  );
}
