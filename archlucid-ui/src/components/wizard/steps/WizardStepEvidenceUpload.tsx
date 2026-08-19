"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CloudUpload,
  FileText,
  FileUp,
  GitBranch,
  Image,
  Lock,
  Sparkles,
} from "lucide-react";

import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { Tier1InventoryZipUploadPanel } from "@/components/wizard/Tier1InventoryZipUploadPanel";
import { WizardEvidenceUploadZone } from "@/components/usability/WizardEvidenceUploadZone";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import {
  DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  type DemoReviewScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  isTier1InventoryEvidenceSourceId,
  wizardEvidenceSourceToCloudInventoryPlatform,
} from "@/lib/cloud-inventory-platform";
import { ZERO_CONFIG_DEMO_TRY_DEMO_LABEL } from "@/lib/zero-config-demo-mode";
import {
  isSelectableWizardEvidenceSourceId,
  WIZARD_EVIDENCE_SOURCE_OPTIONS,
  wizardEvidenceSourceTestId,
  type WizardEvidenceSourceAvailability,
  type WizardEvidenceSourceId,
  type WizardEvidenceSourceOption,
} from "@/lib/wizard-evidence-source-options";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type WizardStepEvidenceUploadProps = {
  pendingFile: File | null;
  pendingDocumentFiles: File[];
  onPendingFileChange: (file: File | null) => void;
  onPendingDocumentFilesChange: (files: File[]) => void;
  onTryDemoData: (scenarioId: DemoReviewScenarioId) => void;
  onSkipDemoData: () => void;
};

const SOURCE_ICONS: Record<WizardEvidenceSourceOption["id"], LucideIcon> = {
  brief: FileText,
  documents: FileUp,
  diagrams: Image,
  iac: GitBranch,
  "azure-export": CloudUpload,
  "aws-inventory": CloudUpload,
  "gcp-inventory": CloudUpload,
  demo: Sparkles,
  "generic-inventory-json": Lock,
  "structurizr-archimate": Lock,
};

function EvidenceSourceBadge(props: { availability: WizardEvidenceSourceAvailability }) {
  if (props.availability === "accelerated") {
    return <StatusTag kind="ready" label="Fastest" className={OPERATOR_TYPOGRAPHY.badge} />;
  }

  if (props.availability === "v1.1") {
    return <StatusTag kind="neutral" label="Planned" className={OPERATOR_TYPOGRAPHY.badge} />;
  }

  return <StatusTag kind="neutral" label="Available" className={OPERATOR_TYPOGRAPHY.badge} />;
}

function EvidenceSourcePicker(props: {
  selectedSourceId: WizardEvidenceSourceId;
  onSelectSource: (sourceId: WizardEvidenceSourceId) => void;
}) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Evidence source options"
      data-testid="wizard-evidence-source-picker"
    >
      {WIZARD_EVIDENCE_SOURCE_OPTIONS.map((option) => {
        const Icon = SOURCE_ICONS[option.id];
        const disabled = option.availability === "v1.1";
        const selected = !disabled && props.selectedSourceId === option.id;

        if (disabled || !isSelectableWizardEvidenceSourceId(option.id)) {
          return (
            <div
              key={option.id}
              className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 p-3 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
              data-testid={wizardEvidenceSourceTestId(option.id)}
              aria-disabled="true"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden />
                  <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>{option.label}</p>
                </div>
                <EvidenceSourceBadge availability={option.availability} />
              </div>
              <p className={cn("m-0 mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper)}>{option.description}</p>
            </div>
          );
        }

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              selected
                ? "border-teal-600 bg-teal-50/80 ring-1 ring-teal-600 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-500"
                : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
              "text-neutral-800 dark:text-neutral-100",
            )}
            data-testid={wizardEvidenceSourceTestId(option.id)}
            onClick={() => {
              props.onSelectSource(option.id as WizardEvidenceSourceId);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
                <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>{option.label}</p>
              </div>
              <EvidenceSourceBadge availability={option.availability} />
            </div>
            <p className={cn("m-0 mt-1 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}

/** Optional evidence step between preset and identity in the full wizard (TB-215, TB-341). */
export function WizardStepEvidenceUpload(props: WizardStepEvidenceUploadProps) {
  const {
    pendingFile,
    pendingDocumentFiles,
    onPendingFileChange,
    onPendingDocumentFilesChange,
    onTryDemoData,
    onSkipDemoData,
  } = props;
  const [selectedSourceId, setSelectedSourceId] = useState<WizardEvidenceSourceId>("brief");
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<DemoReviewScenarioId>(
    DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  );

  const handleSelectSource = (sourceId: WizardEvidenceSourceId) => {
    setSelectedSourceId(sourceId);

    if (!isTier1InventoryEvidenceSourceId(sourceId) && sourceId !== "demo") {
      onPendingFileChange(null);
    }

    if (sourceId === "azure-export" || sourceId === "aws-inventory" || sourceId === "gcp-inventory" || sourceId === "demo" || sourceId === "brief") {
      onPendingDocumentFilesChange([]);
    }
  };

  const inventoryPlatform = wizardEvidenceSourceToCloudInventoryPlatform(selectedSourceId);

  return (
    <WizardStepPanel
      title="Add architecture evidence (optional)"
      description="Choose how you want to start — brief, documents, diagrams, IaC, a cloud inventory ZIP (Azure, AWS, or GCP), or labeled demo data."
    >
      <div className="space-y-4" data-testid="wizard-evidence-upload-step">
        <EvidenceSourcePicker selectedSourceId={selectedSourceId} onSelectSource={handleSelectSource} />

        {selectedSourceId === "brief" ? (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
            data-testid="wizard-evidence-source-panel-brief"
          >
            <p className={cn("m-0 text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              Capture the architecture brief on the next wizard steps (identity and description), or switch to quick
              review for a brief-first intake.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="primary" data-testid="wizard-evidence-brief-continue" onClick={onSkipDemoData}>
                Continue with guided brief
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/architecture/reviews/new?path=quick-review" data-testid="wizard-evidence-brief-quick-review-link">
                  Open quick review brief
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        {selectedSourceId === "documents" || selectedSourceId === "diagrams" || selectedSourceId === "iac" ? (
          <div data-testid={`wizard-evidence-source-panel-${selectedSourceId}`}>
            <WizardEvidenceUploadZone
              title={
                selectedSourceId === "diagrams"
                  ? "Attach diagram evidence (optional)"
                  : selectedSourceId === "iac"
                    ? "Attach IaC / Terraform evidence (optional)"
                    : "Attach document evidence (optional)"
              }
              description={
                selectedSourceId === "diagrams"
                  ? "PNG, JPG, or SVG architecture diagrams upload after the review is created."
                  : selectedSourceId === "iac"
                    ? "JSON, YAML, or Terraform-style declarations upload after the review is created."
                    : "PDF, DOCX, Markdown, text, or JSON uploads after the review is created."
              }
              accept={
                selectedSourceId === "diagrams"
                  ? ".png,.jpg,.jpeg,.webp,.svg"
                  : selectedSourceId === "iac"
                    ? ".json,.yaml,.yml,.tf,.txt"
                    : undefined
              }
              attachmentSummarySuffix="uploads automatically after the review is created"
              onFilesSelected={(files) => {
                onPendingDocumentFilesChange(files);
              }}
            />
          </div>
        ) : null}

        {inventoryPlatform !== null ? (
          <div data-testid={`wizard-evidence-source-panel-${selectedSourceId}`}>
            <Tier1InventoryZipUploadPanel
              platform={inventoryPlatform}
              pendingFile={pendingFile}
              onPendingFileChange={onPendingFileChange}
              showDemoScenarios={inventoryPlatform === "aws" || inventoryPlatform === "gcp"}
            />
          </div>
        ) : null}

        {selectedSourceId === "demo" ? (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
            data-testid="wizard-evidence-source-panel-demo"
          >
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Choose a bundled example review scenario — no scripts or uploads required. Demo outputs are labeled
              Simulator.
            </p>
            <div className="mt-3">
              <AzureExtractorDemoScenarioPicker
                selectedScenarioId={selectedDemoScenarioId}
                onSelectScenario={setSelectedDemoScenarioId}
                testIdPrefix="wizard-evidence-demo"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                data-testid="wizard-evidence-upload-try-demo"
                onClick={() => {
                  onTryDemoData(selectedDemoScenarioId);
                }}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {ZERO_CONFIG_DEMO_TRY_DEMO_LABEL}
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="wizard-evidence-upload-skip-demo"
                onClick={onSkipDemoData}
              >
                <BadgeCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Skip and use demo data
              </Button>
            </div>
          </div>
        ) : null}

        {selectedSourceId !== "demo" && selectedSourceId !== "brief" ? (
          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="wizard-evidence-upload-skip-context"
            >
              Skipping evidence is OK — you can add files or cloud inventory from the review detail page after the
              review is created. Findings without evidence may have lower confidence.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" data-testid="wizard-evidence-upload-skip-step" onClick={onSkipDemoData}>
                Skip evidence for now
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </WizardStepPanel>
  );
}
