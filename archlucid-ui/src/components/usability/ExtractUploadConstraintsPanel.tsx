import { extractorUploadConstraints } from "@/lib/usability/extractor-upload-constraints";

/** Up-front upload constraints for the Azure extractor settings page. */
export function ExtractUploadConstraintsPanel() {
  const constraints = extractorUploadConstraints();

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="extract-upload-constraints"
    >
      <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50">Before you upload</h3>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {constraints.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {row.label}
            </dt>
            <dd className="m-0 mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
