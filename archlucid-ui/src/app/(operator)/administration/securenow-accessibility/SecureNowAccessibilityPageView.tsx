import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_ACCESSIBILITY_BODY,
  SECURENOW_ACCESSIBILITY_HEADING,
  SECURENOW_ACCESSIBILITY_LEAD,
  SECURENOW_ACCESSIBILITY_MAILTO,
  SECURENOW_ACCESSIBILITY_MAILTO_LABEL,
  SECURENOW_ACCESSIBILITY_REFUSAL,
  SECURENOW_ACCESSIBILITY_SURFACES,
} from "@/lib/product-line/securenow-accessibility-copy";
import { cn } from "@/lib/utils";

export function SecureNowAccessibilityPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-accessibility-page">
      <OperatorPageHeader
        title={SECURENOW_ACCESSIBILITY_HEADING}
        subtitle={SECURENOW_ACCESSIBILITY_LEAD}
        claimDiscipline={SECURENOW_ACCESSIBILITY_REFUSAL}
        claimDisciplineTestId="securenow-accessibility-claim-discipline"
        titleTestId="securenow-accessibility-heading"
        subtitleTestId="securenow-accessibility-lead"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-3xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-accessibility-partial-capture"
          cloudConnectionsTestId="securenow-accessibility-partial-capture-cloud-connections"
          extractUploadTestId="securenow-accessibility-partial-capture-extract-upload"
        />

        <section aria-labelledby="securenow-accessibility-context-heading" className="space-y-2">
          <h2 id="securenow-accessibility-context-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            SecureNow scope
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_ACCESSIBILITY_BODY}</p>
        </section>

        <section aria-labelledby="securenow-accessibility-surfaces-heading" className="space-y-2">
          <h2 id="securenow-accessibility-surfaces-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Surfaces in scope
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            {SECURENOW_ACCESSIBILITY_SURFACES.map((surface) => (
              <li key={surface} className={OPERATOR_TYPOGRAPHY.body}>
                {surface}
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href={SECURENOW_ACCESSIBILITY_MAILTO}>
            {SECURENOW_ACCESSIBILITY_MAILTO_LABEL}
          </Link>
        </p>

        <SecureNowFixtureWorkspaceNotEntitlementLine />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-accessibility-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> SecureNow product-line accessibility posture
          only — WCAG 2.2 AA engineering target on listed surfaces, not a third-party audit certificate or AT user-study
          program.
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
