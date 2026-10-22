import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { INTERNAL_OPS_ROOT_PATH } from "@/lib/internal-ops-route-paths";
import { PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE } from "@/lib/platform-bundled-policy-packs-page-copy";

/** Internal Operations trail for platform bundled policy packs (IPL). */
export function PlatformBundledPolicyPacksBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="platform-bundled-policy-packs-page-breadcrumb"
      items={[
        { label: "Internal", href: INTERNAL_OPS_ROOT_PATH },
        { label: PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE },
      ]}
    />
  );
}
