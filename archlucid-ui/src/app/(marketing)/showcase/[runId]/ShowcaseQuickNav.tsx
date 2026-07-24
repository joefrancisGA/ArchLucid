import Link from "next/link";
import type { ReactElement } from "react";

import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import {
  SHOWCASE_QUICK_NAV_DEEP_LINK_BODY,
  SHOWCASE_QUICK_NAV_HEADING,
  SHOWCASE_QUICK_NAV_SIGN_IN_BODY,
  SHOWCASE_QUICK_NAV_SIGN_IN_CTA,
} from "@/lib/showcase-quick-nav-contract";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

function primaryFindingIdForShowcase(payload: DemoCommitPagePreviewResponse): string {
  const rows = payload.runExplanation?.findingTraceConfidences;

  if (Array.isArray(rows)) {
    const withId = rows.find((r) => r.findingId?.trim());

    if (withId?.findingId?.trim()) {
      return withId.findingId.trim();
    }
  }

  return SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID;
}

const btnClass =
  "inline-flex items-center justify-center rounded-md border border-neutral-400 bg-al-surface-raised px-3 py-2 text-sm font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600";

type ShowcaseQuickNavProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly operatorDeepLinksAvailable: boolean;
};

/** Deep-links into the operator workspace when demo static fallback is active; otherwise sign-in first (TB-890). */
export function ShowcaseQuickNav({
  payload,
  operatorDeepLinksAvailable,
}: ShowcaseQuickNavProps): ReactElement {
  const runId = payload.run.runId;
  const manifestId = payload.manifest.manifestId;
  const findingId = primaryFindingIdForShowcase(payload);
  const findingHref = `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`;
  const reviewHref = `/reviews/${encodeURIComponent(runId)}`;

  return (
    <section
      aria-labelledby="showcase-quick-nav-heading"
      className="mt-6 rounded-lg border border-neutral-200 bg-white/90 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60"
    >
      <h2
        id="showcase-quick-nav-heading"
        className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50"
      >
        {SHOWCASE_QUICK_NAV_HEADING}
      </h2>
      <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
        {operatorDeepLinksAvailable ? SHOWCASE_QUICK_NAV_DEEP_LINK_BODY : SHOWCASE_QUICK_NAV_SIGN_IN_BODY}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {operatorDeepLinksAvailable ? (
          <>
            <Link href={reviewHref} className={btnClass}>
              Review
            </Link>
            <Link href={`/signed-records/${encodeURIComponent(manifestId)}`} className={btnClass}>
              Open signed record
            </Link>
            <Link href={findingHref} className={btnClass}>
              Review finding
            </Link>
          </>
        ) : (
          <Link
            href={buildAuthSignInHref({ returnPath: reviewHref })}
            className={btnClass}
          >
            {SHOWCASE_QUICK_NAV_SIGN_IN_CTA}
          </Link>
        )}
      </div>
    </section>
  );
}
