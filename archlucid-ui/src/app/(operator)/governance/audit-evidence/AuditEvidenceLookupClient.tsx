"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { buildAuditEvidenceControlLineagePath } from "@/lib/audit-evidence-lineage-route";

export function AuditEvidenceLookupClient() {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [controlId, setControlId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function openLineage() {
    if (!assessmentId.trim() || !snapshotId.trim() || !controlId.trim()) {
      setValidationError("Assessment, snapshot, and control ids are required.");
      return;
    }

    setValidationError(null);
    router.push(buildAuditEvidenceControlLineagePath(assessmentId.trim(), snapshotId.trim(), controlId.trim()));
  }

  return (
    <div className="space-y-6 p-4" data-testid="audit-evidence-lookup-page">
      <header className="space-y-2">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Audit evidence lineage</h1>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Open the deterministic chain of custody for an audit control. Enter ids from an assessment snapshot export or
          API integration — not an AI summary.
        </p>
      </header>

      <form
        className="grid max-w-2xl gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          openLineage();
        }}
      >
        <label className="grid gap-1">
          <span className={OPERATOR_TYPOGRAPHY.body}>Assessment id</span>
          <input
            className="rounded border border-border bg-background px-3 py-2 font-mono text-sm"
            data-testid="audit-evidence-assessment-id"
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className={OPERATOR_TYPOGRAPHY.body}>Snapshot id</span>
          <input
            className="rounded border border-border bg-background px-3 py-2 font-mono text-sm"
            data-testid="audit-evidence-snapshot-id"
            value={snapshotId}
            onChange={(event) => setSnapshotId(event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className={OPERATOR_TYPOGRAPHY.body}>Control id</span>
          <input
            className="rounded border border-border bg-background px-3 py-2 font-mono text-sm"
            data-testid="audit-evidence-control-id"
            value={controlId}
            onChange={(event) => setControlId(event.target.value)}
          />
        </label>
        {validationError ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="audit-evidence-lookup-validation-error">{validationError}</p>
        ) : null}
        <button
          type="submit"
          className="w-fit rounded bg-primary px-4 py-2 text-primary-foreground"
          data-testid="audit-evidence-open-lineage"
        >
          Open chain of custody
        </button>
      </form>
    </div>
  );
}
