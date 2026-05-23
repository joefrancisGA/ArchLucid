"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/lib/toast";
import { configureTier2Connection, listTier2Connections, Tier2ConnectionResponse } from "@/lib/api/cloud-connections-api";

export function CloudConnectionsPageClient() {
  const [connections, setConnections] = useState<Tier2ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadStartedRef = useRef(false);

  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [subscriptionIds, setSubscriptionIds] = useState("");

  useEffect(() => {
    if (loadStartedRef.current)
      return;

    loadStartedRef.current = true;

    async function load() {
      try {
        const data = await listTier2Connections();
        setConnections(data);
        setLoadError(null);
      } catch (err) {
        console.error(err);
        setLoadError("Could not load saved connections. Check your permissions and try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await configureTier2Connection({
        tenantId,
        clientId,
        subscriptionIds,
      });
      const refreshed = await listTier2Connections();
      setConnections(refreshed);
      setTenantId("");
      setClientId("");
      setSubscriptionIds("");
      showSuccess("Your Tier 2 continuous Azure ingestion setup has been saved.");
    } catch (err) {
      console.error(err);
      showError("Failed to save connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setupScript = `# Azure CLI script to set up Workload Identity Federation for ArchLucid

# 1. Set your target subscription or management group
TARGET_SCOPE="/subscriptions/YOUR_SUBSCRIPTION_ID"

# 2. Create a Service Principal
az ad sp create-for-rbac --name "ArchLucid-Tier2-Extractor" --role "Reader" --scopes $TARGET_SCOPE

# 3. Assign Cost Management Reader role
ASSIGNEE_OBJECT_ID=$(az ad sp list --display-name "ArchLucid-Tier2-Extractor" --query "[0].id" -o tsv)
az role assignment create --assignee $ASSIGNEE_OBJECT_ID --role "Cost Management Reader" --scope $TARGET_SCOPE

# 4. Configure Federated Identity Credential
APP_OBJECT_ID=$(az ad app list --display-name "ArchLucid-Tier2-Extractor" --query "[0].id" -o tsv)
az ad app permission admin-consent --id $APP_OBJECT_ID

# Replace with your ArchLucid OIDC issuer URL
ISSUER_URL="https://your-archlucid-instance.com"
SUBJECT="system:serviceaccount:archlucid:extractor"

az ad app federated-credential create --id $APP_OBJECT_ID --parameters "{
  \\"name\\": \\"ArchLucidFederation\\",
  \\"issuer\\": \\"$ISSUER_URL\\",
  \\"subject\\": \\"$SUBJECT\\",
  \\"description\\": \\"Allow ArchLucid to read Azure resources\\",
  \\"audiences\\": [\\"api://AzureADTokenExchange\\"]
}"
`;

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="cloud-connections-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Cloud connections</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Configure continuous ingestion from your cloud providers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Azure (Tier 2)</CardTitle>
          <CardDescription>
            Set up continuous Azure ingestion using Workload Identity Federation. Saved connections are stored in the hosted extractor configuration used by Tier 2 pull jobs — no client secrets are stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">1. Run Setup Script</h3>
            <p className="text-sm text-muted-foreground">
              Run this Azure CLI script to create a Service Principal with the required roles and configure federated identity credentials.
            </p>
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted text-xs overflow-x-auto">
                <code>{setupScript}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">2. Provide Connection Details</h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Azure Tenant ID</Label>
                <Input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (Application ID)</Label>
                <Input
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionIds">Subscription IDs (or Management Group IDs)</Label>
                <Textarea
                  id="subscriptionIds"
                  value={subscriptionIds}
                  onChange={(e) => setSubscriptionIds(e.target.value)}
                  placeholder="Comma-separated list of IDs"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Connection"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading saved connections…</p>
      ) : null}

      {!isLoading && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configured Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.connectionId} className="p-4 border rounded-md">
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
      )}
    </div>
  );
}
