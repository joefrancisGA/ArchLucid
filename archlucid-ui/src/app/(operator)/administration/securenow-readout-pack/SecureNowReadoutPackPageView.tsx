import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_READOUT_PACK_DRAFT_PATTERNS,
  SECURENOW_READOUT_PACK_FIXTURE_ANCHORS,
  SECURENOW_READOUT_PACK_GUARDRAIL,
  SECURENOW_READOUT_PACK_HEADING,
  SECURENOW_READOUT_PACK_LEAD,
} from "@/lib/product-line/securenow-readout-pack-copy";
import {
  SECURENOW_READOUT_PACK_FILLED_FIXTURE_HEADING,
  SECURENOW_READOUT_PACK_FILLED_FIXTURE_LEAD,
  SECURENOW_READOUT_PACK_FILLED_FIXTURE_ROWS,
} from "@/lib/product-line/securenow-readout-pack-filled-fixture-copy";
import { cn } from "@/lib/utils";

export function SecureNowReadoutPackPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-readout-pack-page">
      <OperatorPageHeader
        title={SECURENOW_READOUT_PACK_HEADING}
        subtitle={SECURENOW_READOUT_PACK_LEAD}
        claimDiscipline={SECURENOW_READOUT_PACK_GUARDRAIL}
        claimDisciplineTestId="securenow-readout-pack-claim-discipline"
        titleTestId="securenow-readout-pack-heading"
        subtitleTestId="securenow-readout-pack-lead"
      />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-4xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-readout-pack-partial-capture"
          cloudConnectionsTestId="securenow-readout-pack-partial-capture-cloud-connections"
          extractUploadTestId="securenow-readout-pack-partial-capture-extract-upload"
        />

        <section
          aria-labelledby="securenow-readout-pack-filled-fixture-heading"
          className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
          data-testid="securenow-readout-pack-filled-fixture"
        >
          <h2 id="securenow-readout-pack-filled-fixture-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {SECURENOW_READOUT_PACK_FILLED_FIXTURE_HEADING}
          </h2>
          <p className={cnMutedHelper()}>{SECURENOW_READOUT_PACK_FILLED_FIXTURE_LEAD}</p>
          <dl className="m-0 space-y-2">
            {SECURENOW_READOUT_PACK_FILLED_FIXTURE_ROWS.map((row) => (
              <div key={row.label}>
                <dt className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>{row.label}</dt>
                <dd className={cnMutedHelper()}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="securenow-readout-pack-fixtures-heading" className="space-y-3">
          <h2 id="securenow-readout-pack-fixtures-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Fixture readout anchors
          </h2>
          <ul className="m-0 list-none space-y-3 p-0">
            {SECURENOW_READOUT_PACK_FIXTURE_ANCHORS.map((anchor) => (
              <li
                key={anchor.href}
                className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                data-testid="securenow-readout-pack-fixture-row"
              >
                <p className={OPERATOR_TYPOGRAPHY.body}>
                  <Link className={OPERATOR_LINK.inline} href={anchor.href}>
                    {anchor.label}
                  </Link>
                </p>
                <p className={cnMutedHelper()}>{anchor.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-readout-pack-patterns-heading" className="space-y-3">
          <h2 id="securenow-readout-pack-patterns-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Draft remediation patterns
          </h2>
          <ul className="m-0 list-none space-y-3 p-0">
            {SECURENOW_READOUT_PACK_DRAFT_PATTERNS.map((pattern) => (
              <li
                key={pattern.href}
                className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                data-testid="securenow-readout-pack-pattern-row"
              >
                <p className={OPERATOR_TYPOGRAPHY.body}>
                  <Link className={OPERATOR_LINK.inline} href={pattern.href}>
                    {pattern.label}
                  </Link>
                </p>
                <p className={cnMutedHelper()}>{pattern.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <SecureNowFixtureWorkspaceNotEntitlementLine />

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-readout-pack-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Fixture readout anchors and draft pattern
          links — synthetic until subscription capture; not certification, commerce authorization, or Azure change.
        </p>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/securenow-sample">
            Public sample beats
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

function cnMutedHelper(): string {
  return `${OPERATOR_TYPOGRAPHY.helper} m-0 mt-1 text-al-text-secondary`;
}