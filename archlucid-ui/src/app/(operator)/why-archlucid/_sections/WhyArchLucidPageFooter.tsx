import { BUYER_WHY_ARCHLUCID_SOURCES_LINE } from "@/lib/buyer-polish-copy";

export function WhyArchLucidPageFooter() {
  return (
    <footer className="border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {BUYER_WHY_ARCHLUCID_SOURCES_LINE} See repo <code>docs/SPONSOR_ONE_PAGER.md</code> and{" "}
      <code>docs/go-to-market/POSITIONING.md</code> for narrative context.
    </footer>
  );
}
