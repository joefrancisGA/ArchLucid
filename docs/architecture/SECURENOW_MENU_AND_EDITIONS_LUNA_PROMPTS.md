> **Scope:** Paste-ready prompts for the SecureNow menu reorganization, the generic and UHG editions, the generic compliance frameworks, the in-tenant collection agent, the in-tenant deployment model, and the engineer-to-analyst handoff. Internal engineering only. Prompts only — do not implement from this index. Run every prompt on Composer 2.5 slow (`composer-2.5`), not a fast-tier slug.
> **Paste-ready files:** [`.cursor/prompts/securenow-menu-00-index.md`](../../.cursor/prompts/securenow-menu-00-index.md)

# SecureNow menu and editions — Luna prompts

**Created:** 2026-10-10 · **Status:** ready to paste · **Audience:** Composer 2.5 slow (`composer-2.5`)

The SecureNow sidebar today is the Architecture catalog regrouped by where links came from. Findings are split: `Assigned to Me` sits under **Security**, `Findings` sits under **ARC-AMPE Compliance**. **Security** is the group name inside a security product, and Home is the first link inside it. Remediation labels (`Factory`, `Instances`) describe implementation, not outcomes. Setup chores (`Extract & Upload`, `Declared Connections`, `Azure Connections`, `Connection status`) are spread across three groups. SecureNow labels are forced to Title Case by `secureNowTitleCase`, while Administration stays sentence case. Several tooltips still use review wording.

Paste **one** prompt per session. Run them in wave order. Do not implement from this index.

## Owner answers that drive these prompts (2026-10-10)

| Question | Answer |
|----------|--------|
| Primary persona | Security architect first. CISO staff second. Later, cloud security engineers and GRC analysts share one workflow: engineers own findings and remediation, analysts own compliance. |
| Compliance scope | Generic SecureNow is framework-neutral, focused on NIST SP 800-53, OWASP ASVS, the Microsoft cloud security benchmark, and organization policy and architecture packs. A UHG edition focuses on ARC-AMPE, Kubernetes, BI, Snowflake, identity, and ADF. A separate UHG edition layer supports the owner's separation of generic and employer-specific work. |
| Cloud scope | Azure only for now. Leave room for AWS and GCP in version 2. Groups use neutral names. Items keep `Azure` in the label. |
| Brand relationship | UHG edition never mentions ArchLucid. Generic SecureNow may, and should, mention ArchLucid. |
| Data path | Live collection is the main path. Manual upload is the fallback. Most customers want a scheduled or on-demand agent in their own tenant, with SecureNow reading the result from blob storage. SecureNow is typically deployed into the customer's Azure tenant. ArchLucid stays multi-tenant PaaS. |
| Name | `SecureNow` stays. Not a topic for these sessions. |

## Target generic sidebar

| Group | Links (current label → new label) |
|-------|------------------------------------|
| *(none)* | Home |
| **Findings** | Assigned to Me → **My findings** · Findings → **All findings** |
| **Environment** | Resource Explorer → **Resources** · Diagrams · Diagram Reconciliation → **Diagram reconciliation** · Snapshots & Drift → **Changes & drift** · Ask → **Ask about your environment** · Terraform Mapping → **Terraform mapping** |
| **Remediation** | Remediation Factory → **Priorities & waves** · Remediation Patterns → **Fix playbooks** · Remediation Instances → **Remediation tracker** |
| **Compliance** | Policy Packs → **Frameworks** · Standards & Rules → **Effective rules** · Audit Evidence Lineage → **Audit evidence** |
| **Data sources** | **Collection agent** (SN-COL-03) · Azure Connections → **Azure connections** · Declared Connections → **Declared connections** · Connection status · Extract & Upload → **Manual upload** |
| **Integrations** | Jira · ServiceNow · Microsoft Teams |
| **Administration** | Unchanged in Wave A. In-tenant variant in SN-DEP-03. |

Routes do not change. Only group membership, order, labels, tooltips, and captions change. The Architecture shell does not change.

## Prompts

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-MENU-01** | [securenow-menu-01-regroup.md](../../.cursor/prompts/securenow-menu-01-regroup.md) | — | Regroup and reorder the generic sidebar. Home stands alone. Findings are one group |
| **SN-MENU-02** | [securenow-menu-02-labels-sentence-case.md](../../.cursor/prompts/securenow-menu-02-labels-sentence-case.md) | SN-MENU-01 | New labels. Drop the Title Case transform. Page titles and breadcrumbs match |
| **SN-MENU-03** | [securenow-menu-03-tooltips-captions.md](../../.cursor/prompts/securenow-menu-03-tooltips-captions.md) | SN-MENU-02 | Security wording in tooltips and group captions. No review vocabulary |
| **SN-MENU-04** | [securenow-menu-04-home-follows-menu.md](../../.cursor/prompts/securenow-menu-04-home-follows-menu.md) | SN-MENU-02 | Home sections follow the menu. A posture strip from existing data only |
| **SN-ED-01** | [securenow-menu-05-edition-model.md](../../.cursor/prompts/securenow-menu-05-edition-model.md) | SN-MENU-01 | `generic` or `uhg` resolved from deployment config. Not user-switchable. No visible change |
| **SN-ED-02** | [securenow-menu-06-edition-branding.md](../../.cursor/prompts/securenow-menu-06-edition-branding.md) | SN-ED-01 | Generic may say ArchLucid. UHG leak guard stays strict |
| **SN-ED-03** | [securenow-menu-07-edition-compliance.md](../../.cursor/prompts/securenow-menu-07-edition-compliance.md) | SN-ED-01, SN-MENU-02 | Featured frameworks per edition. UHG pins ARC-AMPE first |
| **SN-ED-04** | [securenow-menu-08-edition-nav-overlay.md](../../.cursor/prompts/securenow-menu-08-edition-nav-overlay.md) | SN-ED-01, SN-MENU-01 | An overlay seam for edition-only groups. Ships empty |
| **SN-PACK-01** | [securenow-menu-09-pack-nist-800-53.md](../../.cursor/prompts/securenow-menu-09-pack-nist-800-53.md) | — | Bundled NIST SP 800-53 Rev. 5 architecture pack |
| **SN-PACK-02** | [securenow-menu-10-pack-owasp-asvs.md](../../.cursor/prompts/securenow-menu-10-pack-owasp-asvs.md) | — | Bundled OWASP ASVS architecture pack |
| **SN-PACK-03** | [securenow-menu-11-pack-mcsb.md](../../.cursor/prompts/securenow-menu-11-pack-mcsb.md) | — | Bundled Microsoft cloud security benchmark pack, cross-referenced to Microsoft tools |
| **SN-PACK-04** | [securenow-menu-12-pack-organization-starter.md](../../.cursor/prompts/securenow-menu-12-pack-organization-starter.md) | SN-ED-03 | A starter for organization policy and architecture packs |
| **SN-COL-01** | [securenow-menu-13-collection-agent-adr.md](../../.cursor/prompts/securenow-menu-13-collection-agent-adr.md) | — | ADR: in-tenant collection agent and blob handoff. Design only |
| **SN-COL-02** | [securenow-menu-14-collection-run-ingest.md](../../.cursor/prompts/securenow-menu-14-collection-run-ingest.md) | SN-COL-01 | Collection run records and blob ingest |
| **SN-COL-03** | [securenow-menu-15-collection-agent-page.md](../../.cursor/prompts/securenow-menu-15-collection-agent-page.md) | SN-COL-02, SN-MENU-01 | Collection agent page. Read-only status |
| **SN-COL-04** | [securenow-menu-16-collection-run-now.md](../../.cursor/prompts/securenow-menu-16-collection-run-now.md) | SN-COL-03 | Run now and schedule display, as SN-COL-01 decided |
| **SN-DEP-01** | [securenow-menu-17-in-tenant-deployment-adr.md](../../.cursor/prompts/securenow-menu-17-in-tenant-deployment-adr.md) | SN-COL-01 | ADR: SecureNow in-tenant deployment beside ArchLucid PaaS. Design only |
| **SN-DEP-02** | [securenow-menu-18-in-tenant-terraform.md](../../.cursor/prompts/securenow-menu-18-in-tenant-terraform.md) | SN-DEP-01 | Terraform root for an in-tenant SecureNow |
| **SN-DEP-03** | [securenow-menu-19-in-tenant-administration.md](../../.cursor/prompts/securenow-menu-19-in-tenant-administration.md) | SN-DEP-01, SN-ED-01 | Administration variant for in-tenant hosting |
| **SN-HAND-01** | [securenow-menu-20-engineer-analyst-handoff.md](../../.cursor/prompts/securenow-menu-20-engineer-analyst-handoff.md) | SN-MENU-04, SN-ED-03 | Design note: one shared finding-to-control workflow. Design only |
| **SN-MENU-HOLD** | [securenow-menu-hold.md](../../.cursor/prompts/securenow-menu-hold.md) | — | Forbidden scope |

**Wave A** (SN-MENU-01 to 04) is UI only and stays in order. **Wave B** (SN-ED-01 to 04) follows SN-MENU-01. SN-ED-02, 03, and 04 can run in any order after SN-ED-01. **Wave C** (SN-PACK-01 to 03) has no UI dependency and can run any time. SN-PACK-04 follows SN-ED-03. **Wave D** starts with the SN-COL-01 ADR. Do not start SN-COL-02 until the owner accepts that ADR. **Wave E** starts with the SN-DEP-01 ADR, which follows SN-COL-01. Do not start SN-DEP-02 or 03 until the owner accepts it. **SN-HAND-01** writes a design note only.

## Settled reading

- Routes do not move. Labels, groups, order, tooltips, and captions do.
- The Architecture shell sidebar, labels, and tooltips do not change.
- Sentence case everywhere in the SecureNow sidebar, per `docs/library/UI_DESIGN_SYSTEM.md` § Capitalization.
- Findings are one group. `My findings` comes before `All findings`.
- Group names are cloud-neutral. Item names keep `Azure` until a second cloud ships.
- The edition is deployment configuration. A user cannot switch editions with a cookie, header, or query string.
- UHG-specific code lives under its own edition folder so it can be reviewed and separated on its own.
- The UHG edition never renders `ArchLucid`. The generic edition may.
- Live collection is the main path. Manual upload is listed last under Data sources.
- SecureNow never writes to customer Azure resources. The collection agent is read-only against ARM and writes only to its own storage.

## Do not pull into these sessions

- Renaming SecureNow
- Moving or renaming routes
- Hiding a review workspace tab behind More
- AWS or GCP collection
- Kubernetes, Snowflake, BI, or ADF pages for the UHG edition
- Customer Azure mutation, ARM writes, or remediation execution
- SQL row-level security. [ADR 0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) stands
- Legal claims about intellectual property in code, comments, or docs
