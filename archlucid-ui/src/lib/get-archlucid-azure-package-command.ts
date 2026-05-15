/**
 * Build the documented read-only extractor invocation from repo root (`ArchLucid` clone).
 * `-IncludeCost` is always present so ROI-oriented packages match operator guidance.
 */
export function buildGetArchLucidAzurePackageCommandLine(): string {
  const script = ".\\scripts\\azure\\Get-ArchLucidAzurePackage.ps1";

  return (
    `pwsh -NoProfile -ExecutionPolicy Bypass -File ${script} ` +
    `-SubscriptionId '<your-subscription-id>' -OutputPath '<path-to-archlucid-azure-package.zip>' -IncludeCost`
  );
}
