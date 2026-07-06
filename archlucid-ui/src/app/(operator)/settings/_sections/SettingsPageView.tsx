"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { ColorModeSegmentedControl } from "@/components/ColorModeSegmentedControl";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

export function SettingsPageView() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const showWorkspaceLinks = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const showSupportBundle = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const showDeveloperTools = isArchLucidInternalOperatorShellEnv();

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="settings-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Settings</h1>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Manage how ArchLucid looks in this browser and find help for your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Choose how ArchLucid appears in this browser.
          </p>
          <div className="space-y-2">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Color mode
            </p>
            <ColorModeSegmentedControl />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Help</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">Browse product guides, troubleshooting steps, and common workflows.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/help">{OPERATOR_NAV_LINK_LABELS.help}</Link>
          </Button>
        </CardContent>
      </Card>

      {showWorkspaceLinks ? (
        <Card data-testid="settings-workspace-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Workspace &amp; administration</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">Workspace defaults, billing, users, and procurement materials.</p>
            <ul className="m-0 list-none space-y-2 p-0">
              <li>
                <Link className={OPERATOR_LINK.nav} href="/settings/tenant">
                  {OPERATOR_NAV_LINK_LABELS.workspaceSettings}
                </Link>
              </li>
              {callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority ? (
                <li>
                  <Link className={OPERATOR_LINK.nav} href="/settings/users">
                    Users &amp; roles
                  </Link>
                </li>
              ) : null}
              <li>
                <Link className={OPERATOR_LINK.nav} href={SETTINGS_SECURITY_TRUST_PATH}>
                  {OPERATOR_NAV_LINK_LABELS.securityTrust}
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="settings-security-trust-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{OPERATOR_NAV_LINK_LABELS.securityTrust}</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">Share procurement-ready materials, trust-center links, and assessment status.</p>
            <Button asChild variant="outline" size="sm">
              <Link href={SETTINGS_SECURITY_TRUST_PATH}>Open security &amp; trust</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {showSupportBundle ? (
        <Card data-testid="settings-support-bundle-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Support bundle</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              Download a redacted diagnostics bundle to include with a support ticket.
            </p>
            <SupportBundleDownloadButton showDiagnosticsLink />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              The bundle is redacted before download. Review it before sending if your organization requires approval.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {showDeveloperTools ? (
        <Card data-testid="settings-developer-tools-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Developer tools</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">Internal tools for local demos, diagnostics, and support workflows.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/developer">Open developer tools</Link>
            </Button>
            <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Internal operator shell only</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
