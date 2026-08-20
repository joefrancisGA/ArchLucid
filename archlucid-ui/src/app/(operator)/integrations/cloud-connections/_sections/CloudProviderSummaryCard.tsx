import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/StatusTag";
import {
  CLOUD_CONNECTIONS_PROVIDER_AUTH_MODEL,
  CLOUD_CONNECTIONS_PROVIDER_NOT_CONNECTED,
} from "@/lib/cloud-connections-copy";
import { cloudProviderDetailPath } from "@/lib/cloud-connections-paths";
import type { CloudProviderId } from "@/lib/cloud-platform-scope-storage";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { isCloudProviderSummaryConfigured } from "./is-cloud-provider-summary-configured";
import { resolveCloudProviderSummaryPrimaryCtaLabel } from "./resolve-cloud-provider-summary-primary-cta-label";

export type CloudProviderSummaryCardProps = {
  readonly provider: CloudProviderId;
  readonly status: string;
  readonly lastValidation: string;
  readonly evidenceCollected: string;
  readonly maturityLabel?: string | null;
};

const PROVIDER_TITLES: Readonly<Record<CloudProviderId, string>> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

const PROVIDER_OVERVIEW: Readonly<Record<CloudProviderId, string>> = {
  azure: "Read-only subscription inventory and cost metadata through federated service principal access.",
  aws: "Read-only Resource Explorer inventory through a federated IAM role.",
  gcp: "Read-only Cloud Asset Inventory through Workload Identity Federation.",
};

export function CloudProviderSummaryCard(props: CloudProviderSummaryCardProps) {
  const { provider, status, lastValidation, evidenceCollected, maturityLabel } = props;
  const detailHref = cloudProviderDetailPath(provider);
  const configured = isCloudProviderSummaryConfigured(status);
  const primaryCtaLabel = resolveCloudProviderSummaryPrimaryCtaLabel(status);

  return (
    <Card data-testid={`cloud-connection-card-${provider}`} className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {PROVIDER_TITLES[provider]}
          {maturityLabel !== null && maturityLabel !== undefined && maturityLabel.length > 0 ? (
            <span
              className={cn(
                "ms-2 align-middle font-medium uppercase tracking-wide text-al-text-secondary",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {maturityLabel}
            </span>
          ) : null}
        </CardTitle>
        <CardDescription>{PROVIDER_OVERVIEW[provider]}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pt-0">
        {configured ? (
          <dl className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>
            <div className="flex justify-between gap-2">
              <dt className="text-al-text-secondary">Status</dt>
              <dd className="text-right font-medium">{status}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-al-text-secondary">Authentication model</dt>
              <dd className="max-w-[14rem] text-right font-medium">
                {CLOUD_CONNECTIONS_PROVIDER_AUTH_MODEL[provider]}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-al-text-secondary">Last validation</dt>
              <dd className="text-right font-medium">{lastValidation}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-al-text-secondary">Evidence collected</dt>
              <dd className="max-w-[14rem] text-right font-medium">{evidenceCollected}</dd>
            </div>
          </dl>
        ) : (
          <StatusTag
            kind="neutral"
            label={CLOUD_CONNECTIONS_PROVIDER_NOT_CONNECTED}
            data-testid={`cloud-connection-card-${provider}-not-connected`}
          />
        )}
      </CardContent>
      <CardFooter className="mt-auto border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <Button
          type="button"
          variant={configured ? "primary" : "outline"}
          className={CTA_WIDTH.content}
          asChild
          data-testid={`cloud-connection-card-${provider}-primary-cta`}
        >
          <Link href={detailHref}>{primaryCtaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
