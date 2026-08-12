import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  IDENTITY_PROVIDERS_RESTRICTED_DESCRIPTION,
  IDENTITY_PROVIDERS_RESTRICTED_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function IdentityProvidersSettingsRestrictedState(): React.JSX.Element {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="identity-providers-settings-restricted">
      <OperatorPageHeader
        title={IDENTITY_PROVIDERS_RESTRICTED_TITLE}
        headingLevel="h1"
        subtitle={
          <span role="alert">{IDENTITY_PROVIDERS_RESTRICTED_DESCRIPTION}</span>
        }
        subtitleClassName="max-w-prose"
      />
      <Card>
        <CardContent className={cn("py-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Ask a workspace administrator to configure sign-in, single sign-on, or role mapping for this workspace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
