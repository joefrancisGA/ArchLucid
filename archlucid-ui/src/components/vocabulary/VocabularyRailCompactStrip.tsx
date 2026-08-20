"use client";

import { Fragment, type JSX } from "react";

import Link from "next/link";

import { OPERATOR_LINK } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveVocabularyCompactLineAnchor,
  splitVocabularyCompactLine,
} from "@/lib/vocabulary/split-vocabulary-compact-line";

import type {
  VocabularyRailCompactLinkPlacement,
  VocabularyRailLink,
  VocabularyRailNote,
} from "@/components/vocabulary/vocabulary-rail-types";

export type VocabularyRailCompactStripProps = {
  readonly testIdPrefix: string;
  readonly compactLine: string;
  readonly notes: readonly VocabularyRailNote[];
  readonly links: readonly VocabularyRailLink[];
  readonly compactLinkPlacement: VocabularyRailCompactLinkPlacement;
};

function findVocabularyRailLink(
  links: readonly VocabularyRailLink[],
  testIdSuffix: string,
): VocabularyRailLink | null {
  const match = links.find((link) => link.testIdSuffix === testIdSuffix);

  if (match === undefined) {
    return null;
  }

  return match;
}

function renderCompactNotes(
  testIdPrefix: string,
  notes: readonly VocabularyRailNote[],
): JSX.Element {
  return (
    <>
      {notes.map((note) => (
        <span key={note.testIdSuffix} data-testid={`${testIdPrefix}-${note.testIdSuffix}`}>
          {" "}
          {note.text}
        </span>
      ))}
    </>
  );
}

function renderTrailingPeerLinks(
  testIdPrefix: string,
  links: readonly VocabularyRailLink[],
): JSX.Element | null {
  if (links.length === 0) {
    return null;
  }

  return (
    <>
      {" "}
      {links.map((link, index) => (
        <Fragment key={link.testIdSuffix}>
          {index > 0 ? " · " : null}
          <Link
            href={link.href}
            className={cn(OPERATOR_LINK.nav, "font-medium")}
            data-testid={`${testIdPrefix}-${link.testIdSuffix}`}
            onClick={link.onClick}
          >
            {link.label}
          </Link>
        </Fragment>
      ))}
    </>
  );
}

function buildInlineCompactLine(
  testIdPrefix: string,
  compactLine: string,
  links: readonly VocabularyRailLink[],
): { readonly nodes: readonly JSX.Element[]; readonly trailingLinks: readonly VocabularyRailLink[] } {
  const split = splitVocabularyCompactLine(
    compactLine,
    links.map((link) => ({
      id: link.testIdSuffix,
      text: resolveVocabularyCompactLineAnchor(link),
    })),
  );

  const nodes = split.segments.map((segment, index) => {
    switch (segment.kind) {
      case "text":
        return <Fragment key={`text-${index}`}>{segment.text}</Fragment>;
      case "link": {
        const link = findVocabularyRailLink(links, segment.anchorId);

        if (link === null) {
          return <Fragment key={`missing-${index}`}>{segment.text}</Fragment>;
        }

        return (
          <Link
            key={link.testIdSuffix}
            href={link.href}
            className={OPERATOR_LINK.inline}
            data-testid={`${testIdPrefix}-${link.testIdSuffix}`}
            onClick={link.onClick}
          >
            {segment.text}
          </Link>
        );
      }
      default: {
        const exhaustive: never = segment;
        throw new Error(`Unhandled compact line segment: ${JSON.stringify(exhaustive)}`);
      }
    }
  });

  const trailingLinks = links.filter((link) => !split.linkedAnchorIds.has(link.testIdSuffix));

  return { nodes, trailingLinks };
}

/**
 * Compact vocabulary sentence plus peer links (trailing after the period, or inlined on the words).
 */
export function VocabularyRailCompactStrip(props: VocabularyRailCompactStripProps): JSX.Element {
  switch (props.compactLinkPlacement) {
    case "trailing":
      return (
        <>
          <span>{props.compactLine}</span>
          {renderCompactNotes(props.testIdPrefix, props.notes)}
          {renderTrailingPeerLinks(props.testIdPrefix, props.links)}
        </>
      );
    case "inline": {
      const inlineLine = buildInlineCompactLine(props.testIdPrefix, props.compactLine, props.links);

      return (
        <>
          {inlineLine.nodes}
          {renderCompactNotes(props.testIdPrefix, props.notes)}
          {renderTrailingPeerLinks(props.testIdPrefix, inlineLine.trailingLinks)}
        </>
      );
    }
    default: {
      const exhaustive: never = props.compactLinkPlacement;
      throw new Error(`Unhandled compact link placement: ${String(exhaustive)}`);
    }
  }
}
