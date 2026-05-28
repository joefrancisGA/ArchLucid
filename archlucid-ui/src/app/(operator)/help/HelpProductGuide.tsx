import Link from "next/link";

import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_HOME_PRIMARY_CTA } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

/**
 * Static, immediately-rendered product help (no fetch). Developer doc index is secondary in HelpDocsClient.
 */
export function HelpProductGuide() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="space-y-4" aria-labelledby="help-product-guide-heading">
      <h2
        id="help-product-guide-heading"
        className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100"
      >
        Using ArchLucid
      </h2>

      <Card className="border-2 border-teal-200/90 bg-teal-50/40 dark:border-teal-900/60 dark:bg-teal-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your first review package</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-neutral-800 dark:text-neutral-200">
          <ol className="m-0 list-decimal space-y-1.5 pl-5">
            <li>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={getShowcaseExecutiveHref()}>
                {BUYER_HOME_PRIMARY_CTA}
              </Link>{" "}
              — start with the business decision and monitored risks.
            </li>
            <li>
              Open the <strong>signed manifest</strong> — the governed decision record for this review package.
            </li>
            <li>
              Follow the <strong>evidence trail</strong> to see how findings tie to decisions and artifacts.
            </li>
            <li>
              Review <strong>governance approval</strong> and the <strong>audit trail</strong> for accountability.
            </li>
            <li>
              Use{" "}
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/ask">
                Ask
              </Link>{" "}
              for evidence-backed questions in the context of the active review package.
            </li>
          </ol>
        </CardContent>
      </Card>

      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        ArchLucid turns an architecture review into a governed package: decisions, findings, artifacts, and an evidence
        trail you can export for diligence.
      </p>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Review packages</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            Each review package consolidates outcomes, findings, evidence, governance approval, and audit history in one
            place.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Signed manifests</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            The signed manifest is the governed architecture decision record — versioned, hash-verified, and ready for
            export.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Findings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            Findings include severity, business impact, evidence citations, and recommended monitoring or remediation
            actions.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evidence and audit trail</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            The evidence trail links artifacts, findings, and decisions. The audit trail records who acted and when for
            compliance review.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            <p className="m-0">
              If a page fails to load, refresh once; for sign-in issues, return to{" "}
              <Link className="text-teal-700 underline dark:text-teal-300" href="/auth/signin">
                Sign in
              </Link>
              .
            </p>
            {!buyerPolishedShell ? <SupportBundleDownloadButton /> : null}
          </CardContent>
        </Card>
      </div>

      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        <strong>Start here:</strong> open the{" "}
        <Link className="text-teal-700 underline dark:text-teal-300" href={getShowcaseExecutiveHref()}>
          executive summary
        </Link>{" "}
        or browse{" "}
        <Link className="text-teal-700 underline dark:text-teal-300" href="/reviews?projectId=default">
          review packages
        </Link>{" "}
        to explore the Claims Intake Modernization Review.
      </p>
    </div>
  );
}
