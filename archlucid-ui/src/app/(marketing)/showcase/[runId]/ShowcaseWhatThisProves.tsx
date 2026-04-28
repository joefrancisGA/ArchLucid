import type { ReactElement } from "react";

/** Outcome bullets derived from curated demo payloads or marketing API preview (same domain language). */
export function ShowcaseWhatThisProves({ bullets }: { readonly bullets: readonly string[] }): ReactElement | null {
  const trimmed = bullets.filter((s) => s.trim().length > 0);

  if (trimmed.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="showcase-what-this-proves-heading"
      className="rounded-lg border border-teal-200/80 bg-teal-50/60 p-4 shadow-sm dark:border-teal-900/40 dark:bg-teal-950/40"
      data-testid="showcase-what-this-proves"
    >
      <h2 id="showcase-what-this-proves-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50">
        What this demonstrates
      </h2>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-neutral-700 dark:text-neutral-200">
        {trimmed.map((line, index) => (
          <li key={`driver-${index}`}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
