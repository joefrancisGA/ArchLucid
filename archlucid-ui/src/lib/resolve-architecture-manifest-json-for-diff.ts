import { getAuthorityRunManifest } from "@/lib/api";
import { tryStaticDemoGoldenManifestJsonForExport } from "@/lib/operator-static-demo";

export function formatArchitectureManifestJsonForDiff(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Loads manifest JSON for compare visualizations — HTTP first, then curated demo payloads when allowed. */
export async function resolveArchitectureManifestJsonForDiff(runId: string): Promise<unknown> {
  try {
    return await getAuthorityRunManifest(runId);
  } catch {
    const demo = tryStaticDemoGoldenManifestJsonForExport(runId.trim());

    if (demo !== null) {
      return demo;
    }

    throw new Error(
      `Could not load a manifest document for this review (${runId.trim()}). Confirm it exists, is in scope, and the manifest endpoint is available.`,
    );
  }
}
