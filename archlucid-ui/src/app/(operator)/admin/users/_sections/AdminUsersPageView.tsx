"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { adminUsersEmptyStateDescription, adminUsersEmptyStateTitle } from "./admin-users-page-empty-copy";
import type { AdminUsersPageViewModel } from "./admin-users-page-view-model";

type Props = {
  readonly model: AdminUsersPageViewModel;
};

export function AdminUsersPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="User management"
        description="In a connected tenant, administrators manage users and access through the identity provider."
      />
    );
  }

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="admin-users-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Users & roles</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Principals in this tenant and their effective authority rank. The API is authoritative; role changes require the
          admin user management endpoints when available on your environment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
          {!m.loading && m.note !== null ? (
            <div data-testid="admin-users-api-note">
              <OperatorEmptyState title={adminUsersEmptyStateTitle(m.note)} description={adminUsersEmptyStateDescription(m.note)} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled title="Coming soon — use your IdP admin console to invite users.">
                  Invite user
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/settings/tenant">Connect identity provider</Link>
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void m.load()}>
                  Refresh directory
                </Button>
              </div>
            </div>
          ) : null}
          {!m.loading && m.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Display name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Access tier</th>
                  </tr>
                </thead>
                <tbody>
                  {m.rows.map((r) => {
                    return (
                      <tr key={r.userId} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className={cn("py-2 pr-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{r.displayName}</td>
                        <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{r.email}</td>
                        <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{r.authorityLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
