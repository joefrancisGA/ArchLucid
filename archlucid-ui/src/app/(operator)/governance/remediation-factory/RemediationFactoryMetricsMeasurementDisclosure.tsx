import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { SECURITY_EVIDENCE_PATHS_HELP_EXECUTIVE_METRICS_MEASUREMENT_HREF } from "@/lib/security-evidence-paths-help-guide-content";
import { cn } from "@/lib/utils";

import { REMEDIATION_FACTORY_METRICS_MEASUREMENT_TITLE } from "./remediation-factory-metric-presentation";

export function RemediationFactoryMetricsMeasurementDisclosure() {
  return (
    <div>
      <Link
        href={SECURITY_EVIDENCE_PATHS_HELP_EXECUTIVE_METRICS_MEASUREMENT_HREF}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid="remediation-metrics-measurement-help-link"
      >
        {REMEDIATION_FACTORY_METRICS_MEASUREMENT_TITLE}
      </Link>
    </div>
  );
}
