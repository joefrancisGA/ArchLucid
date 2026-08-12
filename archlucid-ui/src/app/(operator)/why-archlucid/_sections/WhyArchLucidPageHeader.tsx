import Link from "next/link";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WHY_ARCHLUCID_CANONICAL_PATH } from "@/lib/why-archlucid-evidence-copy";
import {
  WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF,
  WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL,
  WHY_ARCHLUCID_INTERNAL_PILOT_BADGE_LABEL,
  WHY_ARCHLUCID_MARKETING_WHY_HREF,
  WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL,
  WHY_ARCHLUCID_PAGE_ORIENTATION,
  WHY_ARCHLUCID_PAGE_TITLE,
} from "@/lib/why-archlucid-page-copy";
import { cn } from "@/lib/utils";
import {
  type WhyArchLucidDemoUniverse,
  whyArchLucidUniverseBannerTitle,
  whyArchLucidUniverseWalkthroughLead,
} from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";

export type WhyArchLucidPageHeaderProps = {
  readonly universe: WhyArchLucidDemoUniverse;
  readonly failClosed: boolean;
};

export function WhyArchLucidPageHeader(props: WhyArchLucidPageHeaderProps): React.JSX.Element {
  const { universe, failClosed } = props;
  const bannerTitle = whyArchLucidUniverseBannerTitle(universe);
  const lead = whyArchLucidUniverseWalkthroughLead(universe);

  return (
    <OperatorPageHeader
      navHref={WHY_ARCHLUCID_CANONICAL_PATH}
      title={WHY_ARCHLUCID_PAGE_TITLE}
      titleTestId="why-archlucid-page-title"
      headingLevel="h1"
      subtitle={
        <>
          <span data-testid="why-archlucid-page-orientation">{WHY_ARCHLUCID_PAGE_ORIENTATION}</span>{" "}
          <span data-testid="why-archlucid-marketing-disambiguation">
            For competitive narrative, see{" "}
            <Link className={OPERATOR_LINK.nav} href={WHY_ARCHLUCID_MARKETING_WHY_HREF}>
              {WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL}
            </Link>
            .
          </span>
        </>
      }
      subtitleClassName="max-w-3xl"
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="why-archlucid-page-breadcrumb"
          items={[
            { label: WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL, href: WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF },
            { label: WHY_ARCHLUCID_PAGE_TITLE },
          ]}
        />
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

      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="why-archlucid-universe-lead">
        {lead}
      </p>
    </OperatorPageHeader>
  );
}
