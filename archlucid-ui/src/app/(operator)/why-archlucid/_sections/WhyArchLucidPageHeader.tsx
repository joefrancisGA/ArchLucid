import Link from "next/link";

import { cn } from "@/lib/utils";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_ARCHLUCID_MARKETING_WHY_HREF,
  WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL,
  WHY_ARCHLUCID_PAGE_ORIENTATION,
  WHY_ARCHLUCID_PAGE_TITLE,
} from "@/lib/why-archlucid-page-copy";
import {
  type WhyArchLucidDemoUniverse,
  whyArchLucidUniverseBannerTitle,
  whyArchLucidUniverseWalkthroughLead,
} from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";

export type WhyArchLucidPageHeaderProps = {
  readonly universe: WhyArchLucidDemoUniverse;
  readonly failClosed: boolean;
};

export function WhyArchLucidPageHeader(props: WhyArchLucidPageHeaderProps) {
  const { universe, failClosed } = props;
  const bannerTitle = whyArchLucidUniverseBannerTitle(universe);
  const lead = whyArchLucidUniverseWalkthroughLead(universe);

  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)} data-testid="why-archlucid-page-title">
          {WHY_ARCHLUCID_PAGE_TITLE}
        </h1>
        <PageContextualHelpButton />
      </div>

      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="why-archlucid-page-orientation">
        {WHY_ARCHLUCID_PAGE_ORIENTATION}
      </p>
      <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.body)} data-testid="why-archlucid-marketing-disambiguation">
        For competitive narrative, see{" "}
        <Link className={OPERATOR_LINK} href={WHY_ARCHLUCID_MARKETING_WHY_HREF}>
          {WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL}
        </Link>
        .
      </p>

      <div
        role="status"
        data-testid="why-archlucid-universe-banner"
        data-why-archlucid-universe={universe}
        data-why-archlucid-universe-fail-closed={failClosed ? "true" : "false"}
        className={cn(
          "rounded border px-3 py-2 text-sm",
          failClosed
            ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
            : "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200",
        )}
      >
        <p className="font-semibold" data-testid="why-archlucid-universe-banner-title">
          {bannerTitle}
        </p>
        {failClosed ? (
          <p className={cn("m-0 mt-1 text-xs", OPERATOR_TYPOGRAPHY.helper)}>
            Claims Intake and Retail baseline labels are withheld until the loaded demo review identity is unambiguous.
            Refresh after seeding a consistent demo package.
          </p>
        ) : null}
      </div>

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="why-archlucid-universe-lead">
        {lead}
      </p>
    </header>
  );
}
