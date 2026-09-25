"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL,
  AUDIT_EVIDENCE_CLAIM_DISCIPLINE,
  AUDIT_EVIDENCE_CONTROL_ID_LABEL,
  AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION,
  AUDIT_EVIDENCE_LINEAGE_URL_APPLIED_LIVE_MESSAGE,
  AUDIT_EVIDENCE_LINEAGE_URL_LABEL,
  AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION,
  AUDIT_EVIDENCE_LOOKUP_ERROR_SUMMARY_TITLE,
  AUDIT_EVIDENCE_LOOKUP_FORM_SECTION_TITLE,
  AUDIT_EVIDENCE_LOOKUP_IDENTIFIERS_CONSOLIDATED_HINT,
  AUDIT_EVIDENCE_LOOKUP_KEYBOARD_AFFORDANCE,
  AUDIT_EVIDENCE_LOOKUP_OPEN_LINEAGE_SHORTCUT,
  AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION,
  AUDIT_EVIDENCE_PAGE_LEAD,
  AUDIT_EVIDENCE_PAGE_TITLE,
  AUDIT_EVIDENCE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_SKIP_LINK_LABEL,
  AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL,
  AUDIT_EVIDENCE_START_FROM_INVENTORY_ACTION,
  AUDIT_EVIDENCE_START_FROM_INVENTORY_BODY,
  auditEvidenceLineageUrlHintForLookupPath,
  auditEvidenceLineageUrlParseErrorForLookupPath,
  formatAuditEvidenceLineageUrlAppliedConfirmation,
} from "@/lib/audit-evidence-page-copy";
import {
  fieldsFromDraft,
  persistAuditEvidenceLookupIdentifierDraft,
  readAuditEvidenceLookupIdentifierDraft,
} from "@/lib/governance/audit-evidence-lookup-identifier-draft";
import {
  auditEvidenceLookupIdentifiersReady,
  firstInvalidAuditEvidenceLookupFieldId,
  formatAuditEvidenceLookupReadinessMessage,
  type AuditEvidenceLookupFieldErrors,
  type AuditEvidenceLookupIdentifierFieldKey,
  validateAuditEvidenceLookupIdentifierField,
  validateAuditEvidenceLookupIdentifiers,
} from "@/lib/governance/audit-evidence-lookup-validation";
import { auditEvidencePathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import {
  listRecentAuditEvidenceLineageTargets,
  type ContinueLastAuditEvidenceLineageTarget,
} from "@/lib/resolve-continue-last-audit-evidence-lineage";
import { cn } from "@/lib/utils";

import { AuditEvidenceClaimOrientationStrip } from "./AuditEvidenceClaimOrientationStrip";
import { AuditEvidenceLookupBuildProvenanceStrip } from "./AuditEvidenceLookupBuildProvenanceStrip";
import { AuditEvidenceLookupRecentLineageTable } from "./AuditEvidenceLookupRecentLineageTable";
import { AuditEvidenceLookupScopeBanner } from "./AuditEvidenceLookupScopeBanner";

type IdentifierSnapshot = {
  assessmentId: string;
  snapshotId: string;
  controlId: string;
};

type IdentifierTouchedFields = Record<AuditEvidenceLookupIdentifierFieldKey, boolean>;

const IDENTIFIER_INPUT_CLASS = "font-mono text-sm";

const EMPTY_TOUCHED_FIELDS: IdentifierTouchedFields = {
  assessmentId: false,
  snapshotId: false,
  controlId: false,
};

function fieldErrorClass(hasError: boolean): string {
  return hasError ? "border-destructive focus-visible:ring-destructive" : "";
}

function fieldErrorTextClass(hasError: boolean): string {
  return hasError ? "text-destructive" : "text-al-text-secondary";
}

const IDENTIFIER_FIELD_ELEMENT_IDS: Readonly<Record<AuditEvidenceLookupIdentifierFieldKey, string>> = {
  assessmentId: "audit-evidence-assessment-id",
  snapshotId: "audit-evidence-snapshot-id",
  controlId: "audit-evidence-control-id",
};

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
  const [touchedFields, setTouchedFields] = useState<IdentifierTouchedFields>(EMPTY_TOUCHED_FIELDS);
  const [pasteUndoSnapshot, setPasteUndoSnapshot] = useState<IdentifierSnapshot | null>(null);
  const [pasteLiveMessage, setPasteLiveMessage] = useState("");
  const [pasteAppliedConfirmation, setPasteAppliedConfirmation] = useState("");
  const [recentLineageTargets, setRecentLineageTargets] = useState<
    readonly ContinueLastAuditEvidenceLineageTarget[]
  >([]);

  const openLineageButtonRef = useRef<HTMLButtonElement>(null);
  const draftHydratedRef = useRef(false);

  const inventoryResourcesHref = useMemo(
    () => infrastructureResourcesPathForProductLine(productLine),
    [productLine],
  );

  const canOpenLineage = useMemo(
    () => auditEvidenceLookupIdentifiersReady(assessmentId, snapshotId, controlId),
    [assessmentId, controlId, snapshotId],
  );

  const readinessMessage = useMemo(
    () => formatAuditEvidenceLookupReadinessMessage(assessmentId, snapshotId, controlId),
    [assessmentId, controlId, snapshotId],
  );

  const visibleIdentifierFieldErrors = useMemo(() => {
    const nextErrors: Partial<Record<AuditEvidenceLookupIdentifierFieldKey, string>> = {};

    for (const field of ["assessmentId", "snapshotId", "controlId"] as const) {
      if (!touchedFields[field]) {
        continue;
      }

      const message = validateAuditEvidenceLookupIdentifierField(field, assessmentId, snapshotId, controlId);

      if (message !== undefined) {
        nextErrors[field] = message;
      }
    }

    return nextErrors;
  }, [assessmentId, controlId, snapshotId, touchedFields]);

  const hasVisibleIdentifierFieldErrors = Object.keys(visibleIdentifierFieldErrors).length > 0;

  const errorSummaryItems = useMemo(() => {
    const items: { id: string; message: string }[] = [];

    if (fieldErrors.lineageUrl !== undefined) {
      items.push({ id: "audit-evidence-lineage-url", message: fieldErrors.lineageUrl });
    }

    for (const field of ["assessmentId", "snapshotId", "controlId"] as const) {
      const message = visibleIdentifierFieldErrors[field] ?? fieldErrors[field];

      if (message !== undefined) {
        items.push({ id: IDENTIFIER_FIELD_ELEMENT_IDS[field], message });
      }
    }

    return items;
  }, [fieldErrors, visibleIdentifierFieldErrors]);

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
    setRecentLineageTargets(listRecentAuditEvidenceLineageTargets(productLine));
  }, [productLine]);

  const refreshRecentLineageTargets = useCallback(() => {
    setRecentLineageTargets(listRecentAuditEvidenceLineageTargets(productLine));
  }, [productLine]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const scopeChangedHandler = () => {
      setRecentLineageTargets([]);
    };
    const storageHandler = () => {
      refreshRecentLineageTargets();
    };

    window.addEventListener("archlucid:operator-scope-changed", scopeChangedHandler);
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("archlucid:operator-scope-changed", scopeChangedHandler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [refreshRecentLineageTargets]);

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

  function markIdentifierFieldTouched(field: AuditEvidenceLookupIdentifierFieldKey) {
    setTouchedFields((current) => {
      if (current[field]) {
        return current;
      }

      return { ...current, [field]: true };
    });
  }

  function syncIdentifierFieldError(field: AuditEvidenceLookupIdentifierFieldKey) {
    const message = validateAuditEvidenceLookupIdentifierField(field, assessmentId, snapshotId, controlId);

    setFieldErrors((current) => {
      if (message === undefined) {
        if (current[field] === undefined) {
          return current;
        }

        const next = { ...current };
        delete next[field];

        return next;
      }

      return { ...current, [field]: message };
    });
  }

  function handleIdentifierBlur(field: AuditEvidenceLookupIdentifierFieldKey) {
    markIdentifierFieldTouched(field);
    syncIdentifierFieldError(field);
  }

  function handleIdentifierChange(
    field: AuditEvidenceLookupIdentifierFieldKey,
    nextAssessmentId: string,
    nextSnapshotId: string,
    nextControlId: string,
    setValue: (next: string) => void,
    rawValue: string,
  ) {
    setValue(rawValue);

    if (!touchedFields[field]) {
      clearFieldError(field);
      return;
    }

    const message = validateAuditEvidenceLookupIdentifierField(
      field,
      nextAssessmentId,
      nextSnapshotId,
      nextControlId,
    );

    setFieldErrors((current) => {
      const next = { ...current };

      if (message === undefined) {
        delete next[field];
      } else {
        next[field] = message;
      }

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
    setTouchedFields({
      assessmentId: true,
      snapshotId: true,
      controlId: true,
    });
    setFieldErrors({});
  }

  function focusFirstInvalid(errors: AuditEvidenceLookupFieldErrors) {
    const fieldId = firstInvalidAuditEvidenceLookupFieldId(errors);

    if (fieldId === null) {
      return;
    }

    document.getElementById(fieldId)?.focus();
  }

  const openLineage = useCallback(() => {
    const nextErrors = validateAuditEvidenceLookupIdentifiers(assessmentId, snapshotId, controlId);

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({
        assessmentId: true,
        snapshotId: true,
        controlId: true,
      });
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
  }, [assessmentId, controlId, lookupPath, router, snapshotId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
        return;
      }

      if (!canOpenLineage) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      event.preventDefault();
      openLineage();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canOpenLineage, openLineage]);

  function applyLineageUrlPaste() {
    const parsed = parseAuditEvidenceControlLineagePath(lineageUrl);

    if (parsed === null) {
      const nextErrors = { lineageUrl: lineageUrlParseError };
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      focusFirstInvalid(nextErrors);
      setPasteAppliedConfirmation("");
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
    setPasteAppliedConfirmation(
      formatAuditEvidenceLineageUrlAppliedConfirmation(
        parsed.assessmentId,
        parsed.snapshotId,
        parsed.controlId,
      ),
    );
    window.requestAnimationFrame(() => {
      openLineageButtonRef.current?.focus();
    });
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
    setPasteAppliedConfirmation("");
  }

  function prefillFromRecentTarget(target: ContinueLastAuditEvidenceLineageTarget) {
    setAssessmentId(target.assessmentId);
    setSnapshotId(target.snapshotId);
    setControlId(target.controlId);
    setTouchedFields({
      assessmentId: true,
      snapshotId: true,
      controlId: true,
    });
    setFieldErrors({});
  }

  return (
    <div className="space-y-4 p-4" data-testid="audit-evidence-lookup-page">
      <a
        href={`#${AUDIT_EVIDENCE_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {AUDIT_EVIDENCE_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        title={AUDIT_EVIDENCE_PAGE_TITLE}
        subtitle={AUDIT_EVIDENCE_PAGE_LEAD}
        claimDiscipline={AUDIT_EVIDENCE_CLAIM_DISCIPLINE}
        claimDisciplineTestId="audit-evidence-claim-discipline"
        titleTestId="audit-evidence-page-title"
        headingLevel="h1"
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
              data-testid="audit-evidence-lookup-keyboard-affordance"
            >
              <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search;{" "}
              <ShortcutHint shortcut={AUDIT_EVIDENCE_LOOKUP_OPEN_LINEAGE_SHORTCUT} /> open evidence lineage.
              <span className="sr-only">{AUDIT_EVIDENCE_LOOKUP_KEYBOARD_AFFORDANCE}</span>
            </p>
          </div>
        }
      />

      <div
        id={AUDIT_EVIDENCE_PRIMARY_CONTENT_ID}
        className={cn("min-w-0 space-y-4 scroll-mt-24")}
        data-testid="audit-evidence-primary-content"
      >
        <AuditEvidenceLookupScopeBanner />
        {buyerPolishedShell ? <AuditEvidenceLookupBuildProvenanceStrip /> : null}

        <AuditEvidenceLookupRecentLineageTable
          targets={recentLineageTargets}
          onPrefill={prefillFromRecentTarget}
        />

        <section
          aria-labelledby="audit-evidence-lookup-form-heading"
          className="max-w-4xl space-y-4"
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

          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              applyLineageUrlPaste();
            }}
          >
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
                type="submit"
                variant="outline"
                size="sm"
                data-testid="audit-evidence-lineage-url-apply"
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
            {pasteAppliedConfirmation.length > 0 ? (
              <p
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="audit-evidence-lineage-url-applied-confirmation"
              >
                {pasteAppliedConfirmation}
              </p>
            ) : null}
            <p
              id="audit-evidence-lineage-url-hint"
              className={cn("m-0", fieldErrorTextClass(fieldErrors.lineageUrl !== undefined), OPERATOR_TYPOGRAPHY.helper)}
            >
              {fieldErrors.lineageUrl ?? lineageUrlHint}
            </p>
          </form>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              openLineage();
            }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="audit-evidence-assessment-id">{AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL}</Label>
                <Input
                  id="audit-evidence-assessment-id"
                  data-testid="audit-evidence-assessment-id"
                  className={cn(
                    IDENTIFIER_INPUT_CLASS,
                    fieldErrorClass(visibleIdentifierFieldErrors.assessmentId !== undefined),
                  )}
                  value={assessmentId}
                  autoComplete="off"
                  aria-invalid={visibleIdentifierFieldErrors.assessmentId !== undefined}
                  aria-describedby={
                    visibleIdentifierFieldErrors.assessmentId !== undefined
                      ? "audit-evidence-assessment-id-hint"
                      : "audit-evidence-open-readiness"
                  }
                  onChange={(event) => {
                    handleIdentifierChange(
                      "assessmentId",
                      event.target.value,
                      snapshotId,
                      controlId,
                      setAssessmentId,
                      event.target.value,
                    );
                  }}
                  onBlur={() => {
                    handleIdentifierBlur("assessmentId");
                  }}
                />
                {visibleIdentifierFieldErrors.assessmentId !== undefined ? (
                  <p
                    id="audit-evidence-assessment-id-hint"
                    className={cn("m-0 text-destructive", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {visibleIdentifierFieldErrors.assessmentId}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audit-evidence-snapshot-id">{AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL}</Label>
                <Input
                  id="audit-evidence-snapshot-id"
                  data-testid="audit-evidence-snapshot-id"
                  className={cn(
                    IDENTIFIER_INPUT_CLASS,
                    fieldErrorClass(visibleIdentifierFieldErrors.snapshotId !== undefined),
                  )}
                  value={snapshotId}
                  autoComplete="off"
                  aria-invalid={visibleIdentifierFieldErrors.snapshotId !== undefined}
                  aria-describedby={
                    visibleIdentifierFieldErrors.snapshotId !== undefined
                      ? "audit-evidence-snapshot-id-hint"
                      : "audit-evidence-open-readiness"
                  }
                  onChange={(event) => {
                    handleIdentifierChange(
                      "snapshotId",
                      assessmentId,
                      event.target.value,
                      controlId,
                      setSnapshotId,
                      event.target.value,
                    );
                  }}
                  onBlur={() => {
                    handleIdentifierBlur("snapshotId");
                  }}
                />
                {visibleIdentifierFieldErrors.snapshotId !== undefined ? (
                  <p
                    id="audit-evidence-snapshot-id-hint"
                    className={cn("m-0 text-destructive", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {visibleIdentifierFieldErrors.snapshotId}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audit-evidence-control-id">{AUDIT_EVIDENCE_CONTROL_ID_LABEL}</Label>
                <Input
                  id="audit-evidence-control-id"
                  data-testid="audit-evidence-control-id"
                  className={cn(
                    IDENTIFIER_INPUT_CLASS,
                    fieldErrorClass(visibleIdentifierFieldErrors.controlId !== undefined),
                  )}
                  value={controlId}
                  autoComplete="off"
                  aria-invalid={visibleIdentifierFieldErrors.controlId !== undefined}
                  aria-describedby={
                    visibleIdentifierFieldErrors.controlId !== undefined
                      ? "audit-evidence-control-id-hint"
                      : "audit-evidence-open-readiness"
                  }
                  onChange={(event) => {
                    handleIdentifierChange(
                      "controlId",
                      assessmentId,
                      snapshotId,
                      event.target.value,
                      setControlId,
                      event.target.value,
                    );
                  }}
                  onBlur={() => {
                    handleIdentifierBlur("controlId");
                  }}
                />
                {visibleIdentifierFieldErrors.controlId !== undefined ? (
                  <p
                    id="audit-evidence-control-id-hint"
                    className={cn("m-0 text-destructive", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {visibleIdentifierFieldErrors.controlId}
                  </p>
                ) : null}
              </div>
            </div>

            {!hasVisibleIdentifierFieldErrors ? (
              <p
                id="audit-evidence-identifiers-consolidated-hint"
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {AUDIT_EVIDENCE_LOOKUP_IDENTIFIERS_CONSOLIDATED_HINT}
              </p>
            ) : null}

            <p
              id="audit-evidence-open-readiness"
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="audit-evidence-open-readiness"
            >
              {readinessMessage}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                ref={openLineageButtonRef}
                type="submit"
                variant="primary"
                className={CTA_WIDTH.content}
                disabled={!canOpenLineage}
                aria-describedby="audit-evidence-open-readiness"
                data-testid="audit-evidence-open-lineage"
              >
                {AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION}
              </Button>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                <ShortcutHint shortcut={AUDIT_EVIDENCE_LOOKUP_OPEN_LINEAGE_SHORTCUT} />
              </span>
            </div>
          </form>

          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {AUDIT_EVIDENCE_START_FROM_INVENTORY_BODY}{" "}
            <Link
              href={inventoryResourcesHref}
              className={OPERATOR_LINK.inline}
              data-testid="audit-evidence-browse-inventory-link"
            >
              {AUDIT_EVIDENCE_START_FROM_INVENTORY_ACTION}
            </Link>
          </p>
        </section>

        {buyerPolishedShell ? <AuditEvidenceClaimOrientationStrip /> : null}
      </div>
    </div>
  );
}
