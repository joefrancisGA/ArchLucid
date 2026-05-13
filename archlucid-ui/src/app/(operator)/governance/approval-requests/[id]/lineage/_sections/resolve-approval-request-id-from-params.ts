export function resolveApprovalRequestIdFromParams(
  params: { readonly id?: string | string[] } | null | undefined,
): string {
  const id = params?.id;

  if (typeof id === "string") {
    return id;
  }

  return "";
}
