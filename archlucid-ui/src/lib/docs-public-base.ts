/**
 * Default public GitHub blob base for the repository default branch when optional docs env vars are unset.
 * Override with NEXT_PUBLIC_DOCS_BASE_URL (HelpPanel) or NEXT_PUBLIC_ARCHLUCID_DOCS_BLOB_BASE (ContextualHelp).
 */
const DEFAULT_DOCS_GITHUB_ORG = "joefrancisGA";
const DEFAULT_DOCS_GITHUB_REPO = "ArchLucid";
/** Must match the GitHub default branch (`git branch --show-current`); `main` 404s for this repo. */
const DEFAULT_DOCS_GITHUB_BRANCH = "master";

export const DEFAULT_GITHUB_BLOB_BASE = `https://github.com/${DEFAULT_DOCS_GITHUB_ORG}/${DEFAULT_DOCS_GITHUB_REPO}/blob/${DEFAULT_DOCS_GITHUB_BRANCH}`;

/** GitHub blob URL for a repo-relative markdown path (developer/source footer only). */
export function buildGithubBlobHref(repoRelativePath: string): string {
  const normalized = repoRelativePath.replace(/^\//, "").trim();

  if (normalized.length === 0) {
    return DEFAULT_GITHUB_BLOB_BASE;
  }

  return `${DEFAULT_GITHUB_BLOB_BASE}/${normalized}`;
}
