/**
 * Split a vocabulary compact sentence so peer names can be inlined as links
 * instead of repeating after the period.
 */

export type VocabularyCompactLineAnchor = {
  readonly id: string;
  readonly text: string;
};

export type VocabularyCompactLineTextSegment = {
  readonly kind: "text";
  readonly text: string;
};

export type VocabularyCompactLineLinkSegment = {
  readonly kind: "link";
  readonly text: string;
  readonly anchorId: string;
};

export type VocabularyCompactLineSegment =
  | VocabularyCompactLineTextSegment
  | VocabularyCompactLineLinkSegment;

export type VocabularyCompactLineSplit = {
  readonly segments: readonly VocabularyCompactLineSegment[];
  readonly linkedAnchorIds: ReadonlySet<string>;
};

type LocatedAnchor = {
  readonly anchorId: string;
  readonly start: number;
  readonly end: number;
};

function escapeVocabularyCompactLineRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Prefer an explicit sentence word when the peer label does not appear as-is. */
export function resolveVocabularyCompactLineAnchor(link: {
  readonly label: string;
  readonly compactLineAnchor?: string;
}): string {
  if (link.compactLineAnchor !== undefined && link.compactLineAnchor.length > 0) {
    return link.compactLineAnchor;
  }

  return link.label;
}

function locateAnchor(
  compactLine: string,
  anchor: VocabularyCompactLineAnchor,
): LocatedAnchor | null {
  if (anchor.id.length === 0) {
    return null;
  }

  if (anchor.text.length === 0) {
    return null;
  }

  const pattern = new RegExp(`\\b${escapeVocabularyCompactLineRegExp(anchor.text)}\\b`);
  const match = pattern.exec(compactLine);

  if (match === null) {
    return null;
  }

  const matchedText = match[0];

  if (matchedText === undefined) {
    return null;
  }

  return {
    anchorId: anchor.id,
    start: match.index,
    end: match.index + matchedText.length,
  };
}

function compareLocatedAnchors(left: LocatedAnchor, right: LocatedAnchor): number {
  if (left.start !== right.start) {
    return left.start - right.start;
  }

  // Same start: keep the longer span so "Microsoft Teams" wins over "Teams".
  return right.end - right.start - (left.end - left.start);
}

export function splitVocabularyCompactLine(
  compactLine: string,
  anchors: readonly VocabularyCompactLineAnchor[],
): VocabularyCompactLineSplit {
  const located = anchors
    .map((anchor) => locateAnchor(compactLine, anchor))
    .filter((item): item is LocatedAnchor => item !== null)
    .sort(compareLocatedAnchors);

  const segments: VocabularyCompactLineSegment[] = [];
  const linkedAnchorIds = new Set<string>();
  let cursor = 0;

  for (const match of located) {
    if (match.start < cursor) {
      continue;
    }

    if (match.start > cursor) {
      segments.push({
        kind: "text",
        text: compactLine.slice(cursor, match.start),
      });
    }

    segments.push({
      kind: "link",
      text: compactLine.slice(match.start, match.end),
      anchorId: match.anchorId,
    });
    linkedAnchorIds.add(match.anchorId);
    cursor = match.end;
  }

  if (cursor < compactLine.length) {
    segments.push({
      kind: "text",
      text: compactLine.slice(cursor),
    });
  }

  if (segments.length === 0) {
    segments.push({
      kind: "text",
      text: compactLine,
    });
  }

  return {
    segments,
    linkedAnchorIds,
  };
}
