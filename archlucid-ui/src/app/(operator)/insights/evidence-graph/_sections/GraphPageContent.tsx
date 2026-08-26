"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { GraphPageVocabularyRails } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageVocabularyRails";
import { EvidenceGraphFirstOpenCoach } from "@/components/EvidenceGraphFirstOpenCoach";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  EVIDENCE_GRAPH_PRIMARY_CONTENT_ID,
  EVIDENCE_GRAPH_SKIP_LINK_LABEL,
} from "@/lib/evidence-graph-page-copy";
import { GraphEvidenceTrailGuidanceDisclosure } from "@/app/(operator)/insights/evidence-graph/_sections/GraphEvidenceTrailGuidanceDisclosure";
import { GraphFetchStatusAlerts } from "@/app/(operator)/insights/evidence-graph/_sections/GraphFetchStatusAlerts";
import { GraphPickReviewBeforeCanvasStrip } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPickReviewBeforeCanvasStrip";
import { EvidenceGraphNextReviewFooterClient } from "@/app/(operator)/insights/evidence-graph/_sections/EvidenceGraphNextReviewFooterClient";
import { GraphIdlePlaceholder } from "@/app/(operator)/insights/evidence-graph/_sections/GraphIdlePlaceholder";
import { GraphPageBuyerChrome } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageBuyerChrome";
import { GraphPageHeader } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageHeader";
import { GraphArchitectureNoteBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphArchitectureNoteBanner";
import { GraphModeAuxiliaryFields } from "@/app/(operator)/insights/evidence-graph/_sections/GraphModeAuxiliaryFields";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { useGraphPage } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page";
import { GraphPageToolbar } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageToolbar";
import { GraphPageCanvasShell } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageCanvasShell";

export function GraphPageContent() {
  const vm = useGraphPage();

  return (
    <OperatorPageContainer variant="dashboard">
      {vm.buyerPolishedShell ? null : (
        <CtoDemoBuyerValueStrip stepIndex={2} />
      )}
      <a
        href={`#${EVIDENCE_GRAPH_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {EVIDENCE_GRAPH_SKIP_LINK_LABEL}
      </a>
      <GraphPageHeader title={vm.pageTitle} subtitle={vm.pageSubtitle} />
      <div
        id={EVIDENCE_GRAPH_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
        data-testid="evidence-graph-primary-content"
      >
      {!vm.buyerPolishedShell ? (
        <>
          <OperatorRelatedSurfacesDisclosure testId="evidence-graph-related-surfaces-disclosure">
            <GraphPageVocabularyRails />
          </OperatorRelatedSurfacesDisclosure>
          <EvidenceGraphFirstOpenCoach />
        </>
      ) : null}
      <GraphEvidenceTrailGuidanceDisclosure className={vm.buyerPolishedShell ? "hidden" : undefined} />
      <GraphPageCanvasShell vm={vm} />
      <GraphPageToolbar vm={vm} />
      {!vm.buyerPolishedShell && vm.runId.trim().length > 0 ? (
        <GraphModeAuxiliaryFields
          mode={vm.mode}
          graphMainColumnMaxClass={vm.graphMainColumnMaxClass}
          decisionId={vm.decisionId}
          onDecisionIdChange={vm.setDecisionId}
          nodeId={vm.nodeId}
          onNodeIdChange={vm.setNodeId}
          depth={vm.depth}
          onDepthChange={vm.setDepth}
        />
      ) : null}
      {!vm.buyerPolishedShell && !vm.showReviewPickerBeforeCanvas ? (
        <IntegrationConnectChecklist
          title="Inspect checklist"
          steps={vm.graphInspectSteps}
          emphasizedStepId={vm.graphInspectEmphasizedStepId}
          testIdPrefix="graph-inspect"
        />
      ) : null}
      {vm.buyerPolishedShell ? <GraphPageBuyerChrome /> : null}
      {vm.runId.trim().length > 0 ? <EvidenceGraphNextReviewFooterClient runId={vm.runId} /> : null}
      </div>
    </OperatorPageContainer>
  );
}
