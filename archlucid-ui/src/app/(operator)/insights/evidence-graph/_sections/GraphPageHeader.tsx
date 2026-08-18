"use client";

import { EvidenceGraphBreadcrumb } from "@/components/insights/EvidenceGraphBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

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
      breadcrumb={<EvidenceGraphBreadcrumb />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="evidence-graph-header-actions">
          <PageContextualHelpButton />
        </div>
      }
    />
  );
}
