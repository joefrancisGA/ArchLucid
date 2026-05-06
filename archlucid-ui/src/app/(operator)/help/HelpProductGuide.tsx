import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Static, immediately-rendered product help (no fetch). Developer doc index is secondary in HelpDocsClient.
 */
export function HelpProductGuide() {
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
          <CardTitle className="text-base">Golden path (first walkthrough)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-neutral-800 dark:text-neutral-200">
          <ol className="m-0 list-decimal space-y-1.5 pl-5">
            <li>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/reviews/new">
                New review
              </Link>{" "}
              — submit the brief and let the pipeline run.
            </li>
            <li>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
                Reviews
              </Link>{" "}
              — pick the review you care about.
            </li>
            <li>
              Open the{" "}
              <strong>manifest</strong> from review detail — that is the governed architecture record and artifact bundle.
            </li>
            <li>
              Review a <strong>finding</strong>, then use{" "}
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/ask">
                Ask
              </Link>{" "}
              for sponsor-ready Q&amp;A in context.
            </li>
            <li>
              When your tenant uses promotions, follow{" "}
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/governance">
                Governance
              </Link>{" "}
              for submit → approve → promote.
            </li>
          </ol>
        </CardContent>
      </Card>

      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        ArchLucid turns a review request into a governed package: decisions, findings, artifacts, and an evidence trail
        you can export.
      </p>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">First request</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            Use{" "}
            <Link className="text-teal-700 underline dark:text-teal-300" href="/reviews/new">
              New review
            </Link>{" "}
            to describe your system and start the pipeline. You can use an industry starter or a blank brief.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reviews and packages</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            Each submission becomes an <strong>architecture review</strong>. Track it on review detail until the manifest
            is ready to finalize.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Finalized manifests</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            After you <strong>finalize</strong>, the review has a versioned, reviewed <strong>manifest</strong>{" "}
            (architecture record). Open it from the review or the manifests list.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Findings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            Issues and recommendations are surfaced with severity, rationale, and suggested actions. Resolve or accept
            them in context on the review or governance views.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Artifacts and review trail</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            Generated outputs and the <strong>review trail</strong> show what was produced and how decisions were
            recorded.
          </CardContent>
        </Card>

        <Card className="border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-neutral-800 dark:text-neutral-200">
            If a page fails to load, refresh once; for sign-in issues, return to{" "}
            <Link className="text-teal-700 underline dark:text-teal-300" href="/auth/signin">
              Sign in
            </Link>
            .
          </CardContent>
        </Card>
      </div>

      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        <strong>What to do next:</strong> open{" "}
        <Link className="text-teal-700 underline dark:text-teal-300" href="/reviews/new">
          New review
        </Link>{" "}
        or your{" "}
        <Link className="text-teal-700 underline dark:text-teal-300" href="/reviews?projectId=default">
          Reviews
        </Link>{" "}
        list to continue.
      </p>
    </div>
  );
}
