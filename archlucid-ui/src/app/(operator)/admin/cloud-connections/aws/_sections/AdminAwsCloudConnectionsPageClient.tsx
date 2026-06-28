"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AWS_CLOUD_CONNECTIONS_ADMIN_LABEL,
  AWS_CLOUD_CONNECTIONS_ADMIN_SUMMARY,
} from "@/lib/aws-cloud-connection-admin-scope";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AdminAwsCloudConnectionsPageClient(): React.ReactElement {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="admin-aws-cloud-connections-page">
      <header className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{AWS_CLOUD_CONNECTIONS_ADMIN_LABEL}</h1>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.meta}`}>{AWS_CLOUD_CONNECTIONS_ADMIN_SUMMARY}</p>
      </header>

      <Card data-testid="admin-aws-cloud-connections-scope">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Customer vs admin surfaces</CardTitle>
          <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
            Operators connect AWS, Azure, and GCP from{" "}
            <Link href={CLOUD_CONNECTIONS_PATH} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
              {OPERATOR_NAV_LINK_LABELS.cloudConnections}
            </Link>
            . This admin page remains for internal rollout diagnostics and hosted-prod Terraform verification.
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Target posture mirrors Azure Tier 2: read-only inventory via cross-account IAM OIDC trust to
            ArchLucid&apos;s Azure managed identity — no long-lived access keys stored in ArchLucid.
          </p>
          <p className="m-0">
            Enable hosted AWS polling in production via{" "}
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">HostedAwsExtractor:Enabled</code> and{" "}
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">CloudPolling:Aws:Enabled</code>{" "}
            (see <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">deploy/hosted-prod-terraform</code>{" "}
            extractor modules).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
