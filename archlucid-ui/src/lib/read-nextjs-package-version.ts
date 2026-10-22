/** Client-safe Next.js framework version baked at build/dev startup from the installed `next` package. */
export function readNextJsPackageVersion(): string {
  const value = process.env.NEXT_PUBLIC_NEXTJS_PACKAGE_VERSION?.trim() ?? "";
  return value.length > 0 ? value : "unknown";
}

/** Exact semver pin from `archlucid-ui/package.json` (may differ when node_modules is stale). */
export function readNextJsPinnedVersion(): string {
  const value = process.env.NEXT_PUBLIC_NEXTJS_PINNED_VERSION?.trim() ?? "";
  return value.length > 0 ? value : "unknown";
}

export function nextJsPinMatchesInstalledPackage(): boolean {
  const installed = readNextJsPackageVersion();
  const pinned = readNextJsPinnedVersion();
  if (installed === "unknown" || pinned === "unknown") {
    return true;
  }
  return installed === pinned;
}
