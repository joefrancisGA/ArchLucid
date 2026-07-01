"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTier2Connections, Tier2ConnectionResponse } from "@/lib/api/cloud-connections-api";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PAGE_COPY, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { AwsConnectionSection } from "./AwsConnectionSection";
import { GcpConnectionSection } from "./GcpConnectionSection";
import { Tier2ConnectionWizard } from "./Tier2ConnectionWizard";

export function CloudConnectionsPageClient() {
  const [connections, setConnections] = useState<Tier2ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

  const refreshConnections = useCallback(async () => {
    const data = await listTier2Connections();
    setConnections(data);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (loadStartedRef.current) {
      return;
    }

    loadStartedRef.current = true;

    async function load() {
      try {
        await refreshConnections();
      } catch (err) {
        console.error(err);
        setLoadError("Could not load saved connections. Check your permissions and try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [refreshConnections]);

  const handleSaved = useCallback(async () => {
    try {
      await refreshConnections();
    } catch (err) {
      console.error(err);
      setLoadError("Connection saved, but the list could not be refreshed.");
    }
  }, [refreshConnections]);

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="cloud-connections-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{OPERATOR_NAV_LINK_LABELS.cloudConnections}</h1>
        </div>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {CLOUD_CONNECTIONS_PAGE_COPY.lead}
        </p>
      </div>

      <div className={cn(DESIGN_TOKENS.callout.info, "space-y-2")}>
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>How evidence collection works</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <strong>Manual upload (default).</strong> No vendor access required. You run an open-source PowerShell script locally and upload the resulting ZIP file when creating an architecture review.
        </p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <strong>Automated Azure connection (optional).</strong> ArchLucid pulls architecture and cost data on a schedule using a read-only Service Principal you provision in Azure. Requires workload identity federation — no client secrets are stored.
        </p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <strong>Automated AWS connection (optional).</strong> ArchLucid polls AWS Resource Explorer on a schedule using a read-only IAM role that trusts ArchLucid&apos;s Azure managed identity via OIDC — no long-lived access keys are stored.
        </p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <strong>Automated GCP connection (optional).</strong> ArchLucid polls Cloud Asset Inventory on a schedule using GCP Workload Identity Federation bound to ArchLucid&apos;s Azure managed identity — no service-account JSON keys are stored.
        </p>
      </div>

      <section className="space-y-4" aria-labelledby="cloud-connections-available-heading">
        <h2
          id="cloud-connections-available-heading"
          className={OPERATOR_TYPOGRAPHY.sectionTitle}
        >
          {CLOUD_CONNECTIONS_PAGE_COPY.azureSectionHeading}
        </h2>

        <Card data-testid="cloud-connections-available-azure">
          <CardHeader>
            <CardTitle>Connect Azure</CardTitle>
            <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
              Use workload identity federation to connect selected Azure subscriptions with read-only access. ArchLucid
              stores connection metadata only; no client secrets are stored.
            </p>
          </CardHeader>
          <CardContent>
            <Tier2ConnectionWizard onSaved={handleSaved} />
          </CardContent>
        </Card>

        <AwsConnectionSection />

        <GcpConnectionSection />
      </section>

      {loadError ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading saved connections…</p>
      ) : null}

      {!isLoading && connections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Configured Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.connectionId} className="rounded-md border p-4">
                  <div className={cn("grid grid-cols-2 gap-2", OPERATOR_TYPOGRAPHY.body)}>
                    <div className="text-muted-foreground">Tenant ID:</div>
                    <div>{conn.tenantId}</div>
                    <div className="text-muted-foreground">Client ID:</div>
                    <div>{conn.clientId}</div>
                    <div className="text-muted-foreground">Scopes:</div>
                    <div>{conn.subscriptionIds}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
