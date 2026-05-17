import { z } from "zod";

/**
 * `manifest.json` inside the ZIP from `scripts/azure/Get-ArchLucidAzurePackage.ps1`
 * (PowerShell `ConvertTo-Json` uses lowercase property names).
 */
export const archLucidAzurePackageManifestSchema = z.object({
  schemaVersion: z.number().int().nonnegative(),
  scriptVersion: z.string().min(1),
  collectionTimestamp: z.string().min(1),
  subscriptionId: z.string().min(1),
  scope: z.string().min(1),
  switchesUsed: z.array(z.string()).optional(),
  azModuleVersion: z.string().optional(),
});

export type ArchLucidAzurePackageManifest = z.infer<typeof archLucidAzurePackageManifestSchema>;
