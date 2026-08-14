> **Scope:** Customer-facing — how tenant, workspace, and project scope work in the product UI, including the header scope switcher and sample workspace behavior.

# Workspace and scope guide

ArchLucid isolates data by **tenant**, **workspace**, and **project**. The header scope switcher shows your current workspace and lets you change workspace and project when your tenant is connected.

## Three scope levels

| Level | What it means |
|-------|----------------|
| **Tenant** | Your organization boundary. Tenant comes from sign-in and identity; you do not switch tenants from the scope switcher. |
| **Workspace** | A team, program, or environment under the tenant. Reviews, findings, and exports belong to one workspace at a time. |
| **Project** | A routing scope within the workspace. Most pilot flows use a single primary project. |

When you switch workspace or project, lists and reviews refresh to match the new scope. Data from another workspace is not shown.

## Using the scope switcher

1. Open the workspace label in the top bar (for example **Customer Intake Demo** in a sample session, or **Workspace: {name} — {project}** when connected).
2. In a **connected tenant**, choose a workspace and project from the list.
3. Confirm Overview and **Reviews** show the expected content for that scope.

If switching is disabled, you are in a local demo or sandbox with a fixed sample workspace. Your real workspace is unchanged.

## Sample workspace

In demo mode, the top bar shows the compact label **Customer Intake Demo**. Open that label to see the **Sample** badge, the full sample workspace title, and confirmation that the data is for demonstration only — it is not your real tenant data. Workspace switching is disabled in demo mode so evaluators can explore without affecting a real tenant.

To work in your tenant scope, sign in to a connected environment. If you don't have access, ask your tenant admin for the correct workspace assignment.

## When content looks wrong

| Symptom | First check |
|---------|-------------|
| Empty reviews list | Confirm the scope switcher shows the workspace you expect |
| Architecture review not found | The link may belong to a different workspace or project |
| Sample badge unexpected | Open the top-bar workspace label — the **Sample** badge appears inside the panel, not on the collapsed trigger |

For step-by-step recovery, open [Troubleshooting](/help/troubleshooting).

## Who manages scope

Tenant name, access, and visibility are managed in [Settings → Tenant](/administration/tenant). Workspace and project assignment may be controlled by your tenant admin or identity provider integration.

**Review scope** (which standards evaluate a review) is separate from workspace scope. See the [Review guide](/help/review-guide) for the wizard's **Review standards selection** control.

## Related help

| Topic | When to use it |
|-------|----------------|
| [Getting started](/help/getting-started) | First review and core concepts |
| [Users and roles](/help/users-and-roles) | Access control when scope vocabulary turns into permissions |
| [Users settings](/administration/users) | User assignment and workspace access |
| [Data handling & isolation](/help/data-handling) | Tenant isolation and data-handling depth |
| [Assurance status](/security-trust) | Trust-center posture when diligence readers need assurance context |
| [Review guide](/help/review-guide) | Review scope vs. workspace scope |
| [Troubleshooting](/help/troubleshooting) | Symptom-first fixes when scope or API errors appear |
