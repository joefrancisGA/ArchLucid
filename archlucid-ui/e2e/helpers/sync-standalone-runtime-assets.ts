/**
 * Copy Next standalone runtime assets so Playwright `node server.js` from
 * `.next/standalone` can SSR marketing markdown and in-app help.
 */
import fs from "node:fs";
import path from "node:path";

export function syncStandaloneRuntimeAssets(projectRoot: string): string {
  const standaloneRoot = path.join(projectRoot, ".next", "standalone");
  const serverJs = path.join(standaloneRoot, "server.js");

  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `Missing ${serverJs}. Run "npm run build" first (next.config uses output: "standalone").`,
    );
  }

  const staticSrc = path.join(projectRoot, ".next", "static");
  const staticDest = path.join(standaloneRoot, ".next", "static");

  if (!fs.existsSync(staticSrc)) {
    throw new Error(`Missing ${staticSrc} after build; client assets are required for e2e.`);
  }

  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });

  const publicSrc = path.join(projectRoot, "public");
  const publicDest = path.join(standaloneRoot, "public");

  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  } else {
    fs.mkdirSync(publicDest, { recursive: true });
  }

  /**
   * Trust, privacy, accessibility, and synthetic ROI bulletin SSR read
   * `go-to-market-samples/*.md` when `cwd` is `.next/standalone`. Copy from monorepo `docs/`.
   */
  const gtmDest = path.join(standaloneRoot, "go-to-market-samples");
  fs.mkdirSync(gtmDest, { recursive: true });
  const monorepoDocs = path.join(projectRoot, "..", "docs");
  const privacySrc = path.join(monorepoDocs, "go-to-market", "PRIVACY_POLICY.md");
  const trustSrc = path.join(monorepoDocs, "go-to-market", "trust-center.md");
  const bulletinSrc = path.join(monorepoDocs, "go-to-market", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");
  const accessibilitySrc = path.join(projectRoot, "..", "ACCESSIBILITY.md");

  if (fs.existsSync(privacySrc)) {
    fs.copyFileSync(privacySrc, path.join(gtmDest, "PRIVACY_POLICY.md"));
  }

  if (fs.existsSync(trustSrc)) {
    fs.copyFileSync(trustSrc, path.join(gtmDest, "trust-center.md"));
  }

  if (fs.existsSync(bulletinSrc)) {
    fs.copyFileSync(bulletinSrc, path.join(gtmDest, "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md"));
  }

  if (fs.existsSync(accessibilitySrc)) {
    fs.copyFileSync(accessibilitySrc, path.join(gtmDest, "ACCESSIBILITY.md"));
  }

  /**
   * In-app `/help/*` loads markdown from `docs/library/**` via `load-product-documentation.ts`
   * when `process.cwd()` is `.next/standalone` (see `resolveMonorepoRootFromUiCwd`).
   */
  const docsLibrarySrc = path.join(monorepoDocs, "library");
  const docsLibraryDest = path.join(standaloneRoot, "docs", "library");

  if (fs.existsSync(docsLibrarySrc)) {
    fs.mkdirSync(path.dirname(docsLibraryDest), { recursive: true });
    fs.cpSync(docsLibrarySrc, docsLibraryDest, { recursive: true });
  }

  return standaloneRoot;
}
