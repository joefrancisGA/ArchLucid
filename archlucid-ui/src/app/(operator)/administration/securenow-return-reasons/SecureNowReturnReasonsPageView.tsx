import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_RETURN_REASONS_GUARDRAIL,
  SECURENOW_RETURN_REASONS_HEADING,
  SECURENOW_RETURN_REASONS_LEAD,
  SECURENOW_RETURN_REASONS_ROWS,
} from "@/lib/product-line/securenow-return-reasons-copy";
import { cn } from "@/lib/utils";

export function SecureNowReturnReasonsPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-return-reasons-page">
      <OperatorPageHeader
        title={SECURENOW_RETURN_REASONS_HEADING}
        subtitle={SECURENOW_RETURN_REASONS_LEAD}
        claimDiscipline={SECURENOW_RETURN_REASONS_GUARDRAIL}
        claimDisciplineTestId="securenow-return-reasons-claim-discipline"
        titleTestId="securenow-return-reasons-heading"
        subtitleTestId="securenow-return-reasons-lead"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-3xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-return-reasons-partial-capture"
          cloudConnectionsTestId="securenow-return-reasons-partial-capture-cloud-connections"
          extractUploadTestId="securenow-return-reasons-partial-capture-extract-upload"
        />

        <section aria-labelledby="securenow-return-reasons-list-heading" className="space-y-2">
          <h2 id="securenow-return-reasons-list-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Existing work queues
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_RETURN_REASONS_ROWS.map((row) => (
              <li key={row.href} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={row.href}>
                  {row.label}
                </Link>
                <span> — {row.summary}</span>
              </li>
            ))}
          </ul>
        </section>

        <SecureNowFixtureWorkspaceNotEntitlementLine />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-return-reasons-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Curated return-to-work links into existing
          queues — not engagement scoring, scheduled capture, or outbound reminders.
        </p>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/administration">
            Administration hub
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href="/">
            Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}