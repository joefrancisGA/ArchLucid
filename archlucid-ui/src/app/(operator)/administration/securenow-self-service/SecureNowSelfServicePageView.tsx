import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowCollectionSetupStatusSection } from "@/components/product-line/SecureNowCollectionSetupStatusSection";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_SELF_SERVICE_GUARDRAIL,
  SECURENOW_SELF_SERVICE_HEADING,
  SECURENOW_SELF_SERVICE_LEAD,
  SECURENOW_SELF_SERVICE_STEPS,
} from "@/lib/product-line/securenow-self-service-copy";
import { SECURENOW_SELF_SERVICE_RANK_STORED_PATH_LINE } from "@/lib/product-line/securenow-self-service-rank-stored-path-copy";
import { cn } from "@/lib/utils";

export function SecureNowSelfServicePageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-self-service-page">
      <OperatorPageHeader
        title={SECURENOW_SELF_SERVICE_HEADING}
        subtitle={SECURENOW_SELF_SERVICE_LEAD}
        claimDiscipline={SECURENOW_SELF_SERVICE_GUARDRAIL}
        claimDisciplineTestId="securenow-self-service-claim-discipline"
        titleTestId="securenow-self-service-heading"
        subtitleTestId="securenow-self-service-lead"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-3xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-self-service-partial-capture"
          cloudConnectionsTestId="securenow-self-service-partial-capture-cloud-connections"
          extractUploadTestId="securenow-self-service-partial-capture-extract-upload"
        />
        <SecureNowCollectionSetupStatusSection
          testIdPrefix="securenow-self-service"
          sectionId="collection"
        />

        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="securenow-self-service-rank-stored-path">
          {SECURENOW_SELF_SERVICE_RANK_STORED_PATH_LINE}
        </p>

        <section aria-labelledby="securenow-self-service-steps-heading" className="space-y-2">
          <h2 id="securenow-self-service-steps-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Four checks
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            {SECURENOW_SELF_SERVICE_STEPS.map((step) => (
              <li
                key={step.title}
                id={step.id === "collection" ? undefined : step.id}
                className={OPERATOR_TYPOGRAPHY.body}
              >
                <span className="font-medium">{step.title}</span>
                <span> — {step.body}</span>
                {step.href ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.href}>
                      {step.secondaryHref ? "Open Priorities & waves" : "Open in product"}
                    </Link>
                  </>
                ) : null}
                {step.secondaryHref ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.secondaryHref}>
                      Open remediation tracker
                    </Link>
                  </>
                ) : null}
                {step.mailto ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.mailto}>
                      Email support
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <SecureNowFixtureWorkspaceNotEntitlementLine />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-self-service-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Collection setup status and self-service
          checklist links — ranked path from workspace storage when eligible; not unattended remediation.
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
