"use client";

import { Fragment, type JSX, type MouseEventHandler } from "react";

import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type VocabularyRailLink = {
  readonly href: string;
  readonly label: string;
  /** Appended to {@link VocabularyRailProps.testIdPrefix}, e.g. `peer-link`. */
  readonly testIdSuffix: string;
  /** Optional click handler (e.g. focus a same-page control instead of relying on hash alone). */
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/** Extra full-variant paragraph below the why-two line (honesty caveats, scope notes). */
export type VocabularyRailNote = {
  readonly testIdSuffix: string;
  readonly text: string;
};

export type VocabularyRailProps = {
  /** Rail-wide test id, e.g. `policy-packs-standards-vocabulary`. */
  readonly testIdPrefix: string;
  /** Surface hosting the rail — emitted as `data-current-surface` for drift guards. */
  readonly currentSurfaceId: string;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly compactLine: string;
  readonly heading: string;
  readonly whyTwo: string;
  readonly notes?: readonly VocabularyRailNote[];
  /** Current surface label; omitted on hub surfaces that are neither peer. */
  readonly currentLabel?: string | null;
  /** Peer surfaces to link. Hub rails pass both peers; leaf rails pass the opposite one. */
  readonly links: readonly VocabularyRailLink[];
};

/**
 * Shared presentation for the paired-surface vocabulary rails (TB-2239 onward).
 * Each `<PairName>VocabularyRail` resolves its own copy model and peer link, then delegates here so
 * the markup, Carbon classes, and test-id contract stay in one place.
 */
export function VocabularyRail(props: VocabularyRailProps): JSX.Element {
  const variant = props.variant ?? "compact";
  const notes = props.notes ?? [];

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid={props.testIdPrefix}
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{props.compactLine}</span>
        {notes.map((note) => (
          <span key={note.testIdSuffix} data-testid={`${props.testIdPrefix}-${note.testIdSuffix}`}>
            {" "}
            {note.text}
          </span>
        ))}{" "}
        {props.links.map((link, index) => (
          <Fragment key={link.testIdSuffix}>
            {index > 0 ? " · " : null}
            <Link
              href={link.href}
              className={cn(OPERATOR_LINK.nav, "font-medium")}
              data-testid={`${props.testIdPrefix}-${link.testIdSuffix}`}
              onClick={link.onClick}
            >
              {link.label}
            </Link>
          </Fragment>
        ))}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby={`${props.testIdPrefix}-heading`}
      data-testid={props.testIdPrefix}
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id={`${props.testIdPrefix}-heading`}
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {props.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.whyTwo}</p>
      {notes.map((note) => (
        <p
          key={note.testIdSuffix}
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${props.testIdPrefix}-${note.testIdSuffix}`}
        >
          {note.text}
        </p>
      ))}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {typeof props.currentLabel === "string" ? (
          <span
            className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`${props.testIdPrefix}-current`}
            aria-current="page"
          >
            {props.currentLabel}
          </span>
        ) : null}
        {props.links.map((link) => (
          <Link
            key={link.testIdSuffix}
            href={link.href}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`${props.testIdPrefix}-${link.testIdSuffix}`}
            onClick={link.onClick}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
