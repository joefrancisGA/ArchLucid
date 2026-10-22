import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP_DIR_NAME = "app";

function omitFromUrl(segment: string): boolean {
  if (segment.startsWith("@")) {
    return true;
  }

  if (segment.startsWith("_")) {
    return true;
  }

  if (segment.length >= 2 && segment.startsWith("(") && segment.endsWith(")")) {
    return true;
  }

  return false;
}

export function urlPathnameForAppRouterPage(pageFilePath: string, appDirPath: string): string {
  const relParent = relative(appDirPath, join(pageFilePath, ".."));
  const parts: string[] = [];

  if (relParent !== "") {
    for (const segment of relParent.split(/[/\\]/)) {
      if (omitFromUrl(segment)) {
        continue;
      }

      parts.push(segment);
    }
  }

  if (parts.length === 0) {
    return "/";
  }

  return `/${parts.join("/")}`;
}

export function discoverAppRouterPathnames(appDirPath: string): string[] {
  const pathnames = new Set<string>();

  function walk(directoryPath: string): void {
    for (const entry of readdirSync(directoryPath)) {
      const absolutePath = join(directoryPath, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (entry !== "page.tsx") {
        continue;
      }

      pathnames.add(urlPathnameForAppRouterPage(absolutePath, appDirPath));
    }
  }

  walk(appDirPath);

  return [...pathnames].sort((left, right) => left.localeCompare(right));
}
