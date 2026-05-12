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
        "mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
        graphMainColumnMaxClass,
      )}
      role="status"
    >
      <strong>Large graph.</strong> {architectureGraphNote}
    </div>
  );
}
