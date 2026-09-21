"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { CTA_WIDTH, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
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
  AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION,
  AUDIT_EVIDENCE_LINEAGE_URL_APPLIED_LIVE_MESSAGE,
  AUDIT_EVIDENCE_LINEAGE_URL_LABEL,
  AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION,
  AUDIT_EVIDENCE_LOOKUP_ERROR_SUMMARY_TITLE,
  AUDIT_EVIDENCE_LOOKUP_FORM_SECTION_TITLE,
  AUDIT_EVIDENCE_LOOKUP_KEYBOARD_AFFORDANCE,
  AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED,
  AUDIT_EVIDENCE_LOOKUP_READINESS_READY,
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
  auditEvidenceLineageUrlHintForLookupPath,
  auditEvidenceLineageUrlParseErrorForLookupPath,
} from "@/lib/audit-evidence-page-copy";
import {
  fieldsFromDraft,
  persistAuditEvidenceLookupIdentifierDraft,
  readAuditEvidenceLookupIdentifierDraft,
} from "@/lib/governance/audit-evidence-lookup-identifier-draft";
import {
  auditEvidenceLookupIdentifiersReady,
  firstInvalidAuditEvidenceLookupFieldId,
  type AuditEvidenceLookupFieldErrors,
  validateAuditEvidenceLookupIdentifiers,
} from "@/lib/governance/audit-evidence-lookup-validation";
import { auditEvidencePathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import {
  resolveContinueLastAuditEvidenceLineage,
  type ContinueLastAuditEvidenceLineageTarget,
} from "@/lib/resolve-continue-last-audit-evidence-lineage";
import { cn } from "@/lib/utils";

import { AuditEvidenceClaimOrientationStrip } from "./AuditEvidenceClaimOrientationStrip";
import { AuditEvidenceLookupBuildProvenanceStrip } from "./AuditEvidenceLookupBuildProvenanceStrip";
import { AuditEvidenceLookupContinueLastViewedRow } from "./AuditEvidenceLookupContinueLastViewedRow";
import { AuditEvidenceLookupScopeBanner } from "./AuditEvidenceLookupScopeBanner";

type IdentifierSnapshot = {
  assessmentId: string;
  snapshotId: string;
  controlId: string;
};

const IDENTIFIER_INPUT_CLASS = "font-mono text-sm";

function fieldErrorClass(hasError: boolean): string {
  return hasError ? "border-destructive focus-visible:ring-destructive" : "";
}

function fieldErrorTextClass(hasError: boolean): string {
  return hasError ? "text-destructive" : "text-al-text-secondary";
}

export function AuditEvidenceLookupClient() {
  const router = useRouter();
  const { productLine } = useProductLine();
  const buyerPolishedShell = useProductionEvalChrome();
  const lookupPath = useMemo(() => auditEvidencePathForProductLine(productLine), [productLine]);
  const lineageUrlHint = useMemo(() => auditEvidenceLineageUrlHintForLookupPath(lookupPath), [lookupPath]);
  const lineageUrlParseError = useMemo(
    () => auditEvidenceLineageUrlParseErrorForLookupPath(lookupPath),
    [lookupPath],
  );

  const [assessmentId, setAssessmentId] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [controlId, setControlId] = useState("");
  const [lineageUrl, setLineageUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuditEvidenceLookupFieldErrors>({});
  const [pasteUndoSnapshot, setPasteUndoSnapshot] = useState<IdentifierSnapshot | null>(null);
  const [pasteLiveMessage, setPasteLiveMessage] = useState("");
  const [continueLastTarget, setContinueLastTarget] = useState<ContinueLastAuditEvidenceLineageTarget | null>(
    null,
  );

  const inventoryResourcesHref = useMemo(
    () => infrastructureResourcesPathForProductLine(productLine),
    [productLine],
  );

  const canOpenLineage = useMemo(
    () => auditEvidenceLookupIdentifiersReady(assessmentId, snapshotId, controlId),
    [assessmentId, controlId, snapshotId],
  );

  const readinessMessage = canOpenLineage
    ? AUDIT_EVIDENCE_LOOKUP_READINESS_READY
    : AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED;

  const errorSummaryItems = useMemo(() => {
    const items: { id: string; message: string }[] = [];

    if (fieldErrors.lineageUrl !== undefined) {
      items.push({ id: "audit-evidence-lineage-url", message: fieldErrors.lineageUrl });
    }

    if (fieldErrors.assessmentId !== undefined) {
      items.push({ id: "audit-evidence-assessment-id", message: fieldErrors.assessmentId });
    }

    if (fieldErrors.snapshotId !== undefined) {
      items.push({ id: "audit-evidence-snapshot-id", message: fieldErrors.snapshotId });
    }

    if (fieldErrors.controlId !== undefined) {
      items.push({ id: "audit-evidence-control-id", message: fieldErrors.controlId });
    }

    return items;
  }, [fieldErrors]);

  const draftHydratedRef = useRef(false);

  useEffect(() => {
    if (draftHydratedRef.current) {
      return;
    }

    draftHydratedRef.current = true;
    const draft = readAuditEvidenceLookupIdentifierDraft();
    const fields = fieldsFromDraft(draft);
    setAssessmentId(fields.assessmentId);
    setSnapshotId(fields.snapshotId);
    setControlId(fields.controlId);
  }, []);

  useEffect(() => {
    if (!draftHydratedRef.current) {
      return;
    }

    persistAuditEvidenceLookupIdentifierDraft({ assessmentId, snapshotId, controlId });
  }, [assessmentId, controlId, snapshotId]);

  useEffect(() => {
    setContinueLastTarget(resolveContinueLastAuditEvidenceLineage(productLine));
  }, [productLine]);

  function clearFieldError(field: keyof AuditEvidenceLookupFieldErrors) {
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

  function focusFirstInvalid(errors: AuditEvidenceLookupFieldErrors) {
    const fieldId = firstInvalidAuditEvidenceLookupFieldId(errors);

    if (fieldId === null) {
      return;
    }

    document.getElementById(fieldId)?.focus();
  }

  function openLineage() {
    const nextErrors = validateAuditEvidenceLookupIdentifiers(assessmentId, snapshotId, controlId);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setFieldErrors({});
    router.push(
      buildAuditEvidenceControlLineagePath(
        assessmentId.trim(),
        snapshotId.trim(),
        controlId.trim(),
        lookupPath,
      ),
    );
  }

  function applyLineageUrlPaste() {
    const parsed = parseAuditEvidenceControlLineagePath(lineageUrl);

    if (parsed === null) {
      const nextErrors = { lineageUrl: lineageUrlParseError };
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      focusFirstInvalid(nextErrors);
      return;
    }

    setPasteUndoSnapshot({
      assessmentId,
      snapshotId,
      controlId,
    });
    applyParsedLineage(parsed);
    setLineageUrl("");
    setPasteLiveMessage(AUDIT_EVIDENCE_LINEAGE_URL_APPLIED_LIVE_MESSAGE);
  }

  function undoLineageUrlPaste() {
    if (pasteUndoSnapshot === null) {
      return;
    }

    setAssessmentId(pasteUndoSnapshot.assessmentId);
    setSnapshotId(pasteUndoSnapshot.snapshotId);
    setControlId(pasteUndoSnapshot.controlId);
    setPasteUndoSnapshot(null);
    setFieldErrors({});
    setPasteLiveMessage("");
  }

  function prefillFromContinueLast() {
    if (continueLastTarget === null) {
      return;
    }

    setAssessmentId(continueLastTarget.assessmentId);
    setSnapshotId(continueLastTarget.snapshotId);
    setControlId(continueLastTarget.controlId);
    setFieldErrors({});
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
        headingLevel={buyerPolishedShell ? "h1" : "h2"}
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <PageContextualHelpButton
                triggerText={buyerPolishedShell ? PAGE_HELP_SHORT_TRIGGER_TEXT : undefined}
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
              data-testid="audit-evidence-lookup-keyboard-affordance"
            >
              <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search.
              <span className="sr-only">{AUDIT_EVIDENCE_LOOKUP_KEYBOARD_AFFORDANCE}</span>
            </p>
          </div>
        }
      />

      <div
        id={buyerPolishedShell ? AUDIT_EVIDENCE_PRIMARY_CONTENT_ID : undefined}
        className={cn("min-w-0 space-y-4", buyerPolishedShell ? "scroll-mt-24" : undefined)}
        data-testid="audit-evidence-primary-content"
      >
        <AuditEvidenceLookupScopeBanner />
        {buyerPolishedShell ? <AuditEvidenceLookupBuildProvenanceStrip /> : null}

        {continueLastTarget !== null ? (
          <AuditEvidenceLookupContinueLastViewedRow
            target={continueLastTarget}
            onPrefill={prefillFromContinueLast}
          />
        ) : null}

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
              href={inventoryResourcesHref}
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
            {AUDIT_EVIDENCE_LOOKUP_FORM_SECTION_TITLE}
          </h2>

          <div
            aria-live="polite"
            className="sr-only"
            data-testid="audit-evidence-lineage-paste-live-region"
          >
            {pasteLiveMessage}
          </div>

          {errorSummaryItems.length > 0 ? (
            <div
              className="rounded-md border border-destructive/40 bg-destructive/5 p-3"
              data-testid="audit-evidence-lookup-error-summary"
              role="alert"
            >
              <p className={cn("m-0 font-medium text-destructive", OPERATOR_TYPOGRAPHY.body)}>
                {AUDIT_EVIDENCE_LOOKUP_ERROR_SUMMARY_TITLE}
              </p>
              <ul className={cn("m-0 mt-2 list-disc pl-5 text-destructive", OPERATOR_TYPOGRAPHY.helper)}>
                {errorSummaryItems.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="underline underline-offset-2">
                      {item.message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="audit-evidence-lineage-url">{AUDIT_EVIDENCE_LINEAGE_URL_LABEL}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="audit-evidence-lineage-url"
                data-testid="audit-evidence-lineage-url"
                className={cn(IDENTIFIER_INPUT_CLASS, fieldErrorClass(fieldErrors.lineageUrl !== undefined))}
                value={lineageUrl}
                autoComplete="off"
                aria-invalid={fieldErrors.lineageUrl !== undefined}
                aria-describedby="audit-evidence-lineage-url-hint"
                onChange={(event) => {
                  setLineageUrl(event.target.value);
                  clearFieldError("lineageUrl");
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="audit-evidence-lineage-url-apply"
                onClick={applyLineageUrlPaste}
              >
                {AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION}
              </Button>
              {pasteUndoSnapshot !== null ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="audit-evidence-lineage-url-undo"
                  onClick={undoLineageUrlPaste}
                >
                  {AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION}
                </Button>
              ) : null}
            </div>
            <p
              id="audit-evidence-lineage-url-hint"
              className={cn("m-0", fieldErrorTextClass(fieldErrors.lineageUrl !== undefined), OPERATOR_TYPOGRAPHY.helper)}
            >
              {fieldErrors.lineageUrl ?? lineageUrlHint}
            </p>
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
                className={cn(IDENTIFIER_INPUT_CLASS, fieldErrorClass(fieldErrors.assessmentId !== undefined))}
                value={assessmentId}
                autoComplete="off"
                aria-invalid={fieldErrors.assessmentId !== undefined}
                aria-describedby="audit-evidence-assessment-id-hint"
                onChange={(event) => {
                  setAssessmentId(event.target.value);
                  clearFieldError("assessmentId");
                }}
              />
              <p
                id="audit-evidence-assessment-id-hint"
                className={cn(
                  "m-0",
                  fieldErrorTextClass(fieldErrors.assessmentId !== undefined),
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                {fieldErrors.assessmentId ?? AUDIT_EVIDENCE_ASSESSMENT_ID_HINT}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audit-evidence-snapshot-id">{AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL}</Label>
              <Input
                id="audit-evidence-snapshot-id"
                data-testid="audit-evidence-snapshot-id"
                className={cn(IDENTIFIER_INPUT_CLASS, fieldErrorClass(fieldErrors.snapshotId !== undefined))}
                value={snapshotId}
                autoComplete="off"
                aria-invalid={fieldErrors.snapshotId !== undefined}
                aria-describedby="audit-evidence-snapshot-id-hint"
                onChange={(event) => {
                  setSnapshotId(event.target.value);
                  clearFieldError("snapshotId");
                }}
              />
              <p
                id="audit-evidence-snapshot-id-hint"
                className={cn(
                  "m-0",
                  fieldErrorTextClass(fieldErrors.snapshotId !== undefined),
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                {fieldErrors.snapshotId ?? AUDIT_EVIDENCE_SNAPSHOT_ID_HINT}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audit-evidence-control-id">{AUDIT_EVIDENCE_CONTROL_ID_LABEL}</Label>
              <Input
                id="audit-evidence-control-id"
                data-testid="audit-evidence-control-id"
                className={cn(IDENTIFIER_INPUT_CLASS, fieldErrorClass(fieldErrors.controlId !== undefined))}
                value={controlId}
                autoComplete="off"
                aria-invalid={fieldErrors.controlId !== undefined}
                aria-describedby="audit-evidence-control-id-hint"
                onChange={(event) => {
                  setControlId(event.target.value);
                  clearFieldError("controlId");
                }}
              />
              <p
                id="audit-evidence-control-id-hint"
                className={cn(
                  "m-0",
                  fieldErrorTextClass(fieldErrors.controlId !== undefined),
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                {fieldErrors.controlId ?? AUDIT_EVIDENCE_CONTROL_ID_HINT}
              </p>
            </div>

            <p
              id="audit-evidence-open-readiness"
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="audit-evidence-open-readiness"
            >
              {readinessMessage}
            </p>

            <Button
              type="submit"
              variant="primary"
              className={CTA_WIDTH.content}
              disabled={!canOpenLineage}
              aria-describedby="audit-evidence-open-readiness"
              data-testid="audit-evidence-open-lineage"
            >
              {AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION}
            </Button>
          </form>
        </section>

        {buyerPolishedShell ? <AuditEvidenceClaimOrientationStrip /> : null}
      </div>
    </div>
  );
}
