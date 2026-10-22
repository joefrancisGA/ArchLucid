/** Meta tag name embedded in every HTML document for post-deploy shell identity checks (TB-868). */
export const BUILD_IDENTITY_HTML_META_NAME = "archlucid:build-commit" as const;

const BUILD_IDENTITY_META_PATTERN =
  /<meta\s+[^>]*(?:name=["']archlucid:build-commit["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*name=["']archlucid:build-commit["'])[^>]*>/i;

/** Build-time commit SHA for the root layout meta tag (empty when unset locally). */
export function readBuildIdentityHtmlMetaContent(): string {
  return normalizeBuildIdentityValue(process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA);
}

/** Parse the TB-868 build-identity meta tag from rendered HTML (CD smoke + tests). */
export function extractBuildIdentityFromHtml(html: string): string | null {
  const match = BUILD_IDENTITY_META_PATTERN.exec(html);

  if (match === null) {
    return null;
  }

  const value = (match[1] ?? match[2] ?? "").trim();

  if (value.length === 0) {
    return null;
  }

  return value;
}

function normalizeBuildIdentityValue(value: string | undefined): string {
  return value?.trim() ?? "";
}
