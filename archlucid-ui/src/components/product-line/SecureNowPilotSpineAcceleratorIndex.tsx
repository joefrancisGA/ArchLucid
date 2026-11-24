import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildGoldenSponsorPackageWalkthroughHref } from "@/lib/golden-sponsor-package-walkthrough";
import { buildRemediationFactoryEmptyFixtureBeatHref } from "@/lib/remediation-factory/remediation-factory-empty-fixture-beat-href";
import {
  SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_LEAD,
  SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_TITLE,
  SECURENOW_PILOT_SPINE_ACCELERATOR_LINKS,
} from "@/lib/product-line/securenow-pilot-spine-accelerator-index-copy";
import { cn } from "@/lib/utils";

/** Cross-links labeled accelerators from the SecureNow pilot spine (fixture walkthrough). */
export function SecureNowPilotSpineAcceleratorIndex(): React.JSX.Element {
  const goldenHref = buildGoldenSponsorPackageWalkthroughHref();

  return (
    <section
      aria-labelledby="securenow-pilot-spine-accelerator-index-heading"
      className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
      data-testid="securenow-pilot-spine-accelerator-index"
    >
      <h2 id="securenow-pilot-spine-accelerator-index-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_TITLE}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-pilot-spine-accelerator-index-lead">
        {SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_LEAD}
      </p>
      <ul className={cn("m-0 mt-4 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)} data-testid="securenow-pilot-spine-accelerator-index-list">
        {SECURENOW_PILOT_SPINE_ACCELERATOR_LINKS.map((link) => {
          const href =
            link.id === "golden-sponsor"
              ? goldenHref
              : link.id === "remediation-factory-empty"
                ? buildRemediationFactoryEmptyFixtureBeatHref()
                : link.href;

          return (
            <li key={link.id} data-testid={`securenow-pilot-spine-accelerator-link-${link.id}`}>
              <Link className={OPERATOR_LINK.inline} href={href}>
                {link.label}
              </Link>
              <p className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.helper)}>{link.hint}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
