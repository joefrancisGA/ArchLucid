"use client";

import type { ReactElement } from "react";

import { ShowcaseFunnelTelemetryAnchor } from "@/lib/marketing/showcase-funnel-telemetry-anchor";
import { type ShowcaseRenderMode } from "@/lib/marketing/showcase-telemetry";
import { MARKETING_PRIMARY_CTA_CLASS } from "@/lib/design-tokens";

type ShowcaseBottomCTAProps = {
  readonly scenario: string;
  readonly renderMode: ShowcaseRenderMode;
};

/** Bottom conversion — public marketing surface; deep-links to trial and sign-in. */
export function ShowcaseBottomCTA({ scenario, renderMode }: ShowcaseBottomCTAProps): ReactElement {
  const secondaryClass =
    "inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

  return (
    <section
      aria-label="Get started with ArchLucid"
      className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50/80 p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="showcase-bottom-cta"
    >
      <h2 className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        Create your own architecture output
      </h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Start a new request in your workspace to generate reviews, findings, and exports for your systems.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ShowcaseFunnelTelemetryAnchor
          href="/get-started"
          className={MARKETING_PRIMARY_CTA_CLASS}
          scenario={scenario}
          renderMode={renderMode}
          funnelAction="demo_request_cta"
        >
          Create your own request
        </ShowcaseFunnelTelemetryAnchor>
        <ShowcaseFunnelTelemetryAnchor
          href="/signup"
          className={secondaryClass}
          scenario={scenario}
          renderMode={renderMode}
          funnelAction="signup_cta"
        >
          Start guided evaluation
        </ShowcaseFunnelTelemetryAnchor>
        <ShowcaseFunnelTelemetryAnchor
          href="/auth/signin"
          className={secondaryClass}
          scenario={scenario}
          renderMode={renderMode}
          funnelAction="signup_cta"
        >
          Sign in to workspace
        </ShowcaseFunnelTelemetryAnchor>
      </div>
    </section>
  );
}
