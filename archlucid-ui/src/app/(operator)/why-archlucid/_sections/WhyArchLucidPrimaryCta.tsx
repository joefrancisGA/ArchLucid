import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  WHY_ARCHLUCID_PRIMARY_CTA_LABEL,
  whyArchLucidSampleReviewHref,
} from "@/lib/why-archlucid-page-copy";

export type WhyArchLucidPrimaryCtaProps = {
  readonly demoRunId: string | null | undefined;
  readonly loading: boolean;
  readonly failClosed: boolean;
};

/** TB-1309: first-viewport hop into the seeded sample architecture package when identity is known. */
export function WhyArchLucidPrimaryCta(props: WhyArchLucidPrimaryCtaProps): React.JSX.Element | null {
  const { demoRunId, loading, failClosed } = props;

  if (loading || failClosed) {
    return null;
  }

  const href = whyArchLucidSampleReviewHref(demoRunId);

  if (href === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="why-archlucid-primary-cta-row">
      <Button asChild variant="primary" size="lg">
        <Link href={href} data-testid="why-archlucid-primary-cta">
          {WHY_ARCHLUCID_PRIMARY_CTA_LABEL}
        </Link>
      </Button>
    </div>
  );
}
