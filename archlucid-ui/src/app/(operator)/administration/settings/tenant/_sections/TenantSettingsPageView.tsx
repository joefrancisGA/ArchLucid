"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { TenantLlmJudgeGuideCard } from "@/components/TenantLlmJudgeGuideCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { getIanaTimeZoneSelectOptions, normalizeIanaTimeZoneForSelect } from "@/lib/iana-time-zone-select";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";

import { TenantCostSettingsCard } from "./TenantCostSettingsCard";
import { TenantQualityGatesCard } from "./TenantQualityGatesCard";
import { TenantSettingsDigestEmailsInput } from "./TenantSettingsDigestEmailsInput";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

// 0 = Sunday … 6 = Saturday (JavaScript Date.getDay() convention)
const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";

  if (hour < 12) return `${hour}:00 AM`;

  if (hour === 12) return "12:00 PM";

  return `${hour - 12}:00 PM`;
}

const HOUR_OF_DAY_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: formatHour(i),
}));

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

type SectionHeadingProps = { readonly children: ReactNode };

function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className={cn("border-b border-neutral-200 pb-1 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
      {children}
    </h2>
  );
}

type Props = {
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsPageView(props: Props) {
  const m = props.model;
  const scope = getEffectiveBrowserProxyScopeHeaders();
  const ianaTimeZoneOptions = getIanaTimeZoneSelectOptions();

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="tenant-settings-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{OPERATOR_NAV_LINK_LABELS.settings}</h1>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          Workspace defaults and operator-facing preferences for this workspace.
        </p>
      </div>

      <SectionHeading>General</SectionHeading>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Tenant name</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-1", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
          <p className="m-0">Organization name is managed by your identity provider.</p>
          {m.currentPrincipalName != null ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Signed in as:{" "}
              <span className={cn(OPERATOR_TYPOGRAPHY.body, "font-medium text-al-text-primary")}>{m.currentPrincipalName}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Workspace scope</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Your active workspace and project are selected from the workspace switcher.
          </p>

          <CollapsibleSection title="Technical details — routing scope" defaultOpen={false}>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Internal browser-to-API routing carries scope identifiers on proxied requests. Values below reflect your
              current selection.
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href="/administration/settings/tenant/recycle-bin">
                Open projects recycle bin
              </Link>{" "}
              to review or restore soft-deleted architecture projects.
            </p>
            <ul className={cn("m-0 mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                Tenant: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-tenant-id"]}</span>
              </li>
              <li>
                Workspace: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-workspace-id"]}</span>
              </li>
              <li>
                Project: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-project-id"]}</span>
              </li>
            </ul>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Hosted deployments with more than one API instance should use a shared projection cache —{" "}
              <a
                className={OPERATOR_LINK.inline}
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

      {/* Only render when an active pilot/trial exists; hide the "None" / null state to reduce noise */}
      {m.trial != null && m.trial.status != null && m.trial.status !== "None" ? (
        <Card>
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Pilot / trial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium">Status:</span> {m.trial.status}
              {typeof m.trial.daysRemaining === "number" ? (
                <span>
                  {" "}
                  — <span className="font-medium">Days remaining:</span> {m.trial.daysRemaining}
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <SectionHeading>Business settings</SectionHeading>

      <TenantCostSettingsCard canEdit={m.canEditCostSettings} />

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Executive digest (email)</CardTitle>
        </CardHeader>
        <CardContent>
          {m.digestLoadFailure !== null ? (
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {m.digestLoadFailure}
            </p>
          ) : null}
          {m.digest == null || m.form == null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Preferences will load when the notification API is available.
            </p>
          ) : (
            <form onSubmit={(e) => void m.onSaveDigest(e)} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Email enabled</p>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Sends a weekly roll-up to the listed addresses (API-enforced on save).
                  </p>
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
                <div className="sm:col-span-2">
                  <Label htmlFor="tz">Time zone</Label>
                  <select
                    id="tz"
                    className={SELECT_CLASS}
                    value={normalizeIanaTimeZoneForSelect(m.form.ianaTimeZoneId)}
                    onChange={(e) => {
                      m.setForm((f) => (f === null ? f : { ...f, ianaTimeZoneId: e.target.value }));
                    }}
                    disabled={!m.canEditDigest}
                  >
                    {ianaTimeZoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="dow">Day of week</Label>
                  <select
                    id="dow"
                    className={SELECT_CLASS}
                    value={String(m.form.dayOfWeek)}
                    onChange={(e) => {
                      m.setForm((f) =>
                        f === null ? f : { ...f, dayOfWeek: Number.parseInt(e.target.value, 10) },
                      );
                    }}
                    disabled={!m.canEditDigest}
                  >
                    {DAY_OF_WEEK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="hour">Send time</Label>
                  <select
                    id="hour"
                    className={SELECT_CLASS}
                    value={String(m.form.hourOfDay)}
                    onChange={(e) => {
                      m.setForm((f) =>
                        f === null ? f : { ...f, hourOfDay: Number.parseInt(e.target.value, 10) },
                      );
                    }}
                    disabled={!m.canEditDigest}
                  >
                    {HOUR_OF_DAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {!m.canEditDigest ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Editing requires operator rank (Execute) on the API; your session is read-only for these controls.
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

      <SectionHeading>Support &amp; diagnostics</SectionHeading>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Support bundle</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Download a redacted diagnostics bundle to include with a support ticket.
          </p>
          <SupportBundleDownloadButton showDiagnosticsLink />
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Advanced — AI quality controls"
        defaultOpen={false}
        sectionTestId="tenant-advanced-section"
      >
        <p className={cn("mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Configure how strictly ArchLucid evaluates generated review output before it is accepted. These settings affect
          AI spend and review pipeline behaviour — leave at host defaults unless directed by support.
        </p>
        <div className="space-y-4">
          <TenantLlmJudgeGuideCard />
          <TenantQualityGatesCard />
        </div>
      </CollapsibleSection>
    </div>
  );
}
