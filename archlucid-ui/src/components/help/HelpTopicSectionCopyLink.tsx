"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { HELP_PAGE_TOC } from "@/lib/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type HelpTopicSectionCopyLinkProps = {
  readonly sectionId: string;
  readonly sectionTitle: string;
};

type CopyState = "idle" | "copied" | "failed";

/** Copies a stable deep link for a help reference section anchor. */
export function HelpTopicSectionCopyLink(props: HelpTopicSectionCopyLinkProps): React.JSX.Element {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined") {
      return;
    }

    const deepLink = `${window.location.origin}${window.location.pathname}${window.location.search}#${props.sectionId}`;

    try {
      await navigator.clipboard.writeText(deepLink);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, [props.sectionId]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  const label =
    copyState === "copied"
      ? `Copied link to ${props.sectionTitle}`
      : copyState === "failed"
        ? `Copy link to ${props.sectionTitle} failed`
        : `Copy link to ${props.sectionTitle}`;

  return (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-sm px-1.5 py-0.5 text-xs text-al-text-secondary underline-offset-2 hover:text-teal-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:hover:text-teal-300",
        OPERATOR_TYPOGRAPHY.label,
      )}
      aria-label={label}
      data-testid={`help-section-copy-link-${props.sectionId}`}
      onClick={() => {
        void handleCopy();
      }}
    >
      {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy link"}
    </button>
  );
}
