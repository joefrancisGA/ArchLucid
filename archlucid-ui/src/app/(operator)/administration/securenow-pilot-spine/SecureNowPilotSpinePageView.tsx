import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { SecureNowPilotSpineAcceleratorIndex } from "@/components/product-line/SecureNowPilotSpineAcceleratorIndex";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PILOT_SPINE_GUARDRAIL,
  SECURENOW_PILOT_SPINE_HEADING,
  SECURENOW_PILOT_SPINE_LEAD,
  SECURENOW_PILOT_SPINE_STEPS,
  appendSecureNowWalkBeat,
} from "@/lib/product-line/securenow-pilot-spine-copy";
import { cn } from "@/lib/utils";

export function SecureNowPilotSpinePageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-pilot-spine-page">
      <OperatorPageHeader
        title={SECURENOW_PILOT_SPINE_HEADING}
        subtitle={SECURENOW_PILOT_SPINE_LEAD}
        claimDiscipline={SECURENOW_PILOT_SPINE_GUARDRAIL}
        claimDisciplineTestId="securenow-pilot-spine-claim-discipline"
        titleTestId="securenow-pilot-spine-heading"
        subtitleTestId="securenow-pilot-spine-lead"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-4xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-pilot-spine-partial-capture"
          cloudConnectionsTestId="securenow-pilot-spine-partial-capture-cloud-connections"
          extractUploadTestId="securenow-pilot-spine-partial-capture-extract-upload"
        />
        <ol className="m-0 list-decimal space-y-4 pl-5" aria-label="SecureNow pilot walkthrough beats">
          {SECURENOW_PILOT_SPINE_STEPS.map((step) => (
            <li
              key={step.anchorId}
              id={step.anchorId}
              className="scroll-mt-24 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <p className={OPERATOR_TYPOGRAPHY.body}>
                <span className="font-medium">
                  Beat {step.beat} — {step.title}
                </span>
              </p>
              <p className={OPERATOR_TYPOGRAPHY.body}>{step.body}</p>
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                <span className="font-semibold text-al-text-primary">Say:</span> {step.facilitatorSay}
              </p>
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                <span className="font-semibold text-al-text-primary">Do not say:</span> {step.facilitatorDoNot}
              </p>
              <p className={OPERATOR_TYPOGRAPHY.body}>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={appendSecureNowWalkBeat(step.operatorHref, step.beat)}
                  data-testid={`securenow-pilot-spine-beat-link-${step.beat}`}
                >
                  Open in product
                </Link>
              </p>
            </li>
          ))}
        </ol>

        <SecureNowFixtureWorkspaceNotEntitlementLine />
        <SecureNowPilotSpineAcceleratorIndex />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-pilot-spine-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Facilitator beats and deep links into product
          surfaces — synthetic fixture until subscription capture; not customer evidence or commerce authorization.
        </p>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/securenow-sample">
            Read the public sample beats
          </Link>
          {" · "}
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