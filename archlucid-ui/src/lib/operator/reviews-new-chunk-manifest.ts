import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — reviews new (intake wizard) deferred chunk catalog (wave 1). */
export const REVIEWS_NEW_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "reviews-new-quick-review-advanced-config",
    label: "Loading advanced configuration",
    variant: "panel",
    modulePath: "@/components/usability/QuickReviewAdvancedConfigAccordion",
    exportName: "QuickReviewAdvancedConfigAccordion",
  },
  {
    id: "reviews-new-wizard-evidence-upload",
    label: "Loading evidence upload",
    variant: "panel",
    modulePath: "@/components/usability/WizardEvidenceUploadZone",
    exportName: "WizardEvidenceUploadZone",
  },
  {
    id: "reviews-new-wizard-package-preview",
    label: "Loading package preview",
    variant: "panel",
    modulePath: "@/components/usability/WizardPackagePreview",
    exportName: "WizardPackagePreview",
  },
  {
    id: "reviews-new-cto-demo-fast-create",
    label: "Loading demo fast create",
    variant: "panel",
    modulePath: "@/components/cto-demo/CtoDemoFastCreatePanel",
    exportName: "CtoDemoFastCreatePanel",
  },
  {
    id: "reviews-new-cto-demo-review-mode-callout",
    label: "Loading demo review mode callout",
    variant: "panel",
    modulePath: "@/components/cto-demo/CtoDemoReviewModeCallout",
    exportName: "CtoDemoReviewModeCallout",
  },
  {
    id: "reviews-new-draft-intake-decision-receipt",
    label: "Loading decision receipt",
    variant: "panel",
    modulePath: "@/components/draft-intake/DraftIntakeDecisionReceiptCard",
    exportName: "DraftIntakeDecisionReceiptCard",
  },
  {
    id: "reviews-new-wizard-step-advanced",
    label: "Loading advanced wizard step",
    variant: "panel",
    modulePath: "@/components/wizard/steps/WizardStepAdvanced",
    exportName: "WizardStepAdvanced",
  },
  {
    id: "reviews-new-wizard-step-cloud-inventory",
    label: "Loading cloud inventory step",
    variant: "panel",
    modulePath: "@/components/wizard/steps/WizardStepCloudInventoryContext",
    exportName: "WizardStepCloudInventoryContext",
  },
  {
    id: "reviews-new-wizard-step-baseline-zip",
    label: "Loading baseline zip step",
    variant: "panel",
    modulePath: "@/components/wizard/steps/WizardStepBaselineZip",
    exportName: "WizardStepBaselineZip",
  },
  {
    id: "reviews-new-wizard-step-baseline-metrics",
    label: "Loading baseline metrics step",
    variant: "panel",
    modulePath: "@/components/wizard/steps/WizardStepBaselineMetrics",
    exportName: "WizardStepBaselineMetrics",
  },
  {
    id: "reviews-new-wizard-post-create-evidence",
    label: "Loading post-create evidence panel",
    variant: "panel",
    modulePath: "@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel",
    exportName: "WizardPostCreateEvidenceUploadPanel",
  },
  {
    id: "reviews-new-wizard-step-track",
    label: "Loading track wizard step",
    variant: "panel",
    modulePath: "@/components/wizard/steps/WizardStepTrack",
    exportName: "WizardStepTrack",
  },
] as const;
