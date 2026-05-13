"use client";

import Link from "next/link";

import { ContextualHelp } from "@/components/ContextualHelp";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { adminUsersEmptyStateDescription, adminUsersEmptyStateTitle } from "./admin-users-page-empty-copy";
import type { AdminUsersPageViewModel } from "./admin-users-page-view-model";

type Props = {
  readonly model: AdminUsersPageViewModel;
};

export function AdminUsersPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">User management not available in demo mode.</p>
        <p className="m-0 mt-1">Manage users and access through your identity provider.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="admin-users-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Users & roles</h1>
          <ContextualHelp helpKey="admin-users-page" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Directory of principals in this tenant and their ArchLucid authority tier (Reader / Operator / Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {m.loading ? <p className="m-0 text-sm text-neutral-500">Loading…</p> : null}
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
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Display name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Access tier</th>
                  </tr>
                </thead>
                <tbody>
                  {m.rows.map((r) => {
                    return (
                      <tr key={r.userId} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-3 font-medium text-neutral-900 dark:text-neutral-100">{r.displayName}</td>
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{r.email}</td>
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{r.authorityLabel}</td>
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
