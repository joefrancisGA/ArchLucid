"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function SecureNowSponsorPathPageView(): React.JSX.Element {
  const searchParams = useSearchParams();
  const pathId = searchParams.get("pathId")?.trim() ?? "";

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
              <fieldset className="space-y-2">
                <legend className={OPERATOR_TYPOGRAPHY.helper}>Choose one after the sponsor readout.</legend>
                {["Proceed", "Extend", "Stop"].map((outcome) => (
                  <label key={outcome} className="mr-4 inline-flex items-center gap-2">
                    <input type="radio" name="sponsor-disposition" value={outcome} />
                    <span className={OPERATOR_TYPOGRAPHY.body}>{outcome}</span>
                  </label>
                ))}
              </fieldset>
              <p className={OPERATOR_TYPOGRAPHY.helper}>Rationale: NOT COLLECTED.</p>
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                SecureNow recommends; it does not change Azure. A sponsor disposition does not clear beta NO_GO.
              </p>
            </section>
          </>
        )}
      </main>
    </OperatorPageContainer>
  );
}
