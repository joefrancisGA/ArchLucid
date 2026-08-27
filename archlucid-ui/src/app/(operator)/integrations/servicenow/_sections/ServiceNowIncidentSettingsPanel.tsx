"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  SERVICENOW_CMDB_AUTO_CREATE_HELPER,
  SERVICENOW_CMDB_AUTO_CREATE_LABEL,
  SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_SUMMARY,
  SERVICENOW_INCIDENT_SETTINGS_LEAD,
  SERVICENOW_INCIDENT_SETTINGS_TITLE,
  SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD,
  SERVICENOW_MUTATION_DISABLED_HELPER,
  SERVICENOW_RELOAD_BUTTON,
  SERVICENOW_SAVE_PENDING,
  SERVICENOW_SAVE_SETTINGS_BUTTON,
} from "@/lib/servicenow-integration-page-copy";
import type { TenantItsmOutboundSettingsResponse } from "@/lib/api/itsm-outbound-api";
import type { resolveServiceNowPageComposition } from "@/lib/servicenow-integration-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ServiceNowIncidentSettingsPanelProps = {
  readonly pageComposition: ReturnType<typeof resolveServiceNowPageComposition>;
  readonly canMutate: boolean;
  readonly incidentSettingsEditable: boolean;
  readonly settingsLoadFailed: boolean;
  readonly settings: TenantItsmOutboundSettingsResponse | null;
  readonly snowAutoCmdb: boolean;
  readonly onSnowAutoCmdbChange: (checked: boolean) => void;
  readonly saveError: string | null;
  readonly saveSuccess: string | null;
  readonly isSaving: boolean;
  readonly isTesting: boolean;
  readonly onSaveSettings: () => void;
  readonly onRefresh: () => void;
};

export function ServiceNowIncidentSettingsPanel({
  pageComposition,
  canMutate,
  incidentSettingsEditable,
  settingsLoadFailed,
  settings,
  snowAutoCmdb,
  onSnowAutoCmdbChange,
  saveError,
  saveSuccess,
  isSaving,
  isTesting,
  onSaveSettings,
  onRefresh,
}: ServiceNowIncidentSettingsPanelProps): React.ReactElement | null {
  if (pageComposition.incidentSettingsCollapsed) {
    return (
      <details
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="servicenow-incident-settings-collapsed"
      >
        <summary
          className={cn(
            "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}
        >
          {SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_SUMMARY}
        </summary>
        <div className="mt-3 space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD}
          </p>
        </div>
      </details>
    );
  }

  return (
    <section
      aria-labelledby="servicenow-incident-settings-heading"
      className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
      data-testid="servicenow-incident-settings"
    >
      <div>
        <h2 id="servicenow-incident-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {SERVICENOW_INCIDENT_SETTINGS_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SERVICENOW_INCIDENT_SETTINGS_LEAD}
        </p>
      </div>

      {saveError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="m-0 text-al-text-secondary dark:text-neutral-200" role="status">
          {saveSuccess}
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="snow-auto-cmdb"
            checked={snowAutoCmdb}
            onCheckedChange={(checked) => onSnowAutoCmdbChange(checked === true)}
            disabled={isSaving || !incidentSettingsEditable}
            aria-describedby="snow-auto-cmdb-helper"
          />
          <div className="space-y-1">
            <Label htmlFor="snow-auto-cmdb">{SERVICENOW_CMDB_AUTO_CREATE_LABEL}</Label>
            <p id="snow-auto-cmdb-helper" className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {SERVICENOW_CMDB_AUTO_CREATE_HELPER}
            </p>
          </div>
        </div>
      </div>

      {settingsLoadFailed ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Incident creation settings could not be loaded. Reload the page before changing them.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onSaveSettings}
          disabled={isSaving || !incidentSettingsEditable}
          title={
            !canMutate
              ? enterpriseMutationControlDisabledTitle
              : settingsLoadFailed || settings === null
                ? "Reload incident creation settings before saving."
                : undefined
          }
        >
          {isSaving ? SERVICENOW_SAVE_PENDING : SERVICENOW_SAVE_SETTINGS_BUTTON}
        </Button>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isSaving || isTesting}>
          {SERVICENOW_RELOAD_BUTTON}
        </Button>
      </div>

      {!canMutate ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SERVICENOW_MUTATION_DISABLED_HELPER}</p>
      ) : null}
    </section>
  );
}
