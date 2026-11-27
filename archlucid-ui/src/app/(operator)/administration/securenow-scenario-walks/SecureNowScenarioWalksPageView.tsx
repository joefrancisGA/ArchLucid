"use client";

import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminSecondCapturePathDeltaStrip } from "@/components/product-line/SecureNowAdminSecondCapturePathDeltaStrip";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_SAMPLE_SECOND_FIXTURE_SECTION_ID,
  SECURENOW_SAMPLE_THIRD_FIXTURE_SECTION_ID,
} from "@/lib/marketing/securenow-sample-copy";
import {
  SECURENOW_SCENARIO_WALKS,
  SECURENOW_SCENARIO_WALKS_GUARDRAIL,
  SECURENOW_SCENARIO_WALKS_HEADING,
  SECURENOW_SCENARIO_WALKS_LEAD,
} from "@/lib/product-line/securenow-scenario-walks-copy";
import { cn } from "@/lib/utils";

export function SecureNowScenarioWalksPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-scenario-walks-page">
      <OperatorPageHeader
        title={SECURENOW_SCENARIO_WALKS_HEADING}
        subtitle={SECURENOW_SCENARIO_WALKS_LEAD}
        claimDiscipline={SECURENOW_SCENARIO_WALKS_GUARDRAIL}
        claimDisciplineTestId="securenow-scenario-walks-claim-discipline"
        titleTestId="securenow-scenario-walks-heading"
        subtitleTestId="securenow-scenario-walks-lead"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-4xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-scenario-walks-partial-capture"
          cloudConnectionsTestId="securenow-scenario-walks-partial-capture-cloud-connections"
          extractUploadTestId="securenow-scenario-walks-partial-capture-extract-upload"
        />

        <SecureNowAdminSecondCapturePathDeltaStrip testIdPrefix="securenow-scenario-walks" />

        <section aria-labelledby="securenow-scenario-walks-list-heading" className="space-y-2">
          <h2 id="securenow-scenario-walks-list-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Seven scenarios
          </h2>
          <ul className="space-y-4">
            {SECURENOW_SCENARIO_WALKS.map((scenario) => (
              <li
                key={scenario.id}
                id={scenario.id}
                className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <p className={OPERATOR_TYPOGRAPHY.body}>
                  <span className="font-medium">{scenario.id}</span>
                </p>
                <p className={OPERATOR_TYPOGRAPHY.body}>{scenario.buyerJob}</p>
                <p className={OPERATOR_TYPOGRAPHY.helper}>
                  Honest label: {scenario.honestLabel}
                </p>
                {scenario.operatorHandoffHref !== null && scenario.operatorHandoffLabel !== null ? (
                  <p className={OPERATOR_TYPOGRAPHY.body}>
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={scenario.operatorHandoffHref}
                      data-testid={`securenow-scenario-walk-link-${scenario.id}`}
                    >
                      {scenario.operatorHandoffLabel}
                    </Link>
                  </p>
                ) : null}
                {scenario.id === "fixture-path-02" ? (
                  <p className={OPERATOR_TYPOGRAPHY.body}>
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={`/securenow-sample#${SECURENOW_SAMPLE_SECOND_FIXTURE_SECTION_ID}`}
                      data-testid="securenow-scenario-walk-sample-fixture-path-02"
                    >
                      Open fixture-path-02 on the public sample
                    </Link>
                  </p>
                ) : null}
                {scenario.id === "fixture-path-03" ? (
                  <p className={OPERATOR_TYPOGRAPHY.body}>
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={`/securenow-sample#${SECURENOW_SAMPLE_THIRD_FIXTURE_SECTION_ID}`}
                      data-testid="securenow-scenario-walk-sample-fixture-path-03"
                    >
                      Open fixture-path-03 on the public sample
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <SecureNowFixtureWorkspaceNotEntitlementLine />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-scenario-walks-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Facilitator scenario cards with honest
          labels — synthetic rehearsal until tenant capture; not verified customer evidence.
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
