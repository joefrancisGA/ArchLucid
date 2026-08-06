import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IDENTITY_PROVIDERS_RESTRICTED_DESCRIPTION,
  IDENTITY_PROVIDERS_RESTRICTED_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function IdentityProvidersSettingsRestrictedState(): React.JSX.Element {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="identity-providers-settings-restricted">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/administration">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{IDENTITY_PROVIDERS_RESTRICTED_TITLE}</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {IDENTITY_PROVIDERS_RESTRICTED_DESCRIPTION}
        </p>
      </div>
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
