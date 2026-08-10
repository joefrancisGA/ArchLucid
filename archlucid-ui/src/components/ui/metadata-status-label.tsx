import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type MetadataStatusLabelProps = {
  readonly className?: string;
  readonly children: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/** Semantic `span` wrapper for status/severity metadata (not a button or link). */
export function MetadataStatusLabel({
  className,
  children,
  ...rest
}: MetadataStatusLabelProps): React.ReactElement {
  return (
    <span className={cn(className)} {...rest}>
      {children}
    </span>
  );
}
