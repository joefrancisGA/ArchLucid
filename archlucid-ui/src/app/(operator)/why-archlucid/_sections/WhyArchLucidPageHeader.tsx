import Link from "next/link";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WHY_ARCHLUCID_CANONICAL_PATH } from "@/lib/why-archlucid-evidence-copy";
import {
  WHY_ARCHLUCID_INTERNAL_PILOT_BADGE_LABEL,
  WHY_ARCHLUCID_MARKETING_WHY_HREF,
  WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL,
  WHY_ARCHLUCID_PAGE_TITLE,
  whyArchLucidPageOrientation,
} from "@/lib/why-archlucid-page-copy";
import { cn } from "@/lib/utils";
import {
  type WhyArchLucidDemoUniverse,
  whyArchLucidUniverseBannerTitle,
  whyArchLucidUniverseWalkthroughLead,
} from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";
import { WhyArchLucidBreadcrumb } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidBreadcrumb";

export type WhyArchLucidPageHeaderProps = {
  readonly universe: WhyArchLucidDemoUniverse;
  readonly failClosed: boolean;
  readonly buyerPolishedShell: boolean;
};

export function WhyArchLucidPageHeader(props: WhyArchLucidPageHeaderProps): React.JSX.Element {
  const { universe, failClosed, buyerPolishedShell } = props;
  const bannerTitle = whyArchLucidUniverseBannerTitle(universe);
  const lead = whyArchLucidUniverseWalkthroughLead(universe);
  const orientation = whyArchLucidPageOrientation(buyerPolishedShell);

  return (
    <OperatorPageHeader
      navHref={WHY_ARCHLUCID_CANONICAL_PATH}
      title={WHY_ARCHLUCID_PAGE_TITLE}
      titleTestId="why-archlucid-page-title"
      headingLevel="h1"
      breadcrumb={<WhyArchLucidBreadcrumb />}
      subtitle={
        <>
          <span data-testid="why-archlucid-page-orientation">{orientation}</span>
          {buyerPolishedShell ? null : (
            <>
              {" "}
              <span data-testid="why-archlucid-marketing-disambiguation">
                For competitive narrative, see{" "}
                <Link className={OPERATOR_LINK.nav} href={WHY_ARCHLUCID_MARKETING_WHY_HREF}>
                  {WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL}
                </Link>
                .
              </span>
            </>
          )}
        </>
      }
      statusBadge={
        <StatusTag
          kind="neutral"
          label={WHY_ARCHLUCID_INTERNAL_PILOT_BADGE_LABEL}
          data-testid="why-archlucid-internal-pilot-badge"
        />
      }
      actions={
        <div data-testid="why-archlucid-page-heading-actions">
          <PageContextualHelpButton />
        </div>
      }
    >
      <div
        role="status"
        data-testid="why-archlucid-universe-banner"
        data-why-archlucid-universe={universe}
        data-why-archlucid-universe-fail-closed={failClosed ? "true" : "false"}
        className={cn(
          "rounded border px-3 py-2 text-sm",
          failClosed
            ? DESIGN_TOKENS.callout.warn
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

      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="why-archlucid-universe-lead">
        {lead}
      </p>
    </OperatorPageHeader>
  );
}
