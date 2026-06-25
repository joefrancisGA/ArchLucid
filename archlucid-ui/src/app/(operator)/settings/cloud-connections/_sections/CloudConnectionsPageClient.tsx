"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTier2Connections, Tier2ConnectionResponse } from "@/lib/api/cloud-connections-api";

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
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Cloud connections</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Cloud connections are optional. They help ArchLucid use production-faithful evidence when available, but reviews
          can also be created from briefs, diagrams, documents, and uploaded evidence.
        </p>
      </div>

      <section className="space-y-4" aria-labelledby="cloud-connections-available-heading">
        <h2
          id="cloud-connections-available-heading"
          className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Available connections
        </h2>

        <Card data-testid="cloud-connections-available-azure">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Connect Azure</CardTitle>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
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
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading saved connections…</p>
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
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
