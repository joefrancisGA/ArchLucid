"use client";

import Link from "next/link";

import { ContextualHelp } from "@/components/ContextualHelp";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArchLucidAppRole } from "@/lib/current-principal";

import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";
import { settingsRolesEmptyStateDescription, settingsRolesEmptyStateTitle } from "./settings-roles-page-empty-copy";
import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

export function SettingsRolesPageView(props: Props) {
  const m = props.model;

  if (m.surface === "demo") {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Role management not available in demo mode.</p>
        <p className="m-0 mt-1">Assign roles through your production workspace and identity provider.</p>
      </div>
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="settings-roles-page">
        <p className="m-0 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="settings-roles-page">
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="settings-roles-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Return to home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="settings-roles-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Role management</h1>
          <ContextualHelp helpKey="settings-roles-page" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Define custom roles with fine-grained permissions and assign ArchLucid app roles to tenant users and API keys.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom role matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsRolesMatrixSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users and API keys</CardTitle>
        </CardHeader>
        <CardContent>
          {m.loading ? <p className="m-0 text-sm text-neutral-500">Loading…</p> : null}
          {!m.loading && m.note !== null ? (
            <div data-testid="settings-roles-api-note">
              <OperatorEmptyState
                title={settingsRolesEmptyStateTitle(m.note)}
                description={settingsRolesEmptyStateDescription(m.note)}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => void m.load()}>
                  Refresh
                </Button>
              </div>
            </div>
          ) : null}
          {!m.loading && m.sortedRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email / hint</th>
                    <th className="py-2 pr-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {m.sortedRows.map((r) => {
                    const typeLabel = r.kind === "user" ? "User" : "API key";

                    return (
                      <tr key={`${r.kind}:${r.id}`} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{typeLabel}</td>
                        <td className="py-2 pr-3 font-medium text-neutral-900 dark:text-neutral-100">{r.name}</td>
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{r.detail}</td>
                        <td className="py-2 pr-3">
                          <Select
                            value={r.role}
                            onValueChange={(v) => {
                              void m.onRoleChange(r, v as ArchLucidAppRole);
                            }}
                          >
                            <SelectTrigger
                              className="h-9 w-[11rem]"
                              aria-label={`Role for ${r.name}`}
                              data-testid={`settings-roles-select-${r.kind}-${r.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SETTINGS_ROLES_ASSIGNABLE.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
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
