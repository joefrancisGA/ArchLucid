# What ArchLucid does with your data

## What ArchLucid does

ArchLucid takes your architecture brief (text and optional evidence context), applies policy packs, and produces a **signed review package** with findings, decisions, and an audit record. ArchLucid does not execute code in your environment and does not require write access to your systems.

## What leaves your tenant

The architecture brief text and any evidence context you provide may be sent to **Azure OpenAI** (your tenant's deployment when configured) to produce review outputs. ArchLucid does not send source code repositories, secrets, or credentials as part of the standard review intake path.

Review the Azure OpenAI data processing agreement for inference data retention in your subscription.

## What stays in your tenant

All findings, signed decision records, manifests, governance approvals, and audit log entries are stored in your ArchLucid tenant database. ArchLucid does not retain copies outside your tenant boundary for product analytics on governed review content.

## Isolation

Each customer tenant uses a dedicated database. Cross-tenant data access is not part of the product design. Append-only audit logging records every governed action within your tenant.

## Audit trail

Every inference that contributed to a finding can be traced through the append-only audit log and evidence trail — you can see what input produced each output.

## Data portability

Download a signed export bundle from any finalized review package at any time. You own the artifacts in your tenant.
