import { cn } from "@/lib/utils";

import {
  API_KEYS_SUMMARY_ACCESS_LABEL,
  API_KEYS_SUMMARY_ADMIN_KEYS_LABEL,
  API_KEYS_SUMMARY_LAST_ROTATION_LABEL,
  API_KEYS_SUMMARY_LAST_USED_LABEL,
  API_KEYS_SUMMARY_READONLY_KEYS_LABEL,
  API_KEYS_ACCESS_DISABLED_LABEL,
  API_KEYS_ACCESS_ENABLED_LABEL,
} from "@/lib/api-keys-settings-copy";
import type { ApiKeysSummaryMetrics } from "@/lib/api-keys-settings-types";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";

export type ApiKeysSettingsSummaryRowProps = {
  readonly summary: ApiKeysSummaryMetrics;
  readonly loading: boolean;
};

function SummaryMetric(props: { readonly label: string; readonly value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.value}
      </p>
    </div>
  );
}

function formatOptionalTimestamp(value: string | null, loading: boolean): string {
  if (loading) {
    return "…";
  }

  if (value === null) {
    return "—";
  }

  return formatRelativeTime(value);
}

export function ApiKeysSettingsSummaryRow(props: ApiKeysSettingsSummaryRowProps): React.JSX.Element {
  const { summary, loading } = props;
  const countValue = (value: number): string => (loading ? "…" : finiteIntegerCountDisplay(value));
  const accessLabel = summary.accessEnabled ? API_KEYS_ACCESS_ENABLED_LABEL : API_KEYS_ACCESS_DISABLED_LABEL;

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      data-testid="api-keys-summary-row"
      aria-label="API key summary"
    >
      <SummaryMetric label={API_KEYS_SUMMARY_ACCESS_LABEL} value={loading ? "…" : accessLabel} />
      <SummaryMetric label={API_KEYS_SUMMARY_ADMIN_KEYS_LABEL} value={countValue(summary.activeAdminKeys)} />
      <SummaryMetric label={API_KEYS_SUMMARY_READONLY_KEYS_LABEL} value={countValue(summary.activeReadOnlyKeys)} />
      <SummaryMetric
        label={API_KEYS_SUMMARY_LAST_ROTATION_LABEL}
        value={formatOptionalTimestamp(summary.lastRotationUtc, loading)}
      />
      <SummaryMetric
        label={API_KEYS_SUMMARY_LAST_USED_LABEL}
        value={formatOptionalTimestamp(summary.lastUsedUtc, loading)}
      />
    </section>
  );
}
