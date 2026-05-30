"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

export type InAppHelpLinkProps = {
  /** Registry slug such as `troubleshooting` or `pilot-guide`. */
  helpSlug: string;
  label: string;
  className?: string;
  /** When true, render as text link instead of icon-only control. */
  variant?: "icon" | "text";
  /** Optional hash fragment without leading `#` (e.g. `first-session-checklist`). */
  hashFragment?: string;
};

/** Opens canonical in-app help (`/help/{slug}`) — preferred over GitHub blob links in primary UI. */
export function InAppHelpLink(props: InAppHelpLinkProps) {
  const href = inAppHelpHref(props.helpSlug, props.hashFragment);

  if (props.variant === "text") {
    return (
      <Link
        href={href}
        className={cn(
          "text-sm font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300",
          props.className,
        )}
      >
        {props.label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-400 bg-white text-neutral-700 shadow-sm hover:border-teal-600 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-teal-500 dark:hover:text-teal-200",
        props.className,
      )}
      aria-label={props.label}
      title={props.label}
    >
      <CircleHelp className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}
