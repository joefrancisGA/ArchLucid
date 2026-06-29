"use client";
import { cn } from "@/lib/utils";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
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
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";
import { settingsRolesEmptyStateDescription, settingsRolesEmptyStateTitle } from "./settings-roles-page-empty-copy";
import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

type TabId = "users" | "roles" | "keys";

const TABS: readonly { id: TabId; label: string }[] = [
  { id: "users", label: "Users and invitations" },
  { id: "roles", label: "Roles and permissions" },
  { id: "keys", label: "API keys" },
] as const;

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

/** Reads the `tab` search param to determine the initial tab. Defaults to "users". */
function useInitialTab(): TabId {
  const params = useSearchParams();
  const raw = params.get("tab");

  if (raw === "roles" || raw === "keys") {
    return raw;
  }

  return "users";
}

function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Users and roles sections"
      className="flex gap-1 border-b border-neutral-200 pb-0 dark:border-neutral-800"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`settings-roles-tabpanel-${tab.id}`}
          id={`settings-roles-tab-${tab.id}`}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2 font-medium leading-none outline-none transition-colors",
            OPERATOR_TYPOGRAPHY.body,
            "-mb-px border-b-2",
            active === tab.id
              ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"
              : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
          )}
          data-testid={`settings-roles-tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsRolesPageView(props: Props) {
  const m = props.model;
  const initialTab = useInitialTab();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  if (m.surface === "demo") {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Role management"
        description="In a connected tenant, tenant administrators assign roles and effective authority through the identity provider."
      />
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="settings-roles-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
      </div>
    );
  }

  const directoryUnavailable = !m.loading && m.note === "api_unavailable";
  const userRows = m.sortedRows.filter((r) => r.kind === "user");
  const apiKeyRows = m.sortedRows.filter((r) => r.kind === "api_key");

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Users and roles</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Invite users, assign roles, and manage workspace access.
        </p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === "users" ? (
        <div
          id="settings-roles-tabpanel-users"
          role="tabpanel"
          aria-labelledby="settings-roles-tab-users"
          data-testid="settings-roles-tabpanel-users"
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Invite user</CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsRolesInvitePanel
                  directoryUnavailable={directoryUnavailable}
                  onRetry={() => void m.load()}
                />
              </CardContent>
            </Card>

            {!directoryUnavailable ? (
              <Card>
                <CardHeader>
                  <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
                  {!m.loading && m.note !== null && m.note !== "api_unavailable" ? (
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
                  {!m.loading && userRows.length > 0 ? (
                    <PrincipalTable rows={userRows} onRoleChange={m.onRoleChange} />
                  ) : null}
                  {!m.loading && m.note === null && userRows.length === 0 ? (
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No users found in this workspace.</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "roles" ? (
        <div
          id="settings-roles-tabpanel-roles"
          role="tabpanel"
          aria-labelledby="settings-roles-tab-roles"
          data-testid="settings-roles-tabpanel-roles"
        >
          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Custom role matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsRolesMatrixSection />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "keys" ? (
        <div
          id="settings-roles-tabpanel-keys"
          role="tabpanel"
          aria-labelledby="settings-roles-tab-keys"
          data-testid="settings-roles-tabpanel-keys"
        >
          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>API keys</CardTitle>
            </CardHeader>
            <CardContent>
              {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
              {!m.loading && m.note !== null ? (
                <div data-testid="settings-roles-api-keys-note">
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
              {!m.loading && apiKeyRows.length > 0 ? (
                <PrincipalTable rows={apiKeyRows} onRoleChange={m.onRoleChange} />
              ) : null}
              {!m.loading && m.note === null && apiKeyRows.length === 0 ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No API keys found in this workspace.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

type PrincipalTableProps = {
  readonly rows: SettingsRolesPageViewModel["sortedRows"];
  readonly onRoleChange: SettingsRolesPageViewModel["onRoleChange"];
};

function PrincipalTable({ rows, onRoleChange }: PrincipalTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
        <thead>
          <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Email / hint</th>
            <th className="py-2 pr-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.kind}:${r.id}`} className="border-b border-neutral-100 dark:border-neutral-800">
              <td className={cn("py-2 pr-3 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{r.name}</td>
              <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{r.detail}</td>
              <td className="py-2 pr-3">
                <Select
                  value={r.role}
                  onValueChange={(v) => {
                    void onRoleChange(r, v as ArchLucidAppRole);
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
