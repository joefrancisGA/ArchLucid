"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";

import Link from "next/link";
import { CircleHelp } from "lucide-react";

import { helpTooltipIconClassName, helpTooltipLinkClassName } from "@/components/ui/help-tooltip-trigger";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type InAppHelpLinkProps = {
  /** Registry slug such as `troubleshooting` or `pilot-guide`. */
  helpSlug: string;
  label: string;
  className?: string;
  /** When true, render as text link instead of icon-only control (preferred on operator Home). */
  variant?: "icon" | "text";
  /** Optional hash fragment without leading `#` (e.g. `first-session-checklist`). */
  hashFragment?: string;
};

/** Opens canonical in-app help (`/help/{slug}`). Use `variant="text"` on operator Home; reserve icon help for sparse section-level use outside Home. */
export function InAppHelpLink(props: InAppHelpLinkProps) {
  const href = inAppHelpHref(props.helpSlug, props.hashFragment);

  if (props.variant === "text") {
    return (
      <Link
        href={href}
        className={cn(OPERATOR_BODY_INLINE_LINK_CLASS, props.className)}
      >
        {props.label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={helpTooltipLinkClassName("contextual", props.className)}
      aria-label={props.label}
      title={props.label}
      data-help-tooltip-trigger=""
      data-help-tooltip-icon="help"
    >
      <CircleHelp className={helpTooltipIconClassName("contextual")} aria-hidden />
    </Link>
  );
}
