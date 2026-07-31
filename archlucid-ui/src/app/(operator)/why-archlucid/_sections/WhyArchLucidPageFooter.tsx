import { cn } from "@/lib/utils";
import { BUYER_WHY_ARCHLUCID_SOURCES_LINE } from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function WhyArchLucidPageFooter() {
  return (
    <footer className={cn("border-t border-neutral-200 pt-3 text-al-text-secondary dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
      {BUYER_WHY_ARCHLUCID_SOURCES_LINE} See repo{" "}
      <code>docs/library/SPONSOR_ONE_PAGER.md</code> and{" "}
      <code>docs/go-to-market/POSITIONING.md</code> for narrative context.
    </footer>
  );
}
