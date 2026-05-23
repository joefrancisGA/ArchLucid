"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArtifactDownloadUrl } from "@/lib/api";
import { filterCommittedRunsForPicker } from "@/lib/committed-run-picker";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type SponsorDocxTarget = {
  readonly runId: string;
  readonly manifestId: string;
};

/**
 * Sponsor-ready quick links for executive reporting exports and ROI framing context.
 * Includes a direct sponsor DOCX download when a committed manifest exposes `architecture-review-board`.
 */
export function SponsorExportsSection() {
  const [sponsorDocx, setSponsorDocx] = useState<SponsorDocxTarget | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { items } = await loadProjectRunsMergedWithDemoFallback("default", { committedOnly: true });
      const committed = filterCommittedRunsForPicker(items);

      for (const run of committed) {
        const manifestId = run.goldenManifestId?.trim();

        if (manifestId === undefined || manifestId.length === 0) {
          continue;
        }

        try {
          const response = await fetch(
            `/api/proxy/v1/artifacts/manifests/${encodeURIComponent(manifestId)}/artifacts`,
            mergeRegistrationScopeForProxy({ method: "GET" }),
          );

          if (!response.ok) {
            continue;
          }

          const artifacts = (await response.json()) as Array<{ artifactId?: string }>;
          const hasBoard = artifacts.some(
            (row) => (row.artifactId ?? "").toLowerCase() === "architecture-review-board",
          );

          if (hasBoard && !cancelled) {
            setSponsorDocx({ runId: run.runId, manifestId });
            break;
          }
        } catch {
          // Try next committed run.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sponsor exports</CardTitle>
        <CardDescription className="text-xs">
          Open executive-ready views used in sponsor updates and pilot value readouts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="m-0 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
          {sponsorDocx !== null ? (
            <li>
              <a
                href={getArtifactDownloadUrl(sponsorDocx.manifestId, "architecture-review-board")}
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                data-testid="sponsor-exports-docx-download"
              >
                Download sponsor review (DOCX)
              </a>
              <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                Board-ready architecture review from your latest committed manifest.
              </p>
            </li>
          ) : null}
          <li>
            <Link
              href="/executive/scorecard"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Executive scorecard
            </Link>
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              Board-ready rollup of estimated savings and systemic issues.
            </p>
          </li>
          <li>
            <Link
              href="/value-report/pilot"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Pilot value report
            </Link>
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              Pilot-period narrative for sponsors evaluating ROI.
            </p>
          </li>
          <li>
            <Link
              href="/value-report/roi"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              ROI methodology help
            </Link>
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              How directional savings estimates are calculated.
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
