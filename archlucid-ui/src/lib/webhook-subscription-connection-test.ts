import { showError, showSuccess } from "@/lib/toast";
import type { WebhookTestResponse } from "@/types/alert-routing";

/** Presents success/failure toasts for a webhook subscription synthetic ping result. */
export function presentWebhookConnectionTestToasts(result: WebhookTestResponse): void {
  if (result.transportSucceeded && result.statusCode >= 200 && result.statusCode < 300) {
    showSuccess(`Connection test succeeded — HTTP ${result.statusCode} ${result.reasonPhrase ?? ""}`.trimEnd());
  } else if (result.transportSucceeded) {
    showError(
      `Connection test returned HTTP ${result.statusCode}`,
      result.reasonPhrase ?? result.responseBodyPreview ?? undefined,
    );
  } else {
    showError("Connection test failed — could not reach destination", result.error ?? undefined);
  }
}

/** Presents a toast when the webhook test API call throws before a structured response. */
export function presentWebhookConnectionTestRequestFailure(error: unknown): void {
  showError("Connection test failed", error instanceof Error ? error.message : String(error));
}
