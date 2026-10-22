# TB-720 — Per-cloud cloud connection help pages (AWS, Azure, GCP)

## Goal

Replace the Azure-centric single **Cloud connections** help topic with **three buyer-safe, cloud-specific help pages** plus a short cloud-neutral hub. AWS and GCP Tier 2 connectors shipped in V1.1 (**TB-402**, **TB-403**); operators should not have to read Azure federation copy to configure AWS IAM or GCP Workload Identity.

## Context

- Today: `docs/library/customer-facing/CLOUD_CONNECTIONS.md` is Azure-first; only `cloud-connections-azure` is split out (`/help/cloud-connections/azure`).
- Product UI: `/integrations/cloud-connections` manages Azure, AWS, and GCP connections; wizard copy still deep-links Azure help (`tier2-connection-wizard-content.ts`).
- Registry: `archlucid-ui/src/lib/product-documentation-registry.ts` — add `cloud-connections-aws`, `cloud-connections-gcp`; keep `cloud-connections` as neutral overview.
- Help routing: `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx` already serves slugs from the registry.

## What to build

### 1. Customer-facing source docs

Extend or split `CLOUD_CONNECTIONS.md` (or add `CLOUD_CONNECTIONS_AWS.md` / `CLOUD_CONNECTIONS_GCP.md`) with:

| Cloud | Must cover |
|-------|------------|
| **Azure** | Workload identity federation, Reader + Cost Management Reader, subscription scope, validation pull (existing content — move/peel from hub) |
| **AWS** | Read-only IAM role / external ID or OIDC trust for hosted poller, Config/Resource Explorer inventory path, least-privilege table, what ArchLucid stores vs does not store |
| **GCP** | Workload Identity Federation or service-account keyless pattern used by product, read-only roles, project/folder scope, validation pull |

Hub page (`cloud-connections`) stays optional-evidence framing: briefs/diagrams/ZIP uploads work without any connection; link to all three cloud topics.

### 2. Product documentation registry + routes

- Add registry entries with `sectionAnchors` parallel to Azure.
- Slug aliases: `cloud-connections/aws`, `cloud-connections/gcp` (mirror Azure alias pattern in `product-documentation-registry.ts`).
- Update `help-search-panel-catalog.ts`, `page-help-topic-map.ts`, and AWS/GCP connection section clients to link to the correct topic (not generic `/help/cloud-connections`).

### 3. In-product cross-links

- `AwsConnectionSection`, `GcpConnectionSection`, `Tier1InventoryZipValidationCallout`, enterprise onboarding checklist, and wizard steps should link to **their** cloud help page.
- Keep breadcrumb map entries for `/help/cloud-connections/{azure,aws,gcp}`.

### 4. Tests

- Extend `HelpTopicEnterpriseOnboarding.test.tsx` / `product-documentation-registry.test.ts` for AWS and GCP hrefs.
- Help markdown presentation test: no Azure-only anchors on AWS/GCP pages.

## Acceptance

- `/help/cloud-connections` is cloud-neutral overview with links to Azure, AWS, and GCP topics.
- `/help/cloud-connections/azure`, `/aws`, `/gcp` each render distinct procurement-safe copy grounded in that cloud's connector UI.
- Cloud connection settings pages deep-link to the matching help topic.
- Help search finds "Connect AWS securely" / "Connect GCP securely" (or equivalent titles).
- No regression to existing Azure help URL `/help/cloud-connections/azure`.

## Non-goals

- Changing Tier 2 API contracts or connector wizards beyond help links.
- Policy pack content (**TB-701**–**TB-716** already shipped).

## References

- **TB-402** / **TB-403** — AWS/GCP Tier 2 polling
- **TB-337** — multi-cloud onboarding narrative
- `docs/library/customer-facing/CLOUD_CONNECTIONS.md`
- `archlucid-ui/src/app/(operator)/settings/cloud-connections/`

## Owner scoring note (2026-07-10)

`/signup` (ID **SIG**) Evidence dimension 1 scored **100** after public evaluation signup polish (`4488adb232`). Remaining adoption-friction gap for multi-cloud buyers is help/onboarding parity (**this item**), not signup chrome.
