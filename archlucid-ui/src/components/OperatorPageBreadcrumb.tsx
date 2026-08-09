import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorPageBreadcrumbItem = {
  readonly label: string;
  readonly href?: string;
};

export type OperatorPageBreadcrumbProps = {
  readonly items: readonly OperatorPageBreadcrumbItem[];
  readonly className?: string;
  readonly "data-testid"?: string;
};

/** Compact hierarchy trail above operator page titles — parent segments link; current page is plain text. */
export function OperatorPageBreadcrumb(props: OperatorPageBreadcrumbProps): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={props["data-testid"]}
    >
      <ol className="m-0 flex flex-wrap items-center gap-1 p-0 list-none">
        {props.items.map((item, index) => {
          const isLast = index === props.items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <span aria-hidden="true" className="text-al-text-secondary">
                  /
                </span>
              ) : null}
              {isLast || item.href === undefined || item.href.trim().length === 0 ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-al-text-primary" : "text-al-text-secondary"}
                >
                  {item.label}
                </span>
              ) : (
                <Link className={OPERATOR_LINK.nav} href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
