"use client";

import { cn } from "@/lib/utils";

import { WizardEvidenceUploadZone } from "@/components/usability/WizardEvidenceUploadZone";
import { ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER } from "@/lib/evidence-readable-text";
import { ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_ACCEPT } from "@/lib/architecture/architecture-draft-requirements-import";
import {
  ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_ACCEPTED_PREFIX,
  ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_DESCRIPTION,
  ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_TITLE,
} from "@/lib/guided-intake-copy";
import { OPERATOR_FORM_FIELD_HELPER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ArchitectureDraftRequirementsUploadPanelProps = {
  readonly disabled?: boolean;
  readonly importing?: boolean;
  readonly importError?: string | null;
  readonly statusMessage?: string | null;
  readonly onFilesSelected: (files: File[]) => void;
};

export function ArchitectureDraftRequirementsUploadPanel(
  props: ArchitectureDraftRequirementsUploadPanelProps,
): React.JSX.Element {
  const { disabled, importing, importError, statusMessage, onFilesSelected } = props;
  const fieldDisabled = disabled === true || importing === true;

  return (
    <section
      className={cn("space-y-2", fieldDisabled && importing !== true && "pointer-events-none opacity-60")}
      data-testid="architecture-draft-requirements-upload"
      aria-busy={importing === true}
    >
      <WizardEvidenceUploadZone
        labelId="architecture-draft-requirements-upload"
        title={ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_TITLE}
        description={`${ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_DESCRIPTION} ${ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_ACCEPTED_PREFIX}.`}
        accept={ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_ACCEPT}
        attachmentSummarySuffix="requirements import"
        onFilesSelected={onFilesSelected}
      />

      {importing === true ? (
        <p
          className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_FORM_FIELD_HELPER_CLASS)}
          role="status"
          data-testid="architecture-draft-requirements-import-progress"
        >
          {statusMessage ?? "Reading uploaded requirements…"}
        </p>
      ) : null}

      {(importError ?? "").length > 0 ? (
        <p
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_FORM_FIELD_HELPER_CLASS)}
          role="alert"
          data-testid="architecture-draft-requirements-import-error"
        >
          {importError}
        </p>
      ) : null}

      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
        {ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER}
      </p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Diagrams and inventory ZIPs belong on Start a review. Here, only readable requirements text is imported into
        the overview.
      </p>
    </section>
  );
}
