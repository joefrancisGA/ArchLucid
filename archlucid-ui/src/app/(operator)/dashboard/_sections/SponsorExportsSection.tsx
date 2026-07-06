"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArtifactDownloadUrl } from "@/lib/api";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer-demo-content-gating";
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
export type SponsorExportsSectionProps = {
  readonly surface?: "operator" | "executive";
};

export function SponsorExportsSection({ surface = "operator" }: SponsorExportsSectionProps) {
  const executiveSurface = surface === "executive";
  const [sponsorDocx, setSponsorDocx] = useState<SponsorDocxTarget | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { items } = await loadProjectRunsMergedWithDemoFallback("default", {
        committedOnly: true,
        mergeDemoOnEmpty: isExplicitStaticDemoMarketingBuild(),
      });
      const committed = filterCommittedRunsForPicker(items);

      for (const run of committed) {
        try {
          const response = await fetch(
            `/api/proxy/v1/runs/${encodeURIComponent(run.runId)}/artifacts`,
            mergeRegistrationScopeForProxy({ method: "GET" }),
          );

          if (!response.ok) {
            continue;
          }

          const artifacts = (await response.json()) as Array<{ artifactId?: string; manifestId?: string | null }>;
          const hasBoard = artifacts.some(
            (row) => (row.artifactId ?? "").toLowerCase() === "architecture-review-board",
          );
          const manifestId = artifacts
            .map((row) => (row.manifestId ?? "").trim())
            .find((id) => id.length > 0);

          if (hasBoard && manifestId !== undefined && !cancelled) {
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
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle} data-testid="executive-exports-heading">
          {executiveSurface
            ? BUYER_EXECUTIVE_SUMMARY_VOCABULARY.executiveExportsTitle
            : "Sponsor exports"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className={cn("m-0 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {sponsorDocx !== null ? (
            <li>
              <a
                href={getArtifactDownloadUrl(sponsorDocx.manifestId, "architecture-review-board")}
                className={OPERATOR_LINK.inline}
                data-testid="sponsor-exports-docx-download"
              >
                {executiveSurface ? "Download executive review (DOCX)" : "Download sponsor review (DOCX)"}
              </a>
            </li>
          ) : null}
          <li>
            <Link
              href="/executive/scorecard"
              className={OPERATOR_LINK.inline}
            >
              Executive scorecard
            </Link>
          </li>
          <li>
            <Link
              href="/value-report/pilot"
              className={OPERATOR_LINK.inline}
            >
              Pilot value report
            </Link>
          </li>
          <li>
            <Link
              href="/value-report/roi"
              className={OPERATOR_LINK.inline}
            >
              ROI methodology help
            </Link>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
