import { getAuthorityRunManifest } from "@/lib/api/architecture-runs";

export function manifestJsonDownloadFileName(runId: string): string {
  const safe = runId.trim().replace(/[^\w.-]+/g, "-");

  return `${safe.length > 0 ? safe : "review"}-manifest.json`;
}

/** Fetches and pretty-prints the committed golden manifest JSON for a review. */
export async function fetchManifestJsonText(runId: string): Promise<string> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    throw new Error("Review id is missing — refresh the page and try again.");
  }

  const manifestJson = await getAuthorityRunManifest(trimmedRunId);

  return JSON.stringify(manifestJson, null, 2);
}
