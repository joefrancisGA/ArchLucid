import { forwardRef } from "react";

import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";

export type ArchLucidMarkProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "width" | "height" | "viewBox" | "color"
> & {
  /** Rendered square size in px. Designed to stay legible at 16 / 24 / 32. */
  size?: number;
  /**
   * Accessible name. When provided the mark is exposed as an `img` with a
   * `<title>`; when omitted the mark is decorative (`aria-hidden`) and a
   * sibling element is expected to carry the name (e.g. the wordmark text).
   */
  title?: string;
  /** Override the primary (navy) shape color. Defaults to the brand navy. */
  navyColor?: string;
  /** Override the accent (teal) facet + node color. Defaults to brand teal. */
  tealColor?: string;
};

/*
 * Geometry notes (single 32x32 grid — all coordinates below are in user units):
 *
 *   - The "A" is a HOLLOW architectural peak: one navy polygon traces the outer
 *     triangle down into an inner cutout and back out, leaving the base open.
 *     Outer apex (16,2) → base corners (3,30)/(29,30); inner apex (16,13) →
 *     inner base (10.5,30)/(21.5,30).
 *   - A single teal facet sits on the upper-left blade of the peak (restrained
 *     accent, not a gradient).
 *   - The "evidence path" is two nodes joined by one short line near the lower
 *     interior; it doubles as the crossbar of the "A". Left node navy, right
 *     node teal — matching the brand accent rhythm.
 *
 * Flat-fill polygons + plain circles keep the silhouette crisp at tiny sizes.
 */
const NAVY_A_PATH = "M16 2 L3 30 L10.5 30 L16 13 L21.5 30 L29 30 Z";
const TEAL_FACET_POINTS = "16,2 9.5,16 16,13";

const EVIDENCE_NODE_Y = 23.5;
const EVIDENCE_LEFT_NODE_X = 12.6;
const EVIDENCE_RIGHT_NODE_X = 19.4;
const EVIDENCE_NODE_RADIUS = 2.6;
const EVIDENCE_LINE_WIDTH = 2;

/**
 * ArchLucid "Option A" brand mark — architectural triangular "A" with a teal
 * facet and a two-node evidence path. Color-prop driven and theme-agnostic so
 * it can be reused on light, dark, or branded surfaces.
 */
export const ArchLucidMark = forwardRef<SVGSVGElement, ArchLucidMarkProps>(
  function ArchLucidMark(
    {
      size = 32,
      title,
      navyColor = ARCHLUCID_BRAND.navy,
      tealColor = ARCHLUCID_BRAND.teal,
      ...svgProps
    },
    ref,
  ) {
    const hasTitle = title !== undefined && title !== null && title !== "";

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        role={hasTitle ? "img" : undefined}
        aria-hidden={hasTitle ? undefined : true}
        {...svgProps}
      >
        {hasTitle ? <title>{title}</title> : null}

        <path d={NAVY_A_PATH} fill={navyColor} />

        <polygon points={TEAL_FACET_POINTS} fill={tealColor} />

        <line
          x1={EVIDENCE_LEFT_NODE_X}
          y1={EVIDENCE_NODE_Y}
          x2={EVIDENCE_RIGHT_NODE_X}
          y2={EVIDENCE_NODE_Y}
          stroke={navyColor}
          strokeWidth={EVIDENCE_LINE_WIDTH}
          strokeLinecap="round"
        />

        <circle
          cx={EVIDENCE_LEFT_NODE_X}
          cy={EVIDENCE_NODE_Y}
          r={EVIDENCE_NODE_RADIUS}
          fill={navyColor}
        />

        <circle
          cx={EVIDENCE_RIGHT_NODE_X}
          cy={EVIDENCE_NODE_Y}
          r={EVIDENCE_NODE_RADIUS}
          fill={tealColor}
        />
      </svg>
    );
  },
);
