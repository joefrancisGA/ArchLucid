/** Finds a ZIP entry by file name (case-insensitive), including nested paths. */
export function findZipEntryName(entries: Record<string, Uint8Array>, fileName: string): string | null {
  const target = fileName.toLowerCase();

  for (const key of Object.keys(entries)) {
    const normalized = key.replace(/\\/g, "/");
    const base = normalized.split("/").pop() ?? "";

    if (base.toLowerCase() === target) {
      return key;
    }
  }

  return null;
}
