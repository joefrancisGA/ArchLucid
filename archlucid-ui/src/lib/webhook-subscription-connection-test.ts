import { WEBHOOKS_TEST_FAILURE, WEBHOOKS_TEST_SUCCESS } from "@/lib/webhooks-page-copy";
import { showError, showSuccess } from "@/lib/toast";
import type { WebhookTestResponse } from "@/types/alert-routing";

/** Presents success/failure toasts for a saved webhook subscription test delivery. */
export function presentWebhookConnectionTestToasts(result: WebhookTestResponse): void {
  if (result.transportSucceeded && result.statusCode >= 200 && result.statusCode < 300) {
    showSuccess(`${WEBHOOKS_TEST_SUCCESS} HTTP ${result.statusCode}`.trimEnd());
  } else if (result.transportSucceeded) {
    showError(
      `Test event returned HTTP ${result.statusCode}`,
      result.reasonPhrase ?? result.responseBodyPreview ?? undefined,
    );
  } else {
    showError(WEBHOOKS_TEST_FAILURE, result.error ?? undefined);
  }
}

/** Presents a toast when the webhook test API call throws before a structured response. */
export function presentWebhookConnectionTestRequestFailure(error: unknown): void {
  showError(WEBHOOKS_TEST_FAILURE, error instanceof Error ? error.message : String(error));
}
