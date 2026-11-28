import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchLucidSealedReviewBuyerPath } from "@/lib/product-line/resolve-archlucid-sealed-review-buyer-path";
import { cn } from "@/lib/utils";

export type ArchLucidSealedReviewBuyerPathStripProps = { readonly testId: string; readonly buyerPath: ArchLucidSealedReviewBuyerPath };

export function ArchLucidSealedReviewBuyerPathStrip(props: ArchLucidSealedReviewBuyerPathStripProps): React.JSX.Element {
  const td = props.testId;
  return (
    <section className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)} data-testid={td} aria-label="ArchLucid sealed review buyer path">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-lead"}>{props.buyerPath.lead}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={td + "-not-sources"}>{props.buyerPath.notSourcesLine}</p>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
        {props.buyerPath.links.map((link) => (
          <li key={link.href}>
            <Button type="button" variant="secondary" size="sm" asChild data-testid={td + "-link-" + link.label.replace(/\s+/g, "-").toLowerCase()}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
