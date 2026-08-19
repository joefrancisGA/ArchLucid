import { cn } from "@/lib/utils";

import { API_KEYS_ONE_TIME_COPY_NOTICE } from "@/lib/api-keys-settings-copy";
import { DismissControl } from "@/components/usability/DismissControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/api-types.generated";

type AdminApiKeyRotateResponse = components["schemas"]["AdminApiKeyRotateResponse"];

export type ApiKeyRotateRevealPanelProps = {
  readonly response: AdminApiKeyRotateResponse;
  readonly onDismiss: () => void;
};

export function ApiKeyRotateRevealPanel(props: ApiKeyRotateRevealPanelProps): React.JSX.Element {
  return (
    <Card data-testid="api-key-rotate-reveal">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>New API key</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 text-rose-900 dark:text-rose-100", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {API_KEYS_ONE_TIME_COPY_NOTICE}
        </p>
        <label className="block space-y-1">
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Key value</span>
          <textarea
            className={cn(
              "w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.micro,
            )}
            readOnly
            rows={2}
            value={props.response.plaintextKey ?? ""}
            data-testid="api-key-plaintext"
          />
        </label>
        <DismissControl onDismiss={props.onDismiss} />
      </CardContent>
    </Card>
  );
}
