import { WEBHOOKS_BANNED_UI_PATTERNS, WEBHOOKS_TEST_FAILURE } from "@/lib/webhooks-page-copy";

const HTTP_STATUS_PATTERN = /\(HTTP\s+\d{3}\)/i;

function containsBannedWebhookCopy(text: string): boolean {
  return WEBHOOKS_BANNED_UI_PATTERNS.some((pattern) => pattern.test(text));
}

export function formatWebhooksCustomerError(fallback: string, raw: string | null | undefined): string {
  const text = (raw ?? "").trim();

  if (text.length === 0) {
    return fallback;
  }

  if (containsBannedWebhookCopy(text) || HTTP_STATUS_PATTERN.test(text)) {
    return fallback;
  }

  return text;
}

export function formatWebhooksSaveError(raw: string | null | undefined): string {
  return formatWebhooksCustomerError("Could not save the subscription. Check the fields and try again.", raw);
}

export function formatWebhooksTestTransportError(raw: string | null | undefined): string {
  return formatWebhooksCustomerError(WEBHOOKS_TEST_FAILURE, raw);
}

export function formatWebhooksUnexpectedError(error: unknown): string {
  if (error instanceof Error) {
    return formatWebhooksCustomerError("Something went wrong. Try again or contact your administrator.", error.message);
  }

  return "Something went wrong. Try again or contact your administrator.";
}
