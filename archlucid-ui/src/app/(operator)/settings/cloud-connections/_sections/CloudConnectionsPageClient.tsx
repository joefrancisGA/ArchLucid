"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTier2Connections, Tier2ConnectionResponse } from "@/lib/api/cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Cloud connections</h1>
        </div>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          Cloud connections are optional. They help ArchLucid use production-faithful evidence when available, but reviews
          can also be created from briefs, diagrams, documents, and uploaded evidence.
        </p>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-300">Tier 1 vs Tier 2 Evidence Collection</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 dark:text-blue-200 space-y-2 text-sm">
          <p>
            <strong>Tier 1 (Manual ZIP Upload) is the default.</strong> It requires zero vendor access to your cloud environment. You run an open-source PowerShell script locally and upload the resulting ZIP file during the architecture review creation process.
          </p>
          <p>
            <strong>Tier 2 (Hosted Automated Polling) is strictly opt-in.</strong> It allows ArchLucid to automatically pull architecture and cost data on a schedule. This requires you to provision a read-only Service Principal in your Azure tenant and establish a federated trust relationship. ArchLucid will never ask for or store client secrets.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="cloud-connections-available-heading">
        <h2
          id="cloud-connections-available-heading"
          className={OPERATOR_TYPOGRAPHY.sectionTitle}
        >
          Available connections
        </h2>

        <Card data-testid="cloud-connections-available-azure">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Connect Azure</CardTitle>
              <span className={cn("rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge, "font-semibold text-al-text-secondary")}>
                Evidence tier: Cloud-connected
              </span>
            </div>
            <CardDescription>
              Use workload identity federation to connect selected Azure subscriptions with read-only access. ArchLucid
              stores connection metadata only; no client secrets are stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tier2ConnectionWizard onSaved={handleSaved} />
          </CardContent>
        </Card>
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
