export type DocIndexEntry = {
  title: string;
  summary: string;
  category: string;
  url: string;
};

/** Loads the generated documentation index served from `/doc-index.json`. */
export async function fetchHelpDocsIndex(): Promise<DocIndexEntry[]> {
  const res = await fetch("/doc-index.json", { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data as DocIndexEntry[];
}
