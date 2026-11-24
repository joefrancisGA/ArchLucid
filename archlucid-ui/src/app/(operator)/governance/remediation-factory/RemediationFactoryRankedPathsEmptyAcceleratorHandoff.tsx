import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import {
  appendSecureNowWalkBeat,
  SECURENOW_FIXTURE_PATH_ID,
  SECURENOW_PILOT_SPINE_PATH,
} from "@/lib/product-line/securenow-pilot-spine-copy";
import {
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_ACCELERATOR_CTA,
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_ACCELERATOR_LINE,
} from "@/lib/remediation-factory/remediation-factory-ranked-paths-empty-accelerator-handoff-copy";
import { cn } from "@/lib/utils";

const FIXTURE_PATH_INSPECT_HREF = `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${SECURENOW_FIXTURE_PATH_ID}`;

export function RemediationFactoryRankedPathsEmptyAcceleratorHandoff(): React.JSX.Element {
  const fixtureBeatHref = appendSecureNowWalkBeat(FIXTURE_PATH_INSPECT_HREF, 2);
  const pilotSpineBeatHref = `${SECURENOW_PILOT_SPINE_PATH}#beat-ranked-path`;

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-factory-ranked-paths-empty-accelerator-handoff">
      {REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_ACCELERATOR_LINE}{" "}
      <Link className={OPERATOR_LINK.inline} href={fixtureBeatHref} data-testid="remediation-factory-ranked-paths-empty-fixture-path">
        {REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_ACCELERATOR_CTA}
      </Link>
      {" · "}
      <Link className={OPERATOR_LINK.inline} href={pilotSpineBeatHref} data-testid="remediation-factory-ranked-paths-empty-pilot-spine">
        Pilot walkthrough catalog
      </Link>
    </p>
  );
}
