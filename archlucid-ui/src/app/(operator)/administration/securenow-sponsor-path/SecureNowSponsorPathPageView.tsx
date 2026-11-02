"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  secureNowPilotDispositionStorageKey,
  SECURENOW_PILOT_DISPOSITION_STORAGE_DISCIPLINE,
} from "@/lib/product-line/securenow-pilot-disposition-storage";
import {
  loadSecureNowPilotDispositionForPath,
  persistSecureNowPilotDispositionForPath,
} from "@/lib/product-line/securenow-pilot-disposition-sync";

export function SecureNowSponsorPathPageView(): React.JSX.Element {
  const searchParams = useSearchParams();
  const pathId = searchParams.get("pathId")?.trim() ?? "";
  const storageKey = pathId.length > 0 ? secureNowPilotDispositionStorageKey(pathId) : null;
  const [outcome, setOutcome] = useState("");
  const [rationale, setRationale] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDisposition, setSavedDisposition] = useState<{ outcome: string; rationale: string } | null>(null);

  useEffect(() => {
    if (pathId.length === 0) {
      setOutcome("");
      setRationale("");
      setSavedDisposition(null);
      return;
    }

    let cancelled = false;

    void loadSecureNowPilotDispositionForPath(pathId).then((stored) => {
      if (cancelled) {
        return;
      }

      if (stored === null) {
        setOutcome("");
        setRationale("");
        setSavedDisposition(null);
        return;
      }

      setOutcome(stored.outcome);
      setRationale(stored.rationale);
      setSavedDisposition(stored);
    });

    return () => {
      cancelled = true;
    };
  }, [pathId]);

  const saveDisposition = () => {
    if (storageKey === null || outcome.length === 0) {
      setSaveError("Select Proceed, Extend, or Stop for a path.");
      return;
    }

    if (rationale.trim().length === 0) {
      setSaveError("Rationale is required.");
      return;
    }

    const record = { outcome, rationale: rationale.trim() };

    void persistSecureNowPilotDispositionForPath(pathId, record).then((errorMessage) => {
      if (errorMessage !== null) {
        setSaveError(errorMessage);
        return;
      }

      setSavedDisposition(record);
      setSaveError(null);
    });
  };

  return (
    <OperatorPageContainer variant="full" data-testid="securenow-sponsor-path-page">
      <OperatorPageHeader
        title="Sponsor path"
        subtitle="Internal preparation for a human sponsor readout. SecureNow beta remains NO_GO."
      />
      <main className="mt-6 max-w-4xl space-y-6">
        {pathId.length === 0 ? (
          <p className={OPERATOR_TYPOGRAPHY.body}>
            <Link className={OPERATOR_LINK.inline} href="/security/remediation-factory">
              Select a ranked path in Path inspect.
            </Link>
          </p>
        ) : (
          <>
            <SecurityEvidencePathInspectPanel
              id="sponsor-path-inspect"
              findingId={null}
              pathIdOverride={pathId}
            />
            <section aria-labelledby="securenow-sponsor-path-outcome-heading" className="space-y-2">
              <h2 id="securenow-sponsor-path-outcome-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                Human disposition
              </h2>
              {pathId === "fixture-path-01" ? (
                <p className={OPERATOR_TYPOGRAPHY.helper}>Synthetic fixture. Not a customer result.</p>
              ) : null}
              <label className="block space-y-1">
                <span className={OPERATOR_TYPOGRAPHY.helper}>Outcome</span>
                <select
                  className="w-full rounded border border-border bg-background px-3 py-2"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value)}
                  aria-label="Path disposition outcome"
                >
                  <option value="">Select an outcome</option>
                  <option value="Proceed">Proceed</option>
                  <option value="Extend">Extend</option>
                  <option value="Stop">Stop</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className={OPERATOR_TYPOGRAPHY.helper}>Rationale</span>
                <textarea
                  className="min-h-24 w-full rounded border border-border bg-background px-3 py-2"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  aria-label="Path disposition rationale"
                />
              </label>
              <button type="button" className="rounded border border-border px-3 py-2" onClick={saveDisposition}>
                Save path disposition
              </button>
              {saveError !== null ? (
                <p className="text-rose-700" role="alert">
                  {saveError}
                </p>
              ) : null}
              {savedDisposition !== null ? (
                <p className={OPERATOR_TYPOGRAPHY.body} data-testid="securenow-sponsor-path-saved-disposition">
                  Saved {savedDisposition.outcome}: {savedDisposition.rationale}
                </p>
              ) : null}
              <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PILOT_DISPOSITION_STORAGE_DISCIPLINE}</p>
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                SecureNow recommends; it does not change Azure. A sponsor disposition does not clear beta NO_GO.
              </p>
              <p className={OPERATOR_TYPOGRAPHY.body}>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={`/administration/securenow-pilot-decision?pathId=${encodeURIComponent(pathId)}`}
                >
                  Open pilot decision record
                </Link>
              </p>
            </section>
          </>
        )}
      </main>
    </OperatorPageContainer>
  );
}
