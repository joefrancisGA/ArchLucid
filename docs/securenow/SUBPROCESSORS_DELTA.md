> **Scope:** SecureNow reading of the platform subprocessors register. Not a new subprocessor. Not an executed DPA. Not an approved customer offer. SecureNow beta remains **NO_GO**.

# SecureNow subprocessors delta

The register that changes is [`../go-to-market/SUBPROCESSORS.md`](../go-to-market/SUBPROCESSORS.md). This page does **not** add a vendor.

**Last reviewed:** 2026-10-30 (UTC)

| Register row | Hosted SecureNow | In-tenant SecureNow | Notes |
| --- | --- | --- | --- |
| Azure host services (Container Apps, SQL, Blob, Key Vault, Service Bus, Redis, Front Door, API Management, monitoring) | Applies | Customer-operated boundary | Hosted SecureNow uses the same Microsoft Azure processing stack the register lists for the hosted service. In-tenant SecureNow runs API, worker, and UI in the customer subscription ([ADR 0104](../architecture/adrs/0104-securenow-in-tenant-deployment.md)); those customer-provisioned resources are not ArchLucid subprocessors. |
| Microsoft Entra ID | Applies | Applies | Customers sign in with their existing Entra tenant; the register row covers identity processing. |
| Azure OpenAI Service | Applies | Applies | Register data category: prompts and completions that may include customer content when submitted. SecureNow does not add a separate prompt inventory here. |
| Optional third-party completion engines (not yet offered) | Not offered | Not offered | Register states no external completion engine is tenant-selectable today. |

## What this page does not do

- Edit [`SUBPROCESSORS.md`](../go-to-market/SUBPROCESSORS.md).
- Start the register’s **30 days’** new-subprocessor notice process.
- Name a non-Microsoft vendor.

Customer-owned Automation and the customer-owned blob handoff in [ADR 0103](../architecture/adrs/0103-securenow-in-tenant-collection-agent.md) are **customer-operated** collection boundaries. They are not listed as ArchLucid subprocessors on this delta.
