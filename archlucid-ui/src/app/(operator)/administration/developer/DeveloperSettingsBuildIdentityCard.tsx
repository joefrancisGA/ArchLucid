"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCiBuildNumberLabel,
  formatShortCommitSha,
  isKnownFingerprintValue,
  readClientDeploymentFingerprint,
} from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readPublicBrowserApiBaseDefault } from "@/lib/legacy-arch-env";
import { cn } from "@/lib/utils";

const DEVELOPER_SETTINGS_FINGERPRINT_UNAVAILABLE = "Not set in this build" as const;

function formatDeveloperFingerprintValue(value: string): string {
  if (!isKnownFingerprintValue(value)) {
    return DEVELOPER_SETTINGS_FINGERPRINT_UNAVAILABLE;
  }

  return value;
}

/** Build and environment facts for internal developer diagnostics (SDX-P0-6). */
export function DeveloperSettingsBuildIdentityCard(): React.JSX.Element {
  const fingerprint = readClientDeploymentFingerprint();
  const apiBaseUrl = readPublicBrowserApiBaseDefault().trim().replace(/\/$/, "");

  return (
    <Card data-testid="developer-settings-build-identity-card">
      <CardHeader>
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Build and environment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl
          className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
          data-testid="developer-settings-build-identity"
        >
          <div>
            <dt className="text-al-text-secondary">CI build</dt>
            <dd className={cn("m-0 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {formatCiBuildNumberLabel(fingerprint.ciBuildNumber) ?? DEVELOPER_SETTINGS_FINGERPRINT_UNAVAILABLE}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">UI commit</dt>
            <dd className={cn("m-0 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {isKnownFingerprintValue(fingerprint.frontendCommitSha)
                ? formatShortCommitSha(fingerprint.frontendCommitSha)
                : DEVELOPER_SETTINGS_FINGERPRINT_UNAVAILABLE}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Environment</dt>
            <dd className="m-0 text-al-text-primary">{formatDeveloperFingerprintValue(fingerprint.environment)}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Build timestamp</dt>
            <dd className="m-0 text-al-text-primary">
              {formatDeveloperFingerprintValue(fingerprint.buildTimestamp)}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">API base URL</dt>
            <dd className={cn("m-0 break-all font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {apiBaseUrl.length > 0 ? apiBaseUrl : DEVELOPER_SETTINGS_FINGERPRINT_UNAVAILABLE}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
