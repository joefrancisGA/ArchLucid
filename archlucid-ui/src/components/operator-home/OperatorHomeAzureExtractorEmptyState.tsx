import { CloudUpload, FileSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { Button } from "@/components/ui/button";

/** First-run empty workspace guidance while Azure extraction or a manual review is pending. */
export function OperatorHomeAzureExtractorEmptyState() {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-4 px-4 py-4"
      data-testid="operator-home-azure-extractor-empty-state"
    >
      <div className="flex items-start gap-3">
        <CloudUpload className="mt-0.5 h-8 w-8 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Import your Azure environment to get started
          </p>
          <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            ArchLucid analyzes your cloud configuration, maps architecture dependencies, and surfaces policy findings.
            Upload an extractor package or start a guided review — the dashboard fills in automatically when data arrives.
          </p>
        </div>
      </div>

      <GettingStartedSteps
        heading="Azure Extractor workflow"
        steps={[
          "Run the Tier 1 PowerShell extractor in your subscription (no credentials leave your tenant).",
          "Upload the generated ZIP from Settings → Azure Extractor or attach it when creating a review.",
          "Wait for ingestion to complete — committed runs, findings, and ROI summaries appear here.",
        ]}
        className="w-full"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="primary" size="sm" className="h-8">
          <Link href="/reviews/new">Create your first request</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/settings/tenant">Open Azure Extractor settings</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/onboarding">
            <FileSearch className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            First-review checklist
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
