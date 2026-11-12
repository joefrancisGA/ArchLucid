"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { resolveAdvisoryScansHelpTileItems } from "@/lib/advisory-scans-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function HelpAdvisoryScansRelatedGovernanceTiles(): React.JSX.Element {
  const { productLine } = useProductLine();
  const tileItems = resolveAdvisoryScansHelpTileItems(productLine);

  return (
    <ul
      className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}
      data-testid="help-advisory-scans-tile-items"
    >
      {tileItems.map((item) => (
        <li key={item.label} className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <Link className={cn("font-medium", OPERATOR_LINK.nav)} href={item.href}>
            {item.label}
          </Link>
          <p className="m-0 mt-1 text-al-text-secondary">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}
