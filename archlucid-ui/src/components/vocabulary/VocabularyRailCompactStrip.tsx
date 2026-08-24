"use client";

import { Fragment, type JSX } from "react";

import { OPERATOR_LINK } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveVocabularyCompactLineAnchor,
  splitVocabularyCompactLine,
} from "@/lib/vocabulary/split-vocabulary-compact-line";

import { VocabularyRailNoteText } from "@/components/vocabulary/VocabularyRailNoteText";
import { VocabularyRailCompactLink } from "@/components/vocabulary/VocabularyRailCompactLink";
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
          <VocabularyRailNoteText note={note} />
        </span>
      ))}
    </>
  );
}

function renderVocabularyRailLink(
  testIdPrefix: string,
  link: VocabularyRailLink,
  className: string,
  children: React.ReactNode,
): JSX.Element {
  return (
    <VocabularyRailCompactLink
      href={link.href}
      className={className}
      testId={`${testIdPrefix}-${link.testIdSuffix}`}
      onClick={link.onClick}
      tooltip={link.tooltip}
      tooltipTitle={link.tooltipTitle}
    >
      {children}
    </VocabularyRailCompactLink>
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
          {renderVocabularyRailLink(testIdPrefix, link, cn(OPERATOR_LINK.nav, "font-medium"), link.label)}
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
          <Fragment key={link.testIdSuffix}>
            {renderVocabularyRailLink(testIdPrefix, link, OPERATOR_LINK.inline, segment.text)}
          </Fragment>
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
