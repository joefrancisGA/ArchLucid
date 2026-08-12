export async function buildGovernanceWorkflowDeferredChunksVitestMock(): Promise<Record<string, unknown>> {
  const contextBar = await import(
    "@/app/(operator)/governance/_sections/GovernanceReviewContextBar"
  );
  const overview = await import("@/app/(operator)/governance/_sections/GovernanceOverviewPanel");
  const submit = await import("@/app/(operator)/governance/_sections/GovernanceWorkflowSubmitSection");
  const approvals = await import("@/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList");
  const promotions = await import(
    "@/app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection"
  );
  const dialogs = await import("@/app/(operator)/governance/_sections/GovernanceWorkflowDialogs");
  const buyerStrip = await import("@/components/cto-demo/CtoDemoBuyerValueStrip");
  const segregation = await import("@/components/cto-demo/CtoDemoSegregationCallout");
  const previewHint = await import("@/components/OperateCapabilityHints");
  const quickstart = await import("@/components/GovernanceInteractiveQuickstartContent");
  const storyCard = await import("@/components/GovernanceApprovalStoryCard");
  const advancedOptions = await import("@/components/AdvancedOptionsAccordion");

  return {
    GovernanceOverviewPanelDeferred: overview.GovernanceOverviewPanel,
    GovernanceReviewContextBarDeferred: contextBar.GovernanceReviewContextBar,
    GovernanceWorkflowSubmitSectionDeferred: submit.GovernanceWorkflowSubmitSection,
    GovernanceWorkflowApprovalsListDeferred: approvals.GovernanceWorkflowApprovalsList,
    GovernanceWorkflowPromotionsActivationsSectionDeferred:
      promotions.GovernanceWorkflowPromotionsActivationsSection,
    GovernanceWorkflowDialogsDeferred: dialogs.GovernanceWorkflowDialogs,
    CtoDemoBuyerValueStripDeferred: buyerStrip.CtoDemoBuyerValueStrip,
    CtoDemoSegregationCalloutDeferred: segregation.CtoDemoSegregationCallout,
    CtoDemoGovernancePreviewHintDeferred: previewHint.CtoDemoGovernancePreviewHint,
    GovernanceInteractiveQuickstartContentDeferred: quickstart.GovernanceInteractiveQuickstartContent,
    GovernanceApprovalStoryCardDeferred: storyCard.GovernanceApprovalStoryCard,
    AdvancedOptionsAccordionDeferred: advancedOptions.AdvancedOptionsAccordion,
  };
}
