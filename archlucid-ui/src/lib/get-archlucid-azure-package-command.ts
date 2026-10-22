import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type GetArchLucidAzurePackageCommandOptions = {
  /** Entra tenant GUID; when supplied, quick start signs in to that tenant deterministically. */
  tenantId?: string | null;
  /** Azure subscription GUID; when empty, quick start uses the signed-in Azure context. */
  subscriptionId?: string | null;
  /**
   * When true (default), emit the one-line Run-*AzureExtractor.ps1 quick start.
   * When false, emit the lower-level Get-*AzurePackage.ps1 invocation for advanced scopes.
   */
  quickStart?: boolean;
  /** Override output ZIP path for the full (non-quick-start) command only. */
  outputPath?: string | null;
  /** Active product line — SecureNow uses consumer-branded script and ZIP names. */
  productLineId?: ProductLineId;
};

const ARCHLUCID_QUICK_START_SCRIPT = ".\\scripts\\azure\\Run-ArchLucidAzureExtractor.ps1";
const ARCHLUCID_FULL_SCRIPT = ".\\scripts\\azure\\Get-ArchLucidAzurePackage.ps1";
const ARCHLUCID_DEFAULT_OUTPUT_PATH = ".\\archlucid-azure-package.zip";

const SECURENOW_QUICK_START_SCRIPT = ".\\scripts\\azure\\Run-SecureNowAzureExtractor.ps1";
const SECURENOW_FULL_SCRIPT = ".\\scripts\\azure\\Get-SecureNowAzurePackage.ps1";
const SECURENOW_DEFAULT_OUTPUT_PATH = ".\\securenow-azure-package.zip";

function resolveAzureExtractorScripts(productLineId: ProductLineId = "architecture"): {
  quickStartScript: string;
  fullScript: string;
  defaultOutputPath: string;
} {
  if (productLineId === "security") {
    return {
      quickStartScript: SECURENOW_QUICK_START_SCRIPT,
      fullScript: SECURENOW_FULL_SCRIPT,
      defaultOutputPath: SECURENOW_DEFAULT_OUTPUT_PATH,
    };
  }

  return {
    quickStartScript: ARCHLUCID_QUICK_START_SCRIPT,
    fullScript: ARCHLUCID_FULL_SCRIPT,
    defaultOutputPath: ARCHLUCID_DEFAULT_OUTPUT_PATH,
  };
}

/**
 * Build the documented read-only extractor invocation from repo root (`ArchLucid` clone).
 * Defaults to the quick-start wrapper so operators can copy one line, sign in to Azure, and
 * collect the default output ZIP without filling subscription or path placeholders.
 */
export function buildGetArchLucidAzurePackageCommandLine(
  options?: GetArchLucidAzurePackageCommandOptions,
): string {
  const quickStart = options?.quickStart !== false;
  const trimmedTenantId = options?.tenantId?.trim() ?? "";
  const trimmedSubscriptionId = options?.subscriptionId?.trim() ?? "";
  const scripts = resolveAzureExtractorScripts(options?.productLineId);

  if (quickStart) {
    const base = `pwsh -NoProfile -ExecutionPolicy Bypass -File ${scripts.quickStartScript}`;
    const args: string[] = [];

    if (trimmedTenantId.length > 0) {
      args.push(`-TenantId '${trimmedTenantId}'`);
    }

    if (trimmedSubscriptionId.length > 0) {
      args.push(`-SubscriptionId '${trimmedSubscriptionId}'`);
    }

    if (args.length > 0) {
      return `${base} ${args.join(" ")}`;
    }

    return base;
  }

  const tenantToken = trimmedTenantId.length > 0 ? trimmedTenantId : "";
  const subscriptionToken =
    trimmedSubscriptionId.length > 0 ? trimmedSubscriptionId : "<your-subscription-id>";
  const outputToken = options?.outputPath?.trim() || scripts.defaultOutputPath;
  const tenantArg =
    tenantToken.length > 0 ? ` -TenantId '${tenantToken}'` : "";

  return (
    `pwsh -NoProfile -ExecutionPolicy Bypass -File ${scripts.fullScript}` +
    `${tenantArg} -SubscriptionId '${subscriptionToken}' -OutputPath '${outputToken}' -IncludeCost`
  );
}

/** Full Get-*AzurePackage.ps1 command for advanced scopes (resource group, dry run, etc.). */
export function buildAdvancedGetArchLucidAzurePackageCommandLine(
  options?: Omit<GetArchLucidAzurePackageCommandOptions, "quickStart">,
): string {
  return buildGetArchLucidAzurePackageCommandLine({ ...options, quickStart: false });
}
