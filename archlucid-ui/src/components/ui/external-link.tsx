import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export type ExternalLinkProps = ComponentPropsWithoutRef<"a">;

/**
 * External anchor with enforced `target="_blank"` and `rel="noopener noreferrer"`.
 */
export function ExternalLink({ className, rel, target, ...props }: ExternalLinkProps) {
  const mergedRel =
    rel != null && rel.trim().length > 0 && rel.includes("noopener")
      ? rel
      : "noopener noreferrer";

  return (
    <a
      {...props}
      target={target ?? "_blank"}
      rel={mergedRel}
      className={cn(className)}
    />
  );
}
