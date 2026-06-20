import Link from "next/link";

import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_HELP_EXECUTIVE_STEP_CTA } from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { inAppHelpHref, listProductDocumentationEntries } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

/**
 * Static, immediately-rendered product help (no fetch). Developer doc index is secondary in HelpDocsClient.
 */
export function HelpProductGuide() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-product-guide-heading">
      <h2
        id="help-product-guide-heading"
        className="m-0 text-sm font-semibold text-al-text-primary"
      >
        Using ArchLucid
      </h2>

      <Card className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base">Your first review package</CardTitle>
        </CardHeader>
        <CardContent className={cn(OPERATOR_LAYOUT.controlClusterGap, "text-sm text-neutral-800 dark:text-neutral-200")}>
          <ol className="m-0 list-decimal space-y-2 pl-5">
            <li>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={getShowcaseExecutiveHref()}>
                {BUYER_HELP_EXECUTIVE_STEP_CTA}
              </Link>{" "}
              — start with the business decision and monitored risks.
            </li>
            <li>
              Open the <strong>signed review record</strong> — the governed decision record for this review package.
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
        <Card className="border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Review packages</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-800 dark:text-neutral-200">
            Each review package consolidates outcomes, findings, evidence, governance approval, and audit history in one
            place.
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Signed review records</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-800 dark:text-neutral-200">
            The signed review record is the governed architecture decision record — versioned, hash-verified, and ready for
            export.
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Findings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-800 dark:text-neutral-200">
            Findings include severity, business impact, evidence citations, and recommended monitoring or remediation
            actions.
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Evidence and audit trail</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-800 dark:text-neutral-200">
            The evidence trail links artifacts, findings, and decisions. The audit trail records who acted and when for
            compliance review.
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_LAYOUT.controlClusterGap, "text-sm text-neutral-800 dark:text-neutral-200")}>
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

      <section aria-labelledby="help-in-app-topics" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h3 id="help-in-app-topics" className="m-0 text-sm font-semibold text-al-text-primary">
          In-app guides
        </h3>
        <ul className="m-0 grid gap-2 sm:grid-cols-2">
          {listProductDocumentationEntries().map((topic) => (
            <li key={topic.slug}>
              <Link
                href={inAppHelpHref(topic.slug)}
                className="block rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:border-teal-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-800"
              >
                <span className="font-medium text-teal-800 dark:text-teal-300">{topic.title}</span>
                <span className="mt-1 block text-neutral-600 dark:text-neutral-400">{topic.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
