> **Scope:** Customer-facing — how tenant, workspace, and project scope work in the operator UI, including the header scope switcher and sample workspace behavior.

# Workspace guide

ArchLucid isolates data by **tenant**, **workspace**, and **project**. The header scope switcher shows your current workspace and lets you change workspace and project when your tenant is connected.

## Three scope levels

| Level | What it means |
|-------|----------------|
| **Tenant** | Your organization boundary. Tenant comes from sign-in and identity — you do not switch tenants from the scope switcher. |
| **Workspace** | A team, program, or environment under the tenant. Reviews, findings, and exports belong to one workspace at a time. |
| **Project** | A routing scope within the workspace. Most pilot flows use a single primary project. |

When you switch workspace or project, lists and review packages refresh to match the new scope. Data from another workspace is not shown.

## Using the scope switcher

1. Open the workspace label in the top bar (for example **Claims Intake Demo** or your workspace name).
2. In a **connected tenant**, choose a workspace and project from the list.
3. Confirm Overview and **Review packages** show the expected content for that scope.

If switching is disabled, you are in a local demo or sandbox with a fixed sample workspace. Your real workspace is unchanged.

## Sample workspace (demo)

In buyer-polished demo mode, the header may show **Claims Intake Demo** with a **Sample** badge. That workspace uses demonstration data only. Workspace switching is disabled so evaluators can explore without affecting a real tenant.

To work in your tenant scope, sign in to a connected environment or ask your tenant admin for the correct workspace assignment.

## When content looks wrong

| Symptom | First check |
|---------|-------------|
| Empty reviews list | Confirm the scope switcher shows the workspace you expect |
| Review package not found | The link may belong to a different workspace or project |
| Sample badge unexpected | Confirm whether you are in a demo or sandbox environment |

For step-by-step recovery, open **Troubleshooting** in Help.

## Tenant administration

Tenant name, access, and cost visibility are managed under **Settings → Tenant**. Workspace and project assignment is controlled by your tenant admin or identity provider integration.

## Related help

| Topic | When to use it |
|-------|----------------|
| **Getting started** | First review and core concepts |
| **Glossary** | Canonical definitions for tenant, workspace, and review package |
| **Troubleshooting** | Symptom-first fixes when scope or API errors appear |
