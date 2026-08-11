/**
 * Compatibility barrel for help markdown presentation transforms.
 * Implementation lives under @/lib/help-markdown/* by concern.
 */

export {
  humanizeMarkdownFileReference,
  humanizeMarkdownLinkLabel,
  resolveRelativeRepoDocPath,
  rewriteHelpMarkdownDocLinks,
  sanitizeBareMarkdownFileReferences,
} from "./help-markdown/link-rewrites";

export {
  stripInternalEngineeringBatchLabels,
  stripDuplicateMarkdownTitle,
  stripLeadingContributorScopeBlockquote,
  stripHtmlComments,
  stripInternalBuyerHelpSections,
  removeEmptyFencedCodeBlocks,
  stripInternalBuyerHelpPreamble,
  stripProductReleaseVersionLabels,
  stripInternalBuyerHelpInlineReferences,
  type StripDuplicateMarkdownTitleOptions,
} from "./help-markdown/markdown-cleanup";

export {
  emphasizeInlineGuidanceLabels,
  stripMarkdownHorizontalRules,
} from "./help-markdown/presentation-polish";

export {
  isDocumentationMaintenanceMetadataLine,
  stripDocumentationMaintenanceMetadata,
  prepareHelpMarkdownForPresentation,
  type PrepareHelpMarkdownPresentationOptions,
} from "./help-markdown/prepare-help-markdown";

export { HELP_MARKDOWN_TOPIC_RULE_STAGES } from "./help-markdown/topic-rule-sets";

// Re-export leakage / honesty transforms that tests and callers import directly.
export {
  stripProcurementContributorLeakage,
  stripConfigurationReferenceContributorSections,
  stripEnterpriseOnboardingQuickLinksBlock,
  stripEnterpriseOnboardingContributorSections,
  stripEnterpriseOnboardingContributorLeakage,
  stripEvaluatorWorkbookContributorLeakage,
  stripConfigurationReferenceContributorLeakage,
  stripGovernanceApiContractsContributorSections,
  stripGovernanceApiContractsContributorLeakage,
  stripExecutiveSummaryPilotRoiMeasurementLeakage,
  stripPilotRoiModelContributorLeakage,
  stripRepeatReviewLoopContributorSections,
  stripRepeatReviewLoopContributorLeakage,
  stripAcceleratorChooserIntroAndTable,
  stripAcceleratorChooserContributorSections,
  stripAcceleratorChooserContributorLeakage,
  stripAzureBoardsContributorLeakage,
  stripCaiqSigContributorLeakage,
  stripSubprocessorsContributorSections,
  stripSubprocessorsContributorLeakage,
  alignSubprocessorsResidencyHonesty,
  alignSubprocessorsRegisterProductLanguage,
  stripTenantIsolationContributorLeakage,
  stripDpaTemplateContributorLeakage,
  stripExecutiveSummaryContributorLeakage,
  stripFirstReviewEvidenceChecklistContributorSections,
  stripFirstReviewEvidenceChecklistContributorLeakage,
  stripCliUsageContributorSections,
  stripCliUsageContributorLeakage,
  stripDeveloperTroubleshootingContributorLeakage,
  stripFirstValue20ContributorLeakage,
  stripPilotFeedbackContributorSections,
  stripPilotFeedbackContributorLeakage,
  stripPolicyPackDeltaContributorSections,
  stripPolicyPackDeltaContributorLeakage,
  stripPriorManifestRetrievalContributorLeakage,
  stripExecutiveSummarySponsorBriefLeakage,
  stripProductOverviewContributorLeakage,
  stripSoc2SelfAssessmentContributorSections,
  alignSoc2SelfAssessmentRoadmapHonesty,
  stripSoc2SelfAssessmentContributorLeakage,
  softenEvidenceIntakeHelpPresentation,
  stripEvidenceIntakeStructuredUiSections,
  stripEvidenceTrailStructuredUiSections,
  stripPathChooserStructuredUiSections,
  stripPathChooserContributorLeakage,
  alignDataHandlingIsolationHonesty,
  alignCaiqSigAssuranceHonesty,
  stripTrustCenterContributorLeakage,
} from "./help-markdown/contributor-leakage";
