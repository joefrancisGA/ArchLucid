import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import { CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE } from "@/lib/vocabulary/finding-correlation-vocabulary";
import { BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL, BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareResultsSectionNavProps = {
  readonly showStructured: boolean;
  readonly showFindingCorrelation: boolean;
  readonly showGovernanceDiff: boolean;
  readonly showRawManifestDiff: boolean;
  readonly showTechnicalAppendix: boolean;
  readonly showAiExplanation: boolean;
  readonly buyerPolished: boolean;
  readonly className?: string;
};

type NavItem = {
  readonly href: string;
  readonly label: string;
};

export function CompareResultsSectionNav(props: CompareResultsSectionNavProps): ReactElement | null {
  const items: NavItem[] = [];

  if (props.showStructured) {
    items.push({ href: "#compare-structured", label: "Review comparison" });
  }

  if (props.showFindingCorrelation) {
    items.push({ href: "#compare-finding-correlation", label: CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE });
  }

  if (props.showGovernanceDiff) {
    items.push({ href: "#compare-governance-diff", label: "Governance diff" });
  }

  if (props.showRawManifestDiff) {
    items.push({
      href: "#compare-raw-manifest-diff",
      label: props.buyerPolished ? BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL : "Review change details appendix",
    });
  }

  if (props.showTechnicalAppendix) {
    items.push({
      href: "#compare-technical",
      label: props.buyerPolished ? BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL : "Technical details",
    });
  }

  if (props.showAiExplanation) {
    items.push({ href: "#compare-ai", label: "AI explanation" });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Comparison results sections"
      className={cn(
        "sticky top-4 z-10 w-full rounded-lg border border-neutral-200 bg-white/95 p-3 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95",
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
      data-testid="compare-results-section-nav"
    >
      <p className={cn("m-0 mb-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Jump to section</p>
      <ol className={cn("m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {items.map((item) => (
          <li key={item.href}>
            <a className={OPERATOR_LINK.inline} href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
