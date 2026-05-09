import Link from "next/link";
import { ArrowDown, ArrowRight, FileText, PackageCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { getShowcaseWalkthroughHref } from "@/lib/buyer-safe-review-navigation";
import { cn } from "@/lib/utils";

type ValuePropFlowPanel = {
  readonly Icon: typeof FileText;
  readonly title: string;
  readonly caption: string;
};

const FLOW_PANELS: readonly ValuePropFlowPanel[] = [
  {
    Icon: FileText,
    title: "Brief",
    caption: "Scope, constraints, and context your team already has.",
  },
  {
    Icon: Sparkles,
    title: "AI Analysis",
    caption: "Structured examination against topology, cost, and quality signals.",
  },
  {
    Icon: PackageCheck,
    title: "Reviewable package",
    caption: "Findings, evidence, and limits sponsors can sign off on.",
  },
];

function FlowConnector(props: { readonly className?: string }): ReactNode {
  return (
    <>
      <div className={cn("flex justify-center py-1 text-teal-700 dark:text-teal-300 md:hidden", props.className)} aria-hidden>
        <ArrowDown className="size-5 shrink-0" strokeWidth={2} />
      </div>
      <div className={cn("hidden items-center justify-center px-1 text-teal-700 dark:text-teal-300 md:flex", props.className)} aria-hidden>
        <ArrowRight className="size-5 shrink-0" strokeWidth={2} />
      </div>
    </>
  );
}

/** Marketing landing hero: outcome headline, persona pain, three-step flow, showcase CTA (composed into pages later). */
export function PageHeroValueProp(): ReactNode {
  const showcaseHref = getShowcaseWalkthroughHref();

  return (
    <section aria-labelledby="page-hero-value-prop-heading" className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="text-center">
        <h2
          id="page-hero-value-prop-heading"
          className="text-balance text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl md:text-4xl"
        >
          Turn architecture briefs into defensible, review-ready deliverables faster.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-neutral-600 dark:text-neutral-400 sm:text-lg">
          Architecture and modernization leads need sponsor-grade evidence—not weeks lost reconciling drafts, slides, and
          side conversations.
        </p>
      </div>

      <div
        className="mt-10 flex flex-col md:flex-row md:items-stretch md:justify-center md:gap-0"
        aria-label="How ArchLucid turns a brief into a reviewable package"
      >
        {FLOW_PANELS.map((panel, index) => {
          const { Icon, title, caption } = panel;

          return (
            <div key={title} className="contents md:contents">
              <div className="flex flex-1 flex-col rounded-lg border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/40 sm:p-5">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-200 sm:size-14">
                  <Icon className="size-6 sm:size-7" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-3 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-50 sm:text-base">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-center text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                  {caption}
                </p>
              </div>

              {index < FLOW_PANELS.length - 1 ? <FlowConnector /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-center">
        <Button variant="primary" size="lg" asChild>
          <Link href={showcaseHref}>See it work in 60 seconds</Link>
        </Button>
      </div>
    </section>
  );
}
