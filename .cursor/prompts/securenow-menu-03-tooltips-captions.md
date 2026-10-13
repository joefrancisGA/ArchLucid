# SN-MENU-03 — SecureNow tooltips and group captions

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-MENU-02. Labels are already final. Do not rename links.

## Goal

Every SecureNow sidebar tooltip and group caption is one plain sentence about the security job. No review wording, no implementation wording, no keyboard shortcuts that the SecureNow shell does not bind.

## Why

SecureNow tooltips are inherited from Architecture link `title` values. Current examples:

- `Track owned architecture risks (Alt+F)` on Findings
- `Manage standards used in reviews` on Policy packs
- `Create, review, approve, and import remediation patterns (Architecture-architecture-draft-only import)`
- `Track remediation instances and waves with advisory-only execute honesty`
- `Extract & upload — run the local inventory script and upload a ZIP`

## Read first

- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts`
- The SN-MENU-02 SecureNow label map module
- `archlucid-ui/src/lib/nav-link-tooltip.test.ts`
- `archlucid-ui/src/lib/product-line/securenow-archlucid-leak-scanner.ts`
- `archlucid-ui/src/lib/review-terminology-guard.test.ts`
- `archlucid-ui/src/lib/shortcut-registry.ts`

## What to build

Add SecureNow tooltips beside the SN-MENU-02 label map, keyed by the same hrefs. Apply them in the SecureNow shell only.

| Href | Tooltip |
|------|---------|
| `/` | Your security posture at a glance. |
| `/security/assigned-to-me` | Findings assigned to you. |
| `/compliance/findings` | Every open finding in this workspace, with severity and owner. |
| `/infrastructure/resources` | Search collected resources and open each resource's evidence. |
| `/infrastructure/diagrams` | See how resources connect, by subscription or resource group. |
| `/infrastructure/diagram-reconcile` | Compare an existing diagram with what was collected. |
| `/infrastructure/snapshots-drift` | Compare two collections and see what changed. |
| `/infrastructure/ask` | Ask questions about your environment. Answers cite collected evidence. |
| `/infrastructure/terraform` | Advisory Terraform reconstructed from collected resources. |
| `/security/remediation-factory` | Rank fixes by risk reduced and group them into waves. |
| `/security/remediation-patterns` | Reusable fixes you can apply to similar findings. |
| `/security/remediation-instances` | Track each fix from planned to verified. |
| `/compliance/policy-packs` | Choose the frameworks and organization policies this workspace is measured against. |
| `/compliance/standards-and-rules` | See which rules apply here and why. |
| `/compliance/audit-evidence` | Trace each control to the evidence behind it. |
| `/integrations/cloud-connections` | Azure tenants and subscriptions SecureNow collects from. |
| `/infrastructure/declared-connections` | Record connections that collection cannot see. |
| `/administration/connection-status` | Health of collection and integrations. |
| `/infrastructure/extract-upload` | Upload a collection ZIP when live collection is not available. |
| `/integrations/jira` | Send findings and fixes to Jira. |
| `/integrations/servicenow` | Send findings and fixes to ServiceNow. |
| `/integrations/teams` | Post finding and fix updates to Microsoft Teams. |

Before you keep each sentence, read the page. If a sentence promises behavior the page does not have, shorten it to what the page does and list the change in the session summary. Do not add behavior to match a tooltip.

Group captions, in the SecureNow shell:

| Group | Caption |
|-------|---------|
| Findings | What needs attention, and who owns it. |
| Environment | What you have and how it connects. |
| Remediation | What to fix first, and whether it worked. |
| Compliance | Frameworks, effective rules, and audit evidence. |
| Data sources | Where SecureNow's evidence comes from. |
| Integrations | Where findings and fixes are sent. |

The Architecture shell keeps every current tooltip and caption.

## Tests

1. Every SecureNow link `title` equals the table value, or the shortened value you recorded.
2. No SecureNow tooltip or caption contains `review`, `reviews`, `architecture risk`, `draft-only`, `honesty`, `Alt+`, `ZIP script`, or `ArchLucid`.
3. Architecture shell tooltips are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. One sentence or two short ones. No trailing jargon in parentheses.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

Hovering any SecureNow sidebar link shows a plain security sentence, and no SecureNow tooltip mentions reviews, shortcuts, or implementation details.
