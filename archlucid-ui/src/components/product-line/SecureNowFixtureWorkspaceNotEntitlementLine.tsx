import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer/buyer-demo-content-gating";
import { SECURENOW_FIXTURE_WORKSPACE_NOT_ENTITLEMENT_LINE } from "@/lib/product-line/securenow-fixture-workspace-not-entitlement-copy";

type SecureNowFixtureWorkspaceNotEntitlementLineProps = {
  /** Override the demo-build check in tests. */
  readonly fixtureWorkspace?: boolean;
};

/** Names a sample session so it cannot be read as a purchased SecureNow SKU. */
export function SecureNowFixtureWorkspaceNotEntitlementLine(
  props: SecureNowFixtureWorkspaceNotEntitlementLineProps,
): React.JSX.Element | null {
  const showFixtureLine = props.fixtureWorkspace ?? isExplicitStaticDemoMarketingBuild();

  if (!showFixtureLine) {
    return null;
  }

  return (
    <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="securenow-fixture-workspace-not-entitlement">
      {SECURENOW_FIXTURE_WORKSPACE_NOT_ENTITLEMENT_LINE}
    </p>
  );
}
