"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ContextualHelp } from "@/components/ContextualHelp";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";

import { TenantSettingsDigestEmailsInput } from "./TenantSettingsDigestEmailsInput";
import { TenantCostSettingsCard } from "./TenantCostSettingsCard";
import { TenantQualityGatesCard } from "./TenantQualityGatesCard";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type Props = {
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsPageView(props: Props) {
  const m = props.model;
  const scope = getEffectiveBrowserProxyScopeHeaders();

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="tenant-settings-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Tenant settings</h1>
          <ContextualHelp helpKey="tenant-settings-page" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Workspace defaults and operator-facing preferences for this tenant. Infrastructure and feature-flag controls stay server-side
          only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant name</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
            Friendly organization display name is shown from your identity provider. Signed-in name:{" "}
            <span className="font-medium">{m.currentPrincipalName ?? "—"}</span>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request scope (workspace / project)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
          <p className="m-0">
            Active workspace and project come from the scope control on{" "}
            <Link className="text-teal-800 underline dark:text-teal-300" href="/">
              home
            </Link>
            . Change scope there to update what this session targets.
          </p>

            <CollapsibleSection title="Technical details — routing scope" defaultOpen={false}>
            <p className="m-0 text-sm">
              Internal browser-to-API routing carries scope identifiers on proxied requests. Values below reflect your current selection.
            </p>
            <p className="m-0 mt-2 text-sm">
              <Link className="text-teal-800 underline dark:text-teal-300" href="/settings/tenant/recycle-bin">
                Open projects recycle bin
              </Link>{" "}
              to review or restore soft-deleted architecture projects.
            </p>
            <ul className="m-0 mt-2 list-inside list-disc">
              <li>
                Tenant: <span className="font-mono text-xs">{scope["x-tenant-id"]}</span>
              </li>
              <li>
                Workspace: <span className="font-mono text-xs">{scope["x-workspace-id"]}</span>
              </li>
              <li>
                Project: <span className="font-mono text-xs">{scope["x-project-id"]}</span>
              </li>
            </ul>
            <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Hosted deployments with more than one API instance should use a shared projection cache —{" "}
              <a
                className="text-teal-800 underline dark:text-teal-300"
                href={toDocsBlobUrl("/docs/operations/PROJECTION_CACHE_AND_REPLICAS.md")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about projection cache and replicas
              </a>
              .
            </p>
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilot / trial</CardTitle>
        </CardHeader>
        <CardContent>
          {m.trial == null ? (
            <p className="m-0 text-sm text-neutral-500">Could not load trial status.</p>
          ) : (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="font-medium">Status:</span> {m.trial.status ?? "—"}
              {typeof m.trial.daysRemaining === "number" ? (
                <span>
                  {" "}
                  — <span className="font-medium">Days remaining:</span> {m.trial.daysRemaining}
                </span>
              ) : null}
            </p>
          )}
        </CardContent>
      </Card>

      <TenantCostSettingsCard canEdit={m.canEditCostSettings} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive digest (email)</CardTitle>
        </CardHeader>
        <CardContent>
          {m.digestLoadFailure !== null ? (
            <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert">
              {m.digestLoadFailure}
            </p>
          ) : null}
          {m.digest == null || m.form == null ? (
            <p className="m-0 text-sm text-neutral-500">Preferences will load when the notification API is available.</p>
          ) : (
            <form onSubmit={(e) => void m.onSaveDigest(e)} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-100">Email enabled</p>
                  <p className="m-0 text-xs text-neutral-500">Sends a weekly roll-up to the listed addresses (API-enforced on save).</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded border border-neutral-300 text-teal-800 focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
                    checked={m.form.emailEnabled}
                    onChange={(e) => {
                      m.setForm((f) => (f === null ? f : { ...f, emailEnabled: e.target.checked }));
                    }}
                    disabled={!m.canEditDigest}
                    aria-label="Email enabled"
                  />
                </label>
              </div>
              <div>
                <Label htmlFor="digest-emails">Recipient emails (one per line or comma-separated)</Label>
                <TenantSettingsDigestEmailsInput
                  id="digest-emails"
                  value={m.form.recipientEmails}
                  onChange={(emails) => {
                    m.setForm((f) => (f === null ? f : { ...f, recipientEmails: emails }));
                  }}
                  readOnly={!m.canEditDigest}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tz">IANA time zone</Label>
                  <Input
                    id="tz"
                    name="ianaTimeZoneId"
                    value={m.form.ianaTimeZoneId}
                    onChange={(ev) => {
                      m.setForm((f) => (f === null ? f : { ...f, ianaTimeZoneId: ev.target.value }));
                    }}
                    readOnly={!m.canEditDigest}
                  />
                </div>
                <div>
                  <Label htmlFor="dow">Day of week (0–6)</Label>
                  <Input
                    id="dow"
                    inputMode="numeric"
                    value={String(m.form.dayOfWeek)}
                    onChange={(ev) => {
                      m.setForm((f) => (f === null ? f : { ...f, dayOfWeek: Number.parseInt(ev.target.value, 10) || 0 }));
                    }}
                    readOnly={!m.canEditDigest}
                  />
                </div>
                <div>
                  <Label htmlFor="hour">Hour of day (0–23)</Label>
                  <Input
                    id="hour"
                    inputMode="numeric"
                    value={String(m.form.hourOfDay)}
                    onChange={(ev) => {
                      m.setForm((f) => (f === null ? f : { ...f, hourOfDay: Number.parseInt(ev.target.value, 10) || 0 }));
                    }}
                    readOnly={!m.canEditDigest}
                  />
                </div>
              </div>
              {!m.canEditDigest ? (
                <p className="m-0 text-xs text-neutral-500">
                  Editing requires operator rank (Execute) on the API; your session is read-only in the UI for these controls.
                </p>
              ) : null}
              <div>
                <Button type="submit" disabled={!m.canEditDigest || m.saving} data-testid="tenant-digest-save">
                  {m.saving ? "Saving…" : "Save notification preferences"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Support bundle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
          <p className="m-0">Download a redacted diagnostics ZIP when opening a support ticket.</p>
          <SupportBundleDownloadButton />
        </CardContent>
      </Card>

      <TenantQualityGatesCard />
    </div>
  );
}
