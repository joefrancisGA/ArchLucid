import type { MouseEventHandler } from "react";

export type VocabularyRailCompactLinkPlacement = "trailing" | "inline";

export type VocabularyRailLink = {
  readonly href: string;
  readonly label: string;
  /** Appended to the rail test-id prefix, e.g. `peer-link`. */
  readonly testIdSuffix: string;
  /** Sentence word to wrap when compact links are inlined. */
  readonly compactLineAnchor?: string;
  /** Optional hover/focus tooltip body for inline or trailing peer links. */
  readonly tooltip?: string;
  /** Optional tooltip title; defaults to the rendered link text. */
  readonly tooltipTitle?: string;
  /** Optional click handler (e.g. focus a same-page control instead of relying on hash alone). */
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/** Extra full-variant paragraph below the why-two line (honesty caveats, scope notes). */
export type VocabularyRailNote = {
  readonly testIdSuffix: string;
  readonly text: string;
  /** When set, rendered semibold before {@link text} (e.g. `Examples:`). */
  readonly boldPrefix?: string;
};

export type VocabularyPeerLinkSource = {
  readonly href: string;
  readonly label: string;
  readonly compactLineAnchor?: string;
};
