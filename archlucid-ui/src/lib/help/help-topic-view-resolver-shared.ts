export function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const value = searchParams?.[key];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

export function resolveAzurePermissionsReturnHref(returnTo: string | undefined): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections";
}

export function resolveGcpConnectionHelpReturnHref(returnTo: string | undefined): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections/gcp";
}
