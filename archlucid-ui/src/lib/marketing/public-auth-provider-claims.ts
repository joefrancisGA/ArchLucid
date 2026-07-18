/**
 * Public marketing claims for work/school IdPs must match enabled env config.
 * Google is only advertised when Google OIDC public env is present (same gate as sign-in picker).
 */

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function isPublicGoogleWorkSchoolConfigured(): boolean {
  const authority = trimEnv(process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY);
  const clientId = trimEnv(process.env.NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID);

  return authority.length > 0 && clientId.length > 0;
}

export function resolvePublicWorkSchoolProviderLabels(): readonly string[] {
  const labels: string[] = ["Microsoft"];

  if (isPublicGoogleWorkSchoolConfigured()) {
    labels.push("Google");
  }

  return labels;
}

/** Buyer-facing phrase for docs/UI: "Microsoft" or "Microsoft or Google". */
export function formatPublicWorkSchoolProviderClaim(): string {
  const labels = resolvePublicWorkSchoolProviderLabels();

  if (labels.length === 1) {
    return labels[0]!;
  }

  if (labels.length === 2) {
    return `${labels[0]} or ${labels[1]}`;
  }

  const head = labels.slice(0, -1).join(", ");
  const tail = labels[labels.length - 1];

  return `${head}, or ${tail}`;
}

export function formatPublicWorkSchoolSignInSentence(): string {
  return `${formatPublicWorkSchoolProviderClaim()}, or your organization's single sign-on (SSO) when it is configured.`;
}
