import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_PATH_INSPECT_EXPECTATION_KEYS_LINE } from "@/lib/product-line/securenow-path-inspect-copy";
import { SECURENOW_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { cn } from "@/lib/utils";

export function SecureNowFindingsWk21HonestyStrip(): React.JSX.Element {
  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-findings-wk21-honesty">
      {SECURENOW_PATH_INSPECT_EXPECTATION_KEYS_LINE}{" "}
      <Link className={OPERATOR_LINK.inline} href={SECURENOW_STANDARDS_AND_RULES_PATH}>
        Standards and rules
      </Link>
    </p>
  );
}
