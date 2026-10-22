"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

type PrivacyPolicySectionCopyLinkProps = {
  readonly sectionId: string;
  readonly sectionTitle: string;
};

type CopyState = "idle" | "copied" | "failed";

/** Copies a stable deep link for a privacy policy section anchor. */
export function PrivacyPolicySectionCopyLink(props: PrivacyPolicySectionCopyLinkProps): React.JSX.Element {
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
        "shrink-0 rounded-sm px-1.5 py-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
        MARKETING_SURFACES.inlineLink,
        MARKETING_TYPOGRAPHY.meta,
      )}
      aria-label={label}
      data-testid={`privacy-section-copy-link-${props.sectionId}`}
      onClick={() => {
        void handleCopy();
      }}
    >
      {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy link"}
    </button>
  );
}
