import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING } from "@/lib/identity-providers-settings-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Shown while JWT `/me` is still resolving so admins are not told they lack access. */
export function IdentityProvidersSettingsLoadingState(): React.JSX.Element {
  return (
    <OperatorPageContainer
      variant="settings"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="identity-providers-settings-loading"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING}
      </p>
    </OperatorPageContainer>
  );
}
