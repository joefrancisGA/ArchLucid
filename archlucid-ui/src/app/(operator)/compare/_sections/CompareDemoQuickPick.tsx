export type CompareDemoQuickPickProps = {
  onPickClaimsIntake: () => void;
};

export function CompareDemoQuickPick(props: CompareDemoQuickPickProps) {
  const { onPickClaimsIntake } = props;

  return (
    <>
      <p className="mb-4 mt-4 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        <strong>Demo — Claims Intake comparison:</strong> pick a baseline and target in one tap, then click{" "}
        <strong>Compare</strong>. You can still change reviews from the lists below.
      </p>
      <div className="mb-4 grid max-w-3xl gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-left text-sm shadow-sm transition hover:border-teal-400 hover:bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40 dark:hover:border-teal-700"
          onClick={onPickClaimsIntake}
        >
          <span className="block font-semibold text-neutral-900 dark:text-neutral-100">
            Baseline: Current Claims Intake
          </span>
          <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
            Represents the as-is flow before hardening PHI boundaries.
          </span>
        </button>
        <button
          type="button"
          className="rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-left text-sm shadow-sm transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40 dark:hover:border-violet-700"
          onClick={onPickClaimsIntake}
        >
          <span className="block font-semibold text-neutral-900 dark:text-neutral-100">Updated: Hardened PHI flow</span>
          <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
            Pair with baseline for sponsor-ready before/after narrative.
          </span>
        </button>
      </div>
    </>
  );
}
