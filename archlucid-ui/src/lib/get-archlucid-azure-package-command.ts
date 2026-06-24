export type GetArchLucidAzurePackageCommandOptions = {
  /** Azure subscription GUID; when empty, quick start uses the signed-in Azure context. */
  subscriptionId?: string | null;
  /**
   * When true (default), emit the one-line Run-ArchLucidAzureExtractor.ps1 quick start.
   * When false, emit the lower-level Get-ArchLucidAzurePackage.ps1 invocation for advanced scopes.
   */
  quickStart?: boolean;
  /** Override output ZIP path for the full (non-quick-start) command only. */
  outputPath?: string | null;
};

const QUICK_START_SCRIPT = ".\\scripts\\azure\\Run-ArchLucidAzureExtractor.ps1";
const FULL_SCRIPT = ".\\scripts\\azure\\Get-ArchLucidAzurePackage.ps1";
const DEFAULT_OUTPUT_PATH = ".\\archlucid-azure-package.zip";

/**
 * Build the documented read-only extractor invocation from repo root (`ArchLucid` clone).
 * Defaults to the quick-start wrapper so operators can copy one line, sign in to Azure, and
 * collect ./archlucid-azure-package.zip without filling subscription or path placeholders.
 */
export function buildGetArchLucidAzurePackageCommandLine(
  options?: GetArchLucidAzurePackageCommandOptions,
): string {
  const quickStart = options?.quickStart !== false;
  const trimmedSubscriptionId = options?.subscriptionId?.trim() ?? "";

  if (quickStart) {
    const base = `pwsh -NoProfile -ExecutionPolicy Bypass -File ${QUICK_START_SCRIPT}`;

    if (trimmedSubscriptionId.length > 0) {
      return `${base} -SubscriptionId '${trimmedSubscriptionId}'`;
    }

    return base;
  }

  const subscriptionToken =
    trimmedSubscriptionId.length > 0 ? trimmedSubscriptionId : "<your-subscription-id>";
  const outputToken = options?.outputPath?.trim() || DEFAULT_OUTPUT_PATH;

  return (
    `pwsh -NoProfile -ExecutionPolicy Bypass -File ${FULL_SCRIPT} ` +
    `-SubscriptionId '${subscriptionToken}' -OutputPath '${outputToken}' -IncludeCost`
  );
}

/** Full Get-ArchLucidAzurePackage.ps1 command for advanced scopes (resource group, dry run, etc.). */
export function buildAdvancedGetArchLucidAzurePackageCommandLine(
  options?: Omit<GetArchLucidAzurePackageCommandOptions, "quickStart">,
): string {
  return buildGetArchLucidAzurePackageCommandLine({ ...options, quickStart: false });
}
