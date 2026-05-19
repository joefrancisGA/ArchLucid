export type GetArchLucidAzurePackageCommandOptions = {
  /** Azure subscription GUID; when empty, a replace-me placeholder is emitted. */
  subscriptionId?: string | null;
};

/**
 * Build the documented read-only extractor invocation from repo root (`ArchLucid` clone).
 * `-IncludeCost` is always present so ROI-oriented packages match operator guidance.
 */
export function buildGetArchLucidAzurePackageCommandLine(
  options?: GetArchLucidAzurePackageCommandOptions,
): string {
  const script = ".\\scripts\\azure\\Get-ArchLucidAzurePackage.ps1";
  const trimmedSubscriptionId = options?.subscriptionId?.trim() ?? "";
  const subscriptionToken =
    trimmedSubscriptionId.length > 0 ? trimmedSubscriptionId : "<your-subscription-id>";

  return (
    `pwsh -NoProfile -ExecutionPolicy Bypass -File ${script} ` +
    `-SubscriptionId '${subscriptionToken}' -OutputPath '<path-to-archlucid-azure-package.zip>' -IncludeCost`
  );
}
