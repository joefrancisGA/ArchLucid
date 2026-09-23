"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_PATH,
  SECURENOW_INFRASTRUCTURE_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function resolveDiagramsBreadcrumbParent(pathname: string): { readonly href: string; readonly label: string } {
  const bare = pathname.split("?", 1)[0] ?? pathname;

  if (bare.startsWith(SECURENOW_INFRASTRUCTURE_PATH)) {
    return {
      href: SECURENOW_INFRASTRUCTURE_PATH,
      label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
    };
  }

  return {
    href: GOVERNANCE_INFRASTRUCTURE_PATH,
    label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  };
}

/** Diagrams breadcrumb (NDI). */
export function DiagramsBreadcrumb(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const pathname = usePathname() ?? "";
  const { href: parentHref, label: parentLabel } = resolveDiagramsBreadcrumbParent(pathname);

  if (productLine === "security") {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" data-testid="infra-diagrams-breadcrumb">
      <ol className={cn("m-0 flex flex-wrap items-center gap-1 p-0 list-none", OPERATOR_TYPOGRAPHY.helper)}>
        <li>
          <Link
            href={parentHref}
            className={cn("text-al-link hover:underline", OPERATOR_LINK.inline)}
          >
            {parentLabel}
          </Link>
        </li>
        <li aria-hidden className="text-al-text-secondary">/</li>
        <li className="text-al-text-secondary" aria-current="page">
          {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
