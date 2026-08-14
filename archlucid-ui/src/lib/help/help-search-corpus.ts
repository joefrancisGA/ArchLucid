/** TB-2237 — customer-facing shell search vs internal engineering corpus. */
export type HelpSearchCorpus = "customer" | "internal";

export type HelpDocumentationSearchOptions = {
  /** When false (default), engineering runbook sections are excluded from shell search. */
  readonly includeDeveloperDocs?: boolean;
};

export function resolveHelpSearchCorpus(options?: HelpDocumentationSearchOptions): HelpSearchCorpus {
  if (options?.includeDeveloperDocs === true) {
    return "internal";
  }

  return "customer";
}

/** Repo-relative runbook paths never ship in the customer search bundle. */
export function isRunbookHelpDocPath(docPath: string): boolean {
  return docPath.replace(/^\//, "").trim().toLowerCase().startsWith("docs/runbooks/");
}
