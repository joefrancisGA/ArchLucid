"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildAuditEvidenceControlLineagePath,
  parseAuditEvidenceControlLineagePath,
} from "@/lib/audit-evidence-lineage-route";
import {
  AUDIT_EVIDENCE_ASSESSMENT_ID_HINT,
  AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL,
  AUDIT_EVIDENCE_CLAIM_DISCIPLINE,
  AUDIT_EVIDENCE_CONTROL_ID_HINT,
  AUDIT_EVIDENCE_CONTROL_ID_LABEL,
  AUDIT_EVIDENCE_FIELD_REQUIRED,
  AUDIT_EVIDENCE_LINEAGE_URL_HINT,
  AUDIT_EVIDENCE_LINEAGE_URL_LABEL,
  AUDIT_EVIDENCE_LINEAGE_URL_PARSE_ERROR,
  AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION,
  AUDIT_EVIDENCE_PAGE_LEAD,
  AUDIT_EVIDENCE_PAGE_TITLE,
  AUDIT_EVIDENCE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_SKIP_LINK_LABEL,
  AUDIT_EVIDENCE_SNAPSHOT_ID_HINT,
  AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL,
  AUDIT_EVIDENCE_START_FROM_INVENTORY_ACTION,
  AUDIT_EVIDENCE_START_FROM_INVENTORY_BODY,
  AUDIT_EVIDENCE_START_FROM_INVENTORY_TITLE,
} from "@/lib/audit-evidence-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

import { AuditEvidenceBreadcrumb } from "./AuditEvidenceBreadcrumb";
import { AuditEvidenceClaimOrientationStrip } from "./AuditEvidenceClaimOrientationStrip";

type FieldErrors = {
  readonly assessmentId?: string;
  readonly snapshotId?: string;
  readonly controlId?: string;
  readonly lineageUrl?: string;
};

function trimRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function AuditEvidenceLookupClient() {
  const router = useRouter();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [assessmentId, setAssessmentId] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [controlId, setControlId] = useState("");
  const [lineageUrl, setLineageUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const canOpenLineage = useMemo(
    () => trimRequired(assessmentId) && trimRequired(snapshotId) && trimRequired(controlId),
    [assessmentId, controlId, snapshotId],
  );

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  function applyParsedLineage(parsed: ReturnType<typeof parseAuditEvidenceControlLineagePath>) {
    if (parsed === null) {
      return;
    }

    setAssessmentId(parsed.assessmentId);
    setSnapshotId(parsed.snapshotId);
    setControlId(parsed.controlId);
    setFieldErrors({});
  }

  function openLineage() {
    const nextErrors: FieldErrors = {};

    if (!trimRequired(assessmentId)) {
      nextErrors.assessmentId = AUDIT_EVIDENCE_FIELD_REQUIRED;
    }

    if (!trimRequired(snapshotId)) {
      nextErrors.snapshotId = AUDIT_EVIDENCE_FIELD_REQUIRED;
    }

    if (!trimRequired(controlId)) {
      nextErrors.controlId = AUDIT_EVIDENCE_FIELD_REQUIRED;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    router.push(buildAuditEvidenceControlLineagePath(assessmentId.trim(), snapshotId.trim(), controlId.trim()));
  }

  function applyLineageUrlPaste() {
    const parsed = parseAuditEvidenceControlLineagePath(lineageUrl);

    if (parsed === null) {
      setFieldErrors((current) => ({ ...current, lineageUrl: AUDIT_EVIDENCE_LINEAGE_URL_PARSE_ERROR }));
      return;
    }

    applyParsedLineage(parsed);
    setLineageUrl("");
  }

  return (
    <div className="space-y-4 p-4" data-testid="audit-evidence-lookup-page">
      {buyerPolishedShell ? (
        <a
          href={`#${AUDIT_EVIDENCE_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {AUDIT_EVIDENCE_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        title={AUDIT_EVIDENCE_PAGE_TITLE}
        subtitle={AUDIT_EVIDENCE_PAGE_LEAD}
        claimDiscipline={AUDIT_EVIDENCE_CLAIM_DISCIPLINE}
        claimDisciplineTestId="audit-evidence-claim-discipline"
        titleTestId="audit-evidence-page-title"
        breadcrumb={buyerPolishedShell ? <AuditEvidenceBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
          </div>
        }
      />

      <main
        id={buyerPolishedShell ? AUDIT_EVIDENCE_PRIMARY_CONTENT_ID : undefined}
        className={cn("min-w-0 space-y-4", buyerPolishedShell ? "scroll-mt-24" : undefined)}
        data-testid="audit-evidence-primary-content"
      >
        <section
          aria-labelledby="audit-evidence-inventory-start-heading"
          className="max-w-2xl rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="audit-evidence-inventory-start-panel"
        >
          <h2
            id="audit-evidence-inventory-start-heading"
            className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {AUDIT_EVIDENCE_START_FROM_INVENTORY_TITLE}
          </h2>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {AUDIT_EVIDENCE_START_FROM_INVENTORY_BODY}
          </p>
          <div className="mt-3">
            <Link
              href="/governance/infrastructure/resources"
              className={OPERATOR_LINK.inline}
              data-testid="audit-evidence-browse-inventory-link"
            >
              {AUDIT_EVIDENCE_START_FROM_INVENTORY_ACTION}
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="audit-evidence-lookup-form-heading"
          className="max-w-2xl space-y-4"
          data-testid="audit-evidence-lookup-form-section"
        >
          <h2 id="audit-evidence-lookup-form-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Enter control identifiers
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="audit-evidence-lineage-url">{AUDIT_EVIDENCE_LINEAGE_URL_LABEL}</Label>
            <Input
              id="audit-evidence-lineage-url"
              data-testid="audit-evidence-lineage-url"
              value={lineageUrl}
              aria-invalid={fieldErrors.lineageUrl !== undefined}
              aria-describedby="audit-evidence-lineage-url-hint"
              onChange={(event) => {
                setLineageUrl(event.target.value);
                clearFieldError("lineageUrl");
              }}
              onBlur={() => {
                if (lineageUrl.trim().length > 0) {
                  applyLineageUrlPaste();
                }
              }}
            />
            <p
              id="audit-evidence-lineage-url-hint"
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            >
              {AUDIT_EVIDENCE_LINEAGE_URL_HINT}
            </p>
            {fieldErrors.lineageUrl !== undefined ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                {fieldErrors.lineageUrl}
              </p>
            ) : null}
          </div>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              openLineage();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="audit-evidence-assessment-id">{AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL}</Label>
              <Input
                id="audit-evidence-assessment-id"
                data-testid="audit-evidence-assessment-id"
                value={assessmentId}
                aria-invalid={fieldErrors.assessmentId !== undefined}
                aria-describedby="audit-evidence-assessment-id-hint"
                onChange={(event) => {
                  setAssessmentId(event.target.value);
                  clearFieldError("assessmentId");
                }}
              />
              <p
                id="audit-evidence-assessment-id-hint"
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {AUDIT_EVIDENCE_ASSESSMENT_ID_HINT}
              </p>
              {fieldErrors.assessmentId !== undefined ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                  {fieldErrors.assessmentId}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audit-evidence-snapshot-id">{AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL}</Label>
              <Input
                id="audit-evidence-snapshot-id"
                data-testid="audit-evidence-snapshot-id"
                value={snapshotId}
                aria-invalid={fieldErrors.snapshotId !== undefined}
                aria-describedby="audit-evidence-snapshot-id-hint"
                onChange={(event) => {
                  setSnapshotId(event.target.value);
                  clearFieldError("snapshotId");
                }}
              />
              <p
                id="audit-evidence-snapshot-id-hint"
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {AUDIT_EVIDENCE_SNAPSHOT_ID_HINT}
              </p>
              {fieldErrors.snapshotId !== undefined ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                  {fieldErrors.snapshotId}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audit-evidence-control-id">{AUDIT_EVIDENCE_CONTROL_ID_LABEL}</Label>
              <Input
                id="audit-evidence-control-id"
                data-testid="audit-evidence-control-id"
                value={controlId}
                aria-invalid={fieldErrors.controlId !== undefined}
                aria-describedby="audit-evidence-control-id-hint"
                onChange={(event) => {
                  setControlId(event.target.value);
                  clearFieldError("controlId");
                }}
              />
              <p
                id="audit-evidence-control-id-hint"
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {AUDIT_EVIDENCE_CONTROL_ID_HINT}
              </p>
              {fieldErrors.controlId !== undefined ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                  {fieldErrors.controlId}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canOpenLineage}
              data-testid="audit-evidence-open-lineage"
            >
              {AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION}
            </Button>
          </form>
        </section>

        {buyerPolishedShell ? <AuditEvidenceClaimOrientationStrip /> : null}
      </main>
    </div>
  );
}
