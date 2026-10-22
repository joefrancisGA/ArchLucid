import type { ReactElement } from "react";

import { SeeItDeliverablePreview } from "@/app/(marketing)/see-it/SeeItDeliverablePreview";
import { ShowcaseBreadcrumb } from "@/components/marketing/showcase/ShowcaseBreadcrumb";
import { MARKETING_MOTION, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SHOWCASE_HERO_SUBTITLE,
  showcaseScenarioRibbonLabel,
  showcaseTitleForRunId,
} from "@/lib/showcase-page-copy";
import { SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE } from "@/lib/showcase-disclosure-copy";
import { cn } from "@/lib/utils";

export type ShowcaseHeroProps = {
  readonly runId: string;
};

export function ShowcaseHero(props: ShowcaseHeroProps): ReactElement {
  const { runId } = props;
  const demoRibbon =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1" ? (
      <div
        role="status"
        className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100"
        data-testid="showcase-demo-single-banner"
      >
        <strong className="font-semibold">{SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE}</strong>
        {" — "}
        {showcaseScenarioRibbonLabel(runId)}
      </div>
    ) : null;

  return (
    <section
      className={cn(
        "grid items-start gap-10 border-b border-neutral-200 pb-8 dark:border-neutral-800 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12",
        MARKETING_MOTION.revealIn,
      )}
      data-testid="showcase-hero"
      aria-labelledby="showcase-hero-heading"
    >
      <div>
        <div className="mb-3">
          <ShowcaseBreadcrumb />
        </div>
        {demoRibbon}
        <h1 id="showcase-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>
          {showcaseTitleForRunId(runId)}
        </h1>
        <p className={cn("mt-2", MARKETING_TYPOGRAPHY.meta)} data-testid="showcase-hero-subtitle">
          {SHOWCASE_HERO_SUBTITLE}
        </p>
      </div>

      <SeeItDeliverablePreview />
    </section>
  );
}
