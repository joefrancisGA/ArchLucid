import type { Metadata } from "next";

import { HelpDocsClient } from "./HelpDocsClient";

export const metadata: Metadata = {
  title: "Help",
};

/** Searchable index of curated documentation links (GitHub). */
export default function HelpPage() {
  return (
    <main className="space-y-4">
      <div>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Help</h1>
        <p className="mt-2 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Search a curated map of repository documentation. Links open in a new tab on GitHub.
        </p>
      </div>
      <HelpDocsClient />
    </main>
  );
}
