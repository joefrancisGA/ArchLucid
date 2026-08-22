"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  formatCiBuildNumberLabel,
  formatShortCommitSha,
  readClientDeploymentFingerprint,
} from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readPublicBrowserApiBaseDefault } from "@/lib/legacy-arch-env";
import {
  isUiAuthorityThemeEvalEnabledEnv,
  resolveAuthorityThemeFromEnv,
} from "@/lib/ui-authority-theme";
import { cn } from "@/lib/utils";

const envDefaultTheme = resolveAuthorityThemeFromEnv(process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME);
const authorityThemeEvalEnabled = isUiAuthorityThemeEvalEnabledEnv();

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
              {formatCiBuildNumberLabel(fingerprint.ciBuildNumber) ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">UI commit</dt>
            <dd className={cn("m-0 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {formatShortCommitSha(fingerprint.frontendCommitSha)}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Environment</dt>
            <dd className="m-0 text-al-text-primary">{fingerprint.environment}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Build timestamp</dt>
            <dd className="m-0 text-al-text-primary">{fingerprint.buildTimestamp}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">API base URL</dt>
            <dd className={cn("m-0 break-all font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {apiBaseUrl.length > 0 ? apiBaseUrl : " — "}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-al-text-secondary">Authority theme</dt>
            <dd className="m-0 flex flex-wrap items-center gap-2 text-al-text-primary">
              <span data-testid="developer-settings-authority-theme-default">
                Build default: {envDefaultTheme}
              </span>
              <StatusTag
                kind={authorityThemeEvalEnabled ? "ready" : "neutral"}
                label={
                  authorityThemeEvalEnabled
                    ? "Shell theme toggle enabled"
                    : "Shell theme toggle off"
                }
                data-testid="developer-settings-authority-theme-eval-flag"
              />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
