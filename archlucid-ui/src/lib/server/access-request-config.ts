import "server-only";

/** Server-only access-request configuration — never import from client components. */

export type AccessRequestEmailConfig = {
  readonly recipientEmail: string;
  readonly senderEmail: string;
  readonly acsConnectionString: string;
  readonly dryRun: boolean;
};

export function readAccessRequestRecipientEmail(): string | null {
  const value = process.env.ACCESS_REQUEST_RECIPIENT_EMAIL?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function readAccessRequestSenderEmail(): string | null {
  const value = process.env.ACCESS_REQUEST_SENDER_EMAIL?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function readAccessRequestAcsConnectionString(): string | null {
  const value = process.env.ACCESS_REQUEST_ACS_CONNECTION_STRING?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function readAccessRequestEmailDryRun(): boolean {
  const raw = process.env.ACCESS_REQUEST_EMAIL_DRY_RUN?.trim().toLowerCase() ?? "";

  return raw === "1" || raw === "true" || raw === "yes";
}

export function resolveAccessRequestEmailConfig(): AccessRequestEmailConfig | null {
  const recipientEmail = readAccessRequestRecipientEmail();

  if (recipientEmail === null) {
    return null;
  }

  const senderEmail = readAccessRequestSenderEmail();
  const acsConnectionString = readAccessRequestAcsConnectionString();
  const dryRun = readAccessRequestEmailDryRun();

  if (dryRun) {
    return {
      recipientEmail,
      senderEmail: senderEmail ?? "no-reply@archlucid.invalid",
      acsConnectionString: acsConnectionString ?? "",
      dryRun: true,
    };
  }

  if (senderEmail === null || acsConnectionString === null) {
    return null;
  }

  return {
    recipientEmail,
    senderEmail,
    acsConnectionString,
    dryRun: false,
  };
}
