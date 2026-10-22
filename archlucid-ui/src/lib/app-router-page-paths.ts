import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

function omitFromUrlSegment(segment: string): boolean {
  if (segment.startsWith("@") || segment.startsWith("_")) {
    return true;
  }

  if (segment.length >= 2 && segment.startsWith("(") && segment.endsWith(")")) {
    return true;
  }

  return false;
}

/** Mirrors `scripts/ci/assert_archlucid_ui_app_router_unique_paths.py` URL resolution. */
export function urlPathForAppRouterPage(pageFile: string, appDir: string): string {
  const relParent = relative(appDir, join(pageFile, ".."));
  const parts = relParent
    .split(/[/\\]/u)
    .filter((segment) => segment.length > 0 && !omitFromUrlSegment(segment));

  if (parts.length === 0) {
    return "/";
  }

  return `/${parts.join("/")}`;
}

function collectPageFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...collectPageFiles(absolutePath));
      continue;
    }

    if (entry === "page.tsx") {
      files.push(absolutePath);
    }
  }

  return files;
}

/** Sorted unique App Router URL paths for every `page.tsx` under `appDir`. */
export function enumerateAppRouterPagePaths(appDir: string): readonly string[] {
  const pageFiles = collectPageFiles(appDir);
  const paths = new Set<string>();

  for (const pageFile of pageFiles) {
    paths.add(urlPathForAppRouterPage(pageFile, appDir));
  }

  return [...paths].sort();
}
