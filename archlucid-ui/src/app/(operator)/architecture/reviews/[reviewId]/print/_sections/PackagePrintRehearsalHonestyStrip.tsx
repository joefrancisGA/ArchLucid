import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PackagePrintRehearsalHonestyStrip } from "@/lib/package-print-rehearsal-honesty";
import { cn } from "@/lib/utils";

type PackagePrintRehearsalHonestyStripProps = {
  readonly strip: PackagePrintRehearsalHonestyStrip;
};

/** CG-023 — print-only rehearsal honesty from execute door stamp (Ctrl+P / Save as PDF). */
export function PackagePrintRehearsalHonestyStripView(
  props: PackagePrintRehearsalHonestyStripProps,
): React.JSX.Element {
  const { strip } = props;

  return (
    <aside
      role="note"
      aria-label={strip.title}
      data-testid="package-print-rehearsal-honesty-strip"
      className={cn(
        "package-print-rehearsal-honesty-strip m-0 hidden rounded-md border border-amber-600/50 bg-amber-50 px-3 py-2 text-amber-950 print:block dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-100",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <p className="m-0 font-semibold" data-testid="package-print-rehearsal-honesty-title">
        {strip.title}
      </p>
      <p className={cn("m-0 mt-1 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)} data-testid="package-print-rehearsal-honesty-body">
        {strip.body}
      </p>
      <p className={cn("m-0 mt-2 font-medium", OPERATOR_TYPOGRAPHY.helper)} data-testid="package-print-rehearsal-mode-notice-title">
        {strip.modeNoticeTitle}
      </p>
      <p className={cn("m-0 mt-1 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)} data-testid="package-print-rehearsal-mode-notice-body">
        {strip.modeNoticeBody}
      </p>
    </aside>
  );
}
