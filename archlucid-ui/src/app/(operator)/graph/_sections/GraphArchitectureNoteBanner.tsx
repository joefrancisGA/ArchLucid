import { cn } from "@/lib/utils";

export type GraphArchitectureNoteBannerProps = {
  graphMainColumnMaxClass: string;
  architectureGraphNote: string;
};

export function GraphArchitectureNoteBanner(props: GraphArchitectureNoteBannerProps) {
  const { graphMainColumnMaxClass, architectureGraphNote } = props;

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 mb-4 px-4 py-3 text-sm",
        graphMainColumnMaxClass,
      )}
      role="status"
    >
      <strong>Large graph.</strong> {architectureGraphNote}
    </div>
  );
}
