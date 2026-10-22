> **Scope:** Customer-facing — how tenant, workspace, and project scope work in the product UI, including the header scope switcher and sample workspace behavior.

# Workspace and scope guide

ArchLucid isolates data by **tenant**, **workspace**, and **project**. After sign-in, your default seat is your **live tenant workspace** — not the Customer Intake Demo sample — unless you explicitly chose **Training** on first login or opened a sample visit.

## Three scope levels

| Level | What it means |
|-------|----------------|
| **Tenant** | Your organization boundary. Tenant comes from sign-in and identity; you do not switch tenants from the scope switcher. |
| **Workspace** | A team, program, or environment under the tenant. Reviews, findings, and exports belong to one workspace at a time. |
| **Project** | A routing scope within the workspace. Most pilot flows use a single primary project. |

When you switch workspace or project, lists and reviews refresh to match the new scope. Data from another workspace is not shown.

## First login and invites

| Situation | What to expect |
|-----------|----------------|
| **Invited user** | You join the workspace your admin assigned. Post-auth lands you on that live workspace when bootstrap completes. |
| **No membership yet** | Post-auth setup helps you create a workspace or request access — sample scope is not a silent substitute. |
| **First-time choice** | You may see **Start in my workspace** or **Training**. Training opens Guided mode on the sample workspace; your choice is saved. |

In-app detail: [Your workspace after sign-in](/help/first-login-workspace).

## Using the scope switcher

1. Open the workspace label in the top bar. On your live tenant this shows your organization workspace name and project. On the sample workspace it shows the compact **Customer Intake Demo** label.
2. In a **connected tenant**, choose a workspace and project from the list.
3. Confirm Overview and **Reviews** show the expected content for that scope.

If switching is disabled, you are in an explicit sample or demo session. Use **Back to your workspace** to return to your tenant scope when you are signed in.

## Sample workspace (Training and demos)

The **Customer Intake Demo** compact label is for **Training**, evaluator demos, and other explicit sample visits — not for day-to-day work on your tenant. Open the workspace label to see the **Sample** badge, demo hints, and honesty copy that the data is not your organization.

Record and Practice are review-type controls. Selecting **Record** while you are still on the sample workspace does **not** make the data live. Honesty banners such as **NOT LIVE DATA** stay visible on sample scope.

To work in your tenant scope, leave Training or use **Back to your workspace**, then confirm the header shows your workspace name instead of Customer Intake Demo.

## When content looks wrong

| Symptom | First check |
|---------|-------------|
| **NOT LIVE DATA** unexpected | You are on the sample workspace — leave Training or switch back to your workspace |
| Empty reviews list | Confirm the scope switcher shows the workspace you expect |
| Architecture review not found | The link may belong to a different workspace or project |
| Sample badge unexpected | Open the top-bar workspace label — the **Sample** badge appears inside the panel, not on the collapsed trigger |

For step-by-step recovery, open [Troubleshooting](/help/troubleshooting) or [Your workspace after sign-in](/help/first-login-workspace).

## Who manages scope

Tenant name, access, and visibility are managed in [Settings → Tenant](/administration/tenant). Workspace and project assignment may be controlled by your tenant admin or identity provider integration.

**Review scope** (which standards evaluate a review) is separate from workspace scope. See the [Review guide](/help/review-guide) for the wizard's **Review standards selection** control.

## Related help

| Topic | When to use it |
|-------|----------------|
| [Your workspace after sign-in](/help/first-login-workspace) | Training vs live workspace and Record vs Training |
| [Getting started](/help/getting-started) | First review and core concepts |
| [Record and Practice](/help/career-rehearsal-doors) | Review type on your live workspace |
| [Users and roles](/help/users-and-roles) | Access control when scope vocabulary turns into permissions |
| [Users settings](/administration/users) | User assignment and workspace access |
| [Data handling & isolation](/help/data-handling) | Tenant isolation and data-handling depth |
| [Assurance status](/security-trust) | Trust-center posture when diligence readers need assurance context |
| [Review guide](/help/review-guide) | Review scope vs. workspace scope |
| [Troubleshooting](/help/troubleshooting) | Symptom-first fixes when scope or API errors appear |
