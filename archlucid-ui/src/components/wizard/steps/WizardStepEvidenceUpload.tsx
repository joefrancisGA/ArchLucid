"use client";

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

import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { Button } from "@/components/ui/button";
import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { WizardEvidenceUploadZone } from "@/components/usability/WizardEvidenceUploadZone";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import {
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { ZERO_CONFIG_DEMO_TRY_DEMO_LABEL } from "@/lib/zero-config-demo-mode";
import {
  isSelectableWizardEvidenceSourceId,
  WIZARD_EVIDENCE_SOURCE_OPTIONS,
  wizardEvidenceSourceTestId,
  type WizardEvidenceSourceAvailability,
  type WizardEvidenceSourceId,
  type WizardEvidenceSourceOption,
} from "@/lib/wizard-evidence-source-options";
import { cn } from "@/lib/utils";

export type WizardStepEvidenceUploadProps = {
  pendingFile: File | null;
  pendingDocumentFiles: File[];
  onPendingFileChange: (file: File | null) => void;
  onPendingDocumentFilesChange: (files: File[]) => void;
  onTryDemoData: (scenarioId: AzureExtractorDemoScenarioId) => void;
  onSkipDemoData: () => void;
};

const SOURCE_ICONS: Record<WizardEvidenceSourceOption["id"], LucideIcon> = {
  brief: FileText,
  documents: FileUp,
  diagrams: Image,
  iac: GitBranch,
  "azure-export": CloudUpload,
  demo: Sparkles,
  "aws-gcp-inventory": Lock,
  "generic-inventory-json": Lock,
  "structurizr-archimate": Lock,
};

function EvidenceSourceBadge(props: { availability: WizardEvidenceSourceAvailability }) {
  if (props.availability === "accelerated") {
    return (
      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
        Fastest
      </span>
    );
  }

  if (props.availability === "v1.1") {
    return (
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        V1.1
      </span>
    );
  }

  return (
    <span className="rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
      Available
    </span>
  );
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
                  <p className="m-0 text-sm font-semibold">{option.label}</p>
                </div>
                <EvidenceSourceBadge availability={option.availability} />
              </div>
              <p className="m-0 mt-1 text-xs leading-snug">{option.description}</p>
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
              props.onSelectSource(option.id);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
                <p className="m-0 text-sm font-semibold">{option.label}</p>
              </div>
              <EvidenceSourceBadge availability={option.availability} />
            </div>
            <p className="m-0 mt-1 text-xs leading-snug text-neutral-600 dark:text-neutral-400">{option.description}</p>
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
  const [selectedSourceId, setSelectedSourceId] = useState<WizardEvidenceSourceId>("azure-export");
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<AzureExtractorDemoScenarioId>(
    DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

  const handleSelectSource = (sourceId: WizardEvidenceSourceId) => {
    setSelectedSourceId(sourceId);

    if (sourceId !== "azure-export" && sourceId !== "demo") {
      onPendingFileChange(null);
    }

    if (sourceId === "azure-export" || sourceId === "demo" || sourceId === "brief") {
      onPendingDocumentFilesChange([]);
    }
  };

  return (
    <WizardStepPanel
      title="Add architecture evidence (optional)"
      description="Choose how you want to start — brief, documents, diagrams, IaC, an Azure export, or labeled demo data. Azure export is the fastest V1 path, not a prerequisite."
    >
      <div className="space-y-4" data-testid="wizard-evidence-upload-step">
        <EvidenceSourcePicker selectedSourceId={selectedSourceId} onSelectSource={handleSelectSource} />

        {selectedSourceId === "brief" ? (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
            data-testid="wizard-evidence-source-panel-brief"
          >
            <p className="m-0 text-sm text-neutral-800 dark:text-neutral-100">
              Capture the architecture brief on the next wizard steps (identity and description), or switch to quick
              review for a brief-first intake.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="primary" data-testid="wizard-evidence-brief-continue" onClick={onSkipDemoData}>
                Continue with guided brief
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/reviews/new?path=quick-review" data-testid="wizard-evidence-brief-quick-review-link">
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
              onFilesSelected={(files) => {
                onPendingDocumentFilesChange(files);
              }}
            />
            {pendingDocumentFiles.length > 0 ? (
              <p
                className="m-0 mt-2 text-sm text-neutral-700 dark:text-neutral-300"
                data-testid="wizard-evidence-documents-selected"
              >
                {pendingDocumentFiles.length} file{pendingDocumentFiles.length === 1 ? "" : "s"} ready — uploads
                automatically after the review is created.
              </p>
            ) : null}
          </div>
        ) : null}

        {selectedSourceId === "azure-export" ? (
          <div data-testid="wizard-evidence-source-panel-azure-export">
            <AzureExtractorZipDropZone
              ariaLabel="Azure extractor evidence ZIP"
              testId="wizard-evidence-upload-dropzone"
              hint={
                <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                  Use the Azure extractor when you want production-faithful subscription inventory. See{" "}
                  <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/settings/extract-upload">
                    Extract &amp; upload settings
                  </Link>{" "}
                  for the PowerShell command. Maximum size {maxMb} MB.
                </p>
              }
              onZipSelected={(file) => {
                if (!file.name.toLowerCase().endsWith(".zip")) {
                  return;
                }

                onPendingFileChange(file);
              }}
            />

            {pendingFile !== null ? (
              <p
                className="m-0 mt-2 text-sm text-neutral-700 dark:text-neutral-300"
                data-testid="wizard-evidence-upload-selected"
              >
                Selected: <span className="font-medium">{pendingFile.name}</span> — uploads automatically after the
                review is created.
              </p>
            ) : null}
          </div>
        ) : null}

        {selectedSourceId === "demo" ? (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
            data-testid="wizard-evidence-source-panel-demo"
          >
            <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
              Choose a bundled synthetic Azure extractor package — no PowerShell script required. Demo outputs are
              labeled Simulator.
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
          <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <Button type="button" variant="outline" data-testid="wizard-evidence-upload-skip-step" onClick={onSkipDemoData}>
              Skip evidence for now
            </Button>
          </div>
        ) : null}
      </div>
    </WizardStepPanel>
  );
}
