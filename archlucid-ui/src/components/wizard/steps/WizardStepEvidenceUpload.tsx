"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, CloudUpload, FileText, FileUp, GitBranch, Image, Lock, Sparkles } from "lucide-react";

import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { Button } from "@/components/ui/button";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { cn } from "@/lib/utils";

export type WizardStepEvidenceUploadProps = {
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  onSkipDemoData: () => void;
};

type EvidenceSourceOption = {
  label: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "accelerated" | "v1.1";
};

const EVIDENCE_SOURCE_OPTIONS: readonly EvidenceSourceOption[] = [
  {
    label: "Brief",
    description: "Describe the architecture in the guided intake.",
    icon: FileText,
    status: "available",
  },
  {
    label: "Documents",
    description: "Attach design docs, ADRs, Markdown, PDFs, or requirements.",
    icon: FileUp,
    status: "available",
  },
  {
    label: "Diagrams",
    description: "Use architecture diagrams as review evidence.",
    icon: Image,
    status: "available",
  },
  {
    label: "IaC / Terraform",
    description: "Attach infrastructure declarations for context.",
    icon: GitBranch,
    status: "available",
  },
  {
    label: "Azure export",
    description: "Fastest path to production-faithful evidence in V1.",
    icon: CloudUpload,
    status: "accelerated",
  },
  {
    label: "Demo",
    description: "Use labeled simulator data when your own evidence is not ready.",
    icon: Sparkles,
    status: "available",
  },
  {
    label: "Structurizr / ArchiMate import",
    description: "Planned model-import source.",
    icon: Lock,
    status: "v1.1",
  },
] as const;

function EvidenceSourceBadge(props: { status: EvidenceSourceOption["status"] }) {
  if (props.status === "accelerated") {
    return <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">Fastest</span>;
  }

  if (props.status === "v1.1") {
    return <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">V1.1</span>;
  }

  return <span className="rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">Available</span>;
}

/** Optional evidence step between preset and identity in the full wizard (TB-215). */
export function WizardStepEvidenceUpload(props: WizardStepEvidenceUploadProps) {
  const { pendingFile, onPendingFileChange, onSkipDemoData } = props;
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

  return (
    <WizardStepPanel
      title="Add architecture evidence (optional)"
      description="Start from a brief, documents, diagrams, IaC, an Azure export, or labeled demo data. Azure export is the fastest V1 path, not a prerequisite."
    >
      <div className="space-y-4" data-testid="wizard-evidence-upload-step">
        <div className="grid gap-2 sm:grid-cols-2" aria-label="Evidence source options">
          {EVIDENCE_SOURCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const disabled = option.status === "v1.1";

            return (
              <div
                key={option.label}
                className={cn(
                  "rounded-md border p-3",
                  disabled
                    ? "border-dashed border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
                    : "border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                )}
                data-testid={`wizard-evidence-source-${option.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                aria-disabled={disabled}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
                    <p className="m-0 text-sm font-semibold">{option.label}</p>
                  </div>
                  <EvidenceSourceBadge status={option.status} />
                </div>
                <p className="m-0 mt-1 text-xs leading-snug text-neutral-600 dark:text-neutral-400">{option.description}</p>
              </div>
            );
          })}
        </div>

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
          <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300" data-testid="wizard-evidence-upload-selected">
            Selected: <span className="font-medium">{pendingFile.name}</span> — uploads automatically after the review is
            created.
          </p>
        ) : null}

        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          No evidence file yet? Continue with guided intake or use demo data instead — demo outputs are labeled Simulator.
        </p>

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
    </WizardStepPanel>
  );
}
