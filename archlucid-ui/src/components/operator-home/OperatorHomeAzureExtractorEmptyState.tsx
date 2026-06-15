import { CloudUpload, FileSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BUYER_HOME_PRIMARY_CTA } from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

const FIRST_RUN_STEPS: { label: string; description: string }[] = [
  {
    label: "Upload your Azure environment",
    description: "Run the Tier 1 PowerShell extractor in your subscription (no credentials leave your tenant) and upload the generated ZIP.",
  },
  {
    label: "Select analysis scope",
    description: "Choose which policy pack to apply — Azure CIS, custom governance rules, or the default starter pack.",
  },
  {
    label: "View your first finding",
    description: "ArchLucid maps dependencies, runs multi-agent analysis, and delivers a signed review package with a full evidence trail.",
  },
];

/** First-run empty workspace: inline 3-step progress strip with a single primary CTA. */
export function OperatorHomeAzureExtractorEmptyState() {
  return (
    <div
      className={cn(OPERATOR_LAYOUT.sectionStack, OPERATOR_CARD.nested, "rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900")}
      data-testid="operator-home-azure-extractor-empty-state"
    >
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Start your first architecture review
        </p>
        <p className="m-0 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
          ArchLucid coordinates multi-agent topology, cost, and compliance analysis into a versioned, evidence-linked review
          package with a full audit trail. Complete these three steps to get your first result.
        </p>
      </div>

      <ol className="m-0 list-none space-y-2 p-0">
        {FIRST_RUN_STEPS.map((step, i) => (
          <li key={step.label} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-700 text-[10px] font-bold text-teal-700 dark:border-teal-400 dark:text-teal-400">
              {i + 1}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="m-0 text-xs font-semibold text-neutral-800 dark:text-neutral-200">{step.label}</p>
              <p className="m-0 text-xs leading-snug text-neutral-500 dark:text-neutral-400">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className={cn("flex flex-wrap items-center border-t border-neutral-200 pt-3 dark:border-neutral-800", OPERATOR_LAYOUT.inlineGap)}>
        <Button asChild variant="primary" size="sm" className="h-8">
          <Link href="/reviews/new">
            <CloudUpload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Begin architecture review
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href={sampleReviewHref}>
            <FileSearch className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {BUYER_HOME_PRIMARY_CTA}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/help">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            How this works
          </Link>
        </Button>
      </div>
    </div>
  );
}
