import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute roots for tests that read source files off disk.
 *
 * Tests used to reach these by counting `".."` segments from their own location, which broke
 * silently whenever a file moved into a subfolder — the walk landed one level short and the
 * subsequent read failed with ENOENT. Resolving from the `archlucid-ui` path segment instead
 * makes the roots independent of how deeply the caller is nested.
 */

const UI_DIRECTORY_NAME = "archlucid-ui";

function resolveUiRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const segments = here.split(sep);
  const index = segments.lastIndexOf(UI_DIRECTORY_NAME);

  if (index < 0) {
    throw new Error(`Cannot locate "${UI_DIRECTORY_NAME}" in path: ${here}`);
  }

  return segments.slice(0, index + 1).join(sep);
}

/** `…/archlucid-ui` — the Next.js app root. */
export const UI_ROOT = resolveUiRoot();

/** Repository root — the parent of `archlucid-ui`. */
export const REPO_ROOT = dirname(UI_ROOT);

/** `…/archlucid-ui/src`. */
export const SRC_ROOT = join(UI_ROOT, "src");

/** `…/archlucid-ui/src/app`. */
export const APP_ROOT = join(SRC_ROOT, "app");
