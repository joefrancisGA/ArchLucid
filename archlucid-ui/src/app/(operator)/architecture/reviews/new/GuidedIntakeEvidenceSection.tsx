"use client";

import { cn } from "@/lib/utils";

import { ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER } from "@/lib/evidence-readable-text";
import {
  GUIDED_INTAKE_EVIDENCE_UPLOAD_DESCRIPTION,
  GUIDED_INTAKE_PRIOR_ATTACHED_FILES_LEAD,
} from "@/lib/guided-intake-copy";
import { OPERATOR_FORM_FIELD_HELPER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { WizardEvidenceUploadZone } from "./QuickReviewWizardDeferredPanels";

type GuidedIntakeEvidenceSectionProps = {
  readonly priorAttachedFileNames: readonly string[];
  readonly disabled: boolean;
  readonly onEvidenceFilesChange: (files: File[]) => void;
};

export function GuidedIntakeEvidenceSection(props: GuidedIntakeEvidenceSectionProps) {
  const { disabled, onEvidenceFilesChange, priorAttachedFileNames } = props;

  return (
    <section
      className={cn("space-y-3", disabled && "pointer-events-none opacity-60")}
      data-testid="guided-intake-evidence-section"
    >
      {priorAttachedFileNames.length > 0 ? (
        <div
          className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="guided-intake-prior-attached-files"
        >
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.label)}>
            Attached on the prior package
          </p>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
            {GUIDED_INTAKE_PRIOR_ATTACHED_FILES_LEAD}
          </p>
          <ul
            className={cn(
              "m-0 mt-2 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {priorAttachedFileNames.map((fileName) => (
              <li key={fileName}>{fileName}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <WizardEvidenceUploadZone
        labelId="guided-intake-evidence"
        title="Attach architecture evidence"
        description={GUIDED_INTAKE_EVIDENCE_UPLOAD_DESCRIPTION}
        attachmentSummarySuffix="architecture context optional"
        onFilesSelected={onEvidenceFilesChange}
      />

      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
        {ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER}
      </p>
    </section>
  );
}
