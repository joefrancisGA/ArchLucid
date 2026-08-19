export function defaultSupportBundleFilename(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:T-]/g, "").slice(0, 15) + "Z";

  return `archlucid-support-bundle-${stamp}.zip`;
}
