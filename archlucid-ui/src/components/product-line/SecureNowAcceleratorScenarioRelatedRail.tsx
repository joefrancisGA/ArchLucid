import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveSecureNowScenarioWalkRelatedRows } from "@/lib/product-line/securenow-accelerator-related-by-href";

type SecureNowAcceleratorScenarioRelatedRailProps = {
  readonly scenarioId: string;
};

export function SecureNowAcceleratorScenarioRelatedRail(props: SecureNowAcceleratorScenarioRelatedRailProps): React.JSX.Element | null {
  const rows = resolveSecureNowScenarioWalkRelatedRows(props.scenarioId);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1" data-testid={`securenow-scenario-related-rail-${props.scenarioId}`}>
      <p className={OPERATOR_TYPOGRAPHY.helper}>Related next steps (cross-link)</p>
      <ul className="m-0 list-disc pl-5">
        {rows.map((row) => (
          <li key={row.href} className={OPERATOR_TYPOGRAPHY.body}>
            <Link href={row.href} className={OPERATOR_LINK.inline}>
              {row.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
