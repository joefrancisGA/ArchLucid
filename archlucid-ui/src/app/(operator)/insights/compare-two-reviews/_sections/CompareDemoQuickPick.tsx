import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareDemoQuickPickProps = {
  onPickClaimsIntake: () => void;
};

export function CompareDemoQuickPick(props: CompareDemoQuickPickProps) {
  const { onPickClaimsIntake } = props;

  return (
    <>
      <p className={cn("mb-4 mt-4 max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <strong>Demo — Claims Intake comparison:</strong> pick a baseline and target in one tap, then click{" "}
        <strong>Compare</strong>. You can still change reviews from the lists below.
      </p>
      <div className="mb-4 grid max-w-3xl gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised p-4 text-left shadow-sm transition hover:border-neutral-400 hover:bg-[var(--al-layer-hover)] dark:border-neutral-800 dark:hover:border-neutral-600",
            OPERATOR_TYPOGRAPHY.body,
          )}
          onClick={onPickClaimsIntake}
        >
          <span className={cn("block font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Baseline: Current Claims Intake
          </span>
          <span className={cn("mt-1 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Represents the as-is flow before hardening PHI boundaries.
          </span>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised p-4 text-left shadow-sm transition hover:border-neutral-400 hover:bg-[var(--al-layer-hover)] dark:border-neutral-800 dark:hover:border-neutral-600",
            OPERATOR_TYPOGRAPHY.body,
          )}
          onClick={onPickClaimsIntake}
        >
          <span className={cn("block font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Updated: Hardened PHI flow
          </span>
          <span className={cn("mt-1 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Pair with baseline for sponsor-ready before/after narrative.
          </span>
        </button>
      </div>
    </>
  );
}
