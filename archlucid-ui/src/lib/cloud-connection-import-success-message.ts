export function formatCloudConnectionImportSuccessMessage(
  completedLabel: "Validation" | "Collection",
  resourceCount: number | null | undefined,
  packageId: string | null | undefined,
): string {
  const resourcePart =
    typeof resourceCount === "number" && Number.isFinite(resourceCount)
      ? `${resourceCount} resources imported`
      : "Resource count was not stored.";
  const packagePart =
    typeof packageId === "string" && packageId.trim().length > 0
      ? `package ${packageId.trim()}`
      : "Architecture package identifier was not stored.";

  return `${completedLabel} completed (${resourcePart} as ${packagePart}).`;
}

export function formatTier2ConnectionValidationPackageLine(
  acceptedMessage: string,
  resourceCount: number | null | undefined,
  packageId: string | null | undefined,
): string {
  const resourcePart =
    typeof resourceCount === "number" && Number.isFinite(resourceCount)
      ? `${resourceCount} resources`
      : "Resource count was not stored.";
  const packagePart =
    typeof packageId === "string" && packageId.trim().length > 0
      ? `Package ${packageId.trim()}`
      : "Architecture package identifier was not stored.";

  return `${acceptedMessage} ${packagePart} with ${resourcePart}.`;
}
