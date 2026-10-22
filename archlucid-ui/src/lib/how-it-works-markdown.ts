/** In-app copy for the CTO data-handling dialog (mirrors docs/library/customer-facing/DATA_HANDLING.md). */
export const DATA_HANDLING_MARKDOWN = `# What ArchLucid does with your data

## What ArchLucid does

ArchLucid takes your architecture brief and optional evidence context, applies policy packs, and produces a **finalized architecture review** with findings, decisions, a **finalized review record**, and an audit trail. ArchLucid does not execute code in your environment and does not require write access to your systems.

## What leaves your tenant

Architecture brief text and evidence context you provide may be sent to the **configured model provider** for the workspace to produce review outputs. When configured, review evidence may be processed by the approved AI provider for the workspace, such as Azure OpenAI.

ArchLucid does not send source code repositories, secrets, or credentials as part of the standard review intake path. Review your customer-approved AI endpoint data processing terms for inference retention and subprocessors.

## What stays in your tenant

All findings, finalized review records, decisions, approval, and audit log entries are stored in your ArchLucid tenant database. ArchLucid does not retain copies outside your tenant boundary for product analytics on architecture review content.

## What ArchLucid does not collect

ArchLucid is not designed to ingest production secrets, credentials, or privileged access tokens through the standard architecture review intake path. Optional cloud connectors use read-only roles scoped to evidence collection — not administrative control of your cloud estate.

## Isolation

Each customer tenant uses a dedicated database. Cross-tenant data access is not part of the product design. Append-only audit logging records every approved action within your tenant.

## Audit trail

Every inference that contributed to a finding can be traced through the append-only audit log and evidence trail — you can see what input produced each output.

## Cloud connectors are optional

You can complete reviews using uploaded evidence only. Azure, AWS, and GCP connectors are optional read-only integrations configured only for platforms relevant to the workspace.

## AI provider handling

Review outputs may use the workspace's approved AI provider or customer-approved AI endpoint when configured. Model routing, retention, and subprocessors depend on your plan and provider configuration — confirm details during security diligence.

## Demo and sample data

Demo and evaluation workspaces use sample architecture data so evaluators can inspect findings, evidence trails, and exports without uploading customer production data.

## Data portability

Download an export bundle from any finalized architecture review at any time. You own the artifacts in your tenant.

## Export and deletion posture

Finalized architecture reviews support exportable governance artifacts for sponsors and audit. Tenant data lifecycle, retention, and deletion requests are handled according to your agreement and the security review process — contact your administrator or ArchLucid support for workspace-specific posture.`;

/** @deprecated Use DATA_HANDLING_MARKDOWN — retained for imports migrating from the combined how-it-works topic. */
export const HOW_IT_WORKS_MARKDOWN = DATA_HANDLING_MARKDOWN;
