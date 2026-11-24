import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import {
  appendSecureNowWalkBeat,
  SECURENOW_FIXTURE_PATH_ID,
} from "@/lib/product-line/securenow-pilot-spine-copy";

const FIXTURE_PATH_INSPECT_HREF = `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${SECURENOW_FIXTURE_PATH_ID}`;

/** Labeled pilot beat 2 for an empty ranked-path list — fixture only. */
export function buildRemediationFactoryEmptyFixtureBeatHref(): string {
  return appendSecureNowWalkBeat(FIXTURE_PATH_INSPECT_HREF, 2);
}
