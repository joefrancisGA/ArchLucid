import { ACCESSIBILITY_PUBLIC_STATUS_CARD } from "@/lib/accessibility-marketing-public-statement";
import { ACCESSIBILITY_PUBLIC_LAYOUT } from "@/lib/accessibility-public-layout";

const AT_A_GLANCE_ITEMS: readonly { readonly label: string; readonly detail: string }[] = [
  {
    label: "Target",
    detail: ACCESSIBILITY_PUBLIC_STATUS_CARD.target,
  },
  {
    label: "Program status",
    detail: ACCESSIBILITY_PUBLIC_STATUS_CARD.status,
  },
  {
    label: "VPAT",
    detail: ACCESSIBILITY_PUBLIC_STATUS_CARD.vpat,
  },
  {
    label: "Review cadence",
    detail: ACCESSIBILITY_PUBLIC_STATUS_CARD.reviewCadence,
  },
  {
    label: "How to report a barrier",
    detail: "Email accessibility@archlucid.net with the page, assistive technology or browser, and what you were trying to do.",
  },
] as const;

/** Plain-language orientation above the full accessibility statement sections. */
export function AccessibilityAtGlanceSummary(): React.JSX.Element {
  return (
    <aside
      className={ACCESSIBILITY_PUBLIC_LAYOUT.atGlance}
      aria-labelledby="accessibility-at-glance-heading"
      data-testid="accessibility-at-glance"
    >
      <h2 id="accessibility-at-glance-heading" className={ACCESSIBILITY_PUBLIC_LAYOUT.atGlanceTitle}>
        At a glance
      </h2>
      <p className={ACCESSIBILITY_PUBLIC_LAYOUT.atGlanceNote}>
        Summary only — the sections below describe our accessibility program in more detail.
      </p>
      <ul className={ACCESSIBILITY_PUBLIC_LAYOUT.atGlanceList}>
        {AT_A_GLANCE_ITEMS.map((item) => (
          <li key={item.label}>
            <span className={ACCESSIBILITY_PUBLIC_LAYOUT.atGlanceItemLabel}>{item.label}: </span>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
