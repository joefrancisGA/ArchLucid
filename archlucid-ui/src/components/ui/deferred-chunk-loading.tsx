import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Canonical pulse surface for `next/dynamic` deferred chunk placeholders (TB-2391). */
export const DEFERRED_CHUNK_LOADING_SURFACE_CLASS =
  "animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800";

export type DeferredChunkLoadingVariant = "section" | "compact" | "panel" | "context" | "marketing";

const DEFERRED_CHUNK_LOADING_VARIANT_CLASS: Readonly<Record<DeferredChunkLoadingVariant, string>> = {
  section: "min-h-24",
  compact: "min-h-16",
  panel: "h-32",
  context: "min-h-12",
  marketing: "min-h-32",
};

export type DeferredChunkLoadingProps = {
  readonly label: string;
  readonly variant?: DeferredChunkLoadingVariant;
  readonly testId?: string;
  readonly className?: string;
};

/** Accessible loading placeholder while a deferred client chunk hydrates. */
export function DeferredChunkLoading(props: DeferredChunkLoadingProps): React.JSX.Element {
  const variant = props.variant ?? "section";

  return (
    <div
      className={cn(
        DEFERRED_CHUNK_LOADING_SURFACE_CLASS,
        DEFERRED_CHUNK_LOADING_VARIANT_CLASS[variant],
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
      role="status"
      aria-label={props.label}
      data-testid={props.testId ?? "deferred-chunk-loading"}
    />
  );
}
