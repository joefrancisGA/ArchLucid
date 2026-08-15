"use client";

import type { JSX } from "react";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import {
  buildAskVsFrontierAiDifferentiation,
  type AskVsFrontierAiDifferentiation,
} from "@/lib/ask-vs-frontier-ai-differentiation";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AskVsFrontierAiDifferentiationStripProps = {
  /** Full hub strip vs one-line finding-inline cue. */
  readonly variant?: "full" | "compact";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAskVsFrontierAiDifferentiation}. */
  readonly copy?: AskVsFrontierAiDifferentiation;
};

function DifferentiationColumn(props: {
  readonly headingId: string;
  readonly heading: string;
  readonly bullets: readonly string[];
}): JSX.Element {
  return (
    <div className="min-w-0 space-y-1.5">
      <h3
        id={props.headingId}
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
      >
        {props.heading}
      </h3>
      <ul
        className={cn(
          "m-0 list-disc space-y-1 pl-4 text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {props.bullets.map((bullet) => (
          <li key={bullet} className="leading-snug">
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * TB-2191 — Ask ≠ frontier-chat differentiation strip (H7 / D1).
 * Full variant on the Ask hub; compact one-liner on FindingAskInlinePanel.
 */
export function AskVsFrontierAiDifferentiationStrip(
  props: AskVsFrontierAiDifferentiationStripProps,
): JSX.Element {
  const variant = props.variant ?? "full";
  const copy = props.copy ?? buildAskVsFrontierAiDifferentiation();

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 leading-relaxed text-neutral-600 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="ask-vs-frontier-ai-strip"
        data-variant="compact"
      >
        <span>{copy.compactLine}</span>{" "}
        <Link
          href={copy.compactLinkHref}
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          data-testid="ask-vs-frontier-ai-compact-link"
        >
          {copy.compactLinkLabel}
        </Link>
      </p>
    );
  }

  const askIsForId = "ask-vs-frontier-ai-is-for";
  const askWillNotId = "ask-vs-frontier-ai-will-not";
  const whyPackageId = "ask-vs-frontier-ai-why-package";

  return (
    <section
      className={cn(
        "mb-4 space-y-3 rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950",
        props.className,
      )}
      aria-labelledby="ask-vs-frontier-ai-title"
      data-testid="ask-vs-frontier-ai-strip"
      data-variant="full"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="ask-vs-frontier-ai-title"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {copy.title}
        </h2>
        <StatusTag
          kind="neutral"
          label={copy.statusTagLabel}
          data-testid="ask-vs-frontier-ai-status-tag"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <DifferentiationColumn
          headingId={askIsForId}
          heading={copy.askIsForHeading}
          bullets={copy.askIsForBullets}
        />
        <DifferentiationColumn
          headingId={askWillNotId}
          heading={copy.askWillNotHeading}
          bullets={copy.askWillNotBullets}
        />
        <DifferentiationColumn
          headingId={whyPackageId}
          heading={copy.whyPackageBeatsChatHeading}
          bullets={copy.whyPackageBeatsChatBullets}
        />
      </div>
    </section>
  );
}