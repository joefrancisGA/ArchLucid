import { getAuthorityRunManifest } from "@/lib/api";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { tryStaticDemoGoldenManifestJsonForExport } from "@/lib/operator/operator-static-demo";

export function formatArchitectureManifestJsonForDiff(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Loads manifest JSON for compare visualizations — HTTP first, then curated demo payloads when allowed. */
export async function resolveArchitectureManifestJsonForDiff(runId: string): Promise<unknown> {
  try {
    return await getAuthorityRunManifest(runId);
  } catch (error: unknown) {
    const demo = tryStaticDemoGoldenManifestJsonForExport(runId.trim());

    if (demo !== null) {
      return demo;
    }

    throw new Error(formatExportSealedManifestAwareApiError(error));
  }
}
