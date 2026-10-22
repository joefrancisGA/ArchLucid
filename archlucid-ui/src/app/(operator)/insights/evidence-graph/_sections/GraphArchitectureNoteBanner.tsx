import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GraphArchitectureNoteBannerProps = {
  graphMainColumnMaxClass: string;
  architectureGraphNote: string;
};

export function GraphArchitectureNoteBanner(props: GraphArchitectureNoteBannerProps) {
  const { graphMainColumnMaxClass, architectureGraphNote } = props;

  return (
    <div
      className={cn(
        "mb-4 rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
        graphMainColumnMaxClass,
      )}
      role="status"
    >
      <strong>Large graph.</strong> {architectureGraphNote}
    </div>
  );
}
