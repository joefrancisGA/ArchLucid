"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AWS_CLOUD_CONNECTIONS_ADMIN_LABEL,
  AWS_CLOUD_CONNECTIONS_ADMIN_SUMMARY,
} from "@/lib/aws-cloud-connection-admin-scope";
import { cn } from "@/lib/utils";

export function AdminAwsCloudConnectionsPageClient(): React.ReactElement {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="admin-aws-cloud-connections-page">
      <header className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{AWS_CLOUD_CONNECTIONS_ADMIN_LABEL}</h1>
          <StatusTag kind="neutral" label="System admin only" />
        </div>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.meta}`}>{AWS_CLOUD_CONNECTIONS_ADMIN_SUMMARY}</p>
      </header>

      <Card data-testid="admin-aws-cloud-connections-scope">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>V1 scope</CardTitle>
          <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
            AWS connectors ship in V1 for internal rollout. Customer-facing{" "}
            <Link href="/settings/cloud-connections" className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
              Cloud connections
            </Link>{" "}
            remains Azure-only. GCP continuous ingestion stays on the V1.1 roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Target posture mirrors Azure Tier 2: read-only inventory and cost evidence via cross-account IAM — no
            long-lived secrets stored in ArchLucid.
          </p>
          <p className="m-0">
            Configuration wizard, hosted validation pull, and persistence ship under engineering backlog{" "}
            <span className="font-medium">TB-403</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
