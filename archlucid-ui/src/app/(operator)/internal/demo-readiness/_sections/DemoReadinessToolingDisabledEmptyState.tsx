import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_BODY,
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_DIAGNOSTICS_CTA,
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_SYSTEM_HEALTH_CTA,
  INTERNAL_DEMO_READINESS_TOOLING_DISABLED_TITLE,
} from "@/lib/demo-readiness-evidence-copy";
import { INTERNAL_HEALTH_PATH } from "@/lib/internal-ops-route-paths";

/** Orient admins who deep-link when demo-operator tooling is disabled (TB-1411). */
export function DemoReadinessToolingDisabledEmptyState(): React.JSX.Element {
  return (
    <EnterpriseCompactEmptyState
      testId="demo-readiness-tooling-disabled-empty-state"
      title={INTERNAL_DEMO_READINESS_TOOLING_DISABLED_TITLE}
      description={INTERNAL_DEMO_READINESS_TOOLING_DISABLED_BODY}
      actions={[
        {
          label: INTERNAL_DEMO_READINESS_TOOLING_DISABLED_DIAGNOSTICS_CTA,
          href: INTERNAL_HEALTH_PATH,
          variant: "primary",
        },
        {
          label: INTERNAL_DEMO_READINESS_TOOLING_DISABLED_SYSTEM_HEALTH_CTA,
          href: "/administration/system-health",
          variant: "outline",
        },
      ]}
    />
  );
}
