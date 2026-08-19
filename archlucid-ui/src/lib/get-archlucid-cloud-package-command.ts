import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import {
  buildGetArchLucidAzurePackageCommandLine,
  type GetArchLucidAzurePackageCommandOptions,
} from "@/lib/get-archlucid-azure-package-command";

export type GetArchLucidCloudPackageCommandOptions = GetArchLucidAzurePackageCommandOptions & {
  platform: CloudInventoryPlatform;
  /** AWS account id or GCP project id when pinning scope; Azure uses subscriptionId. */
  scopeId?: string | null;
};

const AWS_SCRIPT = ".\\scripts\\Get-ArchLucidAwsPackage.ps1";
const GCP_SCRIPT = ".\\scripts\\Get-ArchLucidGcpPackage.ps1";
const AWS_DEFAULT_OUTPUT = ".\\archlucid-aws-package.zip";
const GCP_DEFAULT_OUTPUT = ".\\archlucid-gcp-package.zip";

/**
 * Platform-specific read-only inventory ZIP command from repo root (`ArchLucid` clone).
 */
export function buildGetArchLucidCloudPackageCommandLine(
  options: GetArchLucidCloudPackageCommandOptions,
): string {
  const platform = options.platform;

  if (platform === "azure") {
    return buildGetArchLucidAzurePackageCommandLine({
      subscriptionId: options.scopeId ?? options.subscriptionId,
      quickStart: options.quickStart,
      outputPath: options.outputPath,
    });
  }

  const outputToken = options.outputPath?.trim()
    || (platform === "aws" ? AWS_DEFAULT_OUTPUT : GCP_DEFAULT_OUTPUT);
  const scopeToken = options.scopeId?.trim() ?? "";

  if (platform === "aws") {
    const base =
      `pwsh -NoProfile -ExecutionPolicy Bypass -File ${AWS_SCRIPT} -OutputPath '${outputToken}'`;

    if (scopeToken.length > 0) {
      return `${base} -AccountId '${scopeToken}'`;
    }

    return base;
  }

  const base =
    `pwsh -NoProfile -ExecutionPolicy Bypass -File ${GCP_SCRIPT} -OutputPath '${outputToken}'`;

  if (scopeToken.length > 0) {
    return `${base} -ProjectId '${scopeToken}'`;
  }

  return base;
}

export function buildTier1InventoryExtractorCommandLines(): readonly string[] {
  return [
    buildGetArchLucidCloudPackageCommandLine({ platform: "azure" }),
    buildGetArchLucidCloudPackageCommandLine({ platform: "aws" }),
    buildGetArchLucidCloudPackageCommandLine({ platform: "gcp" }),
  ];
}
