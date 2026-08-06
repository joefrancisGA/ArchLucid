import Link from "next/link";

import { cn } from "@/lib/utils";

import {
  API_KEYS_RESTRICTED_DESCRIPTION,
  API_KEYS_RESTRICTED_TITLE,
  API_KEYS_SURFACE_DISABLED_DESCRIPTION,
} from "@/lib/api-keys-settings-copy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ApiKeysSettingsRestrictedStateProps = {
  readonly reason: "forbidden" | "surface_disabled";
};

export function ApiKeysSettingsRestrictedState(props: ApiKeysSettingsRestrictedStateProps): React.JSX.Element {
  const description =
    props.reason === "surface_disabled"
      ? API_KEYS_SURFACE_DISABLED_DESCRIPTION
      : API_KEYS_RESTRICTED_DESCRIPTION;

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="api-keys-settings-restricted">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/administration">← Settings</Link>
        </Button>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{API_KEYS_RESTRICTED_TITLE}</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {description}
        </p>
      </div>
      <Card>
        <CardContent className={cn("py-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            If you need API key access for an approved integration, ask a workspace administrator or your ArchLucid
            contact to enable enterprise configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
