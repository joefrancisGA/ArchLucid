# SN-MENU-21 — One Data sources catalog

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** SN-MENU-01 through SN-MENU-04 and SN-COL-03, which are already on `master`. Do not rebuild the sidebar groups. Do not add a collection-agent feature.

## Goal

SecureNow Home and the SecureNow sidebar show the same Data sources rows, in the same order, with the same labels, each pointing at one SecureNow address.

## Why

Both surfaces use the heading "Where SecureNow's evidence comes from." They do not list the same jobs.

Home (`SECURENOW_DATA_SOURCES_HOME_ROWS`) has three rows: Azure Connections, Declared Connections, and Manual Upload. Declared Connections and Manual Upload still link to `/governance/infrastructure/declared-connections` and `/governance/infrastructure/extract-upload`.

The sidebar (`securenow-nav-reshape.ts`) builds a different list: Collection Agent is inserted by hand, Azure Connections is pulled on its own, then Declared Connections, Connection Status, and Manual Upload come from `SECURENOW_DATA_SOURCES_NAV_HREFS`. Those last two use `/infrastructure/declared-connections` and `/infrastructure/manual-upload`.

A reviewer who starts from Home never sees Collection Agent or Connection Status. A reviewer who starts from the sidebar can miss Azure Connections and Manual Upload. Those are the two ways to get a collection into the product.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-data-sources-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts` (`SECURENOW_NAV_LABELS`, `SECURENOW_NAV_TOOLTIPS`)
- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts` (`SECURENOW_DATA_SOURCES_NAV_HREFS`, `SECURENOW_COLLECTION_AGENT_NAV_LINK`, the Data sources group)
- `archlucid-ui/src/lib/product-line/securenow-collection-agent-route.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-route-paths.ts` (`SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH`, `SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH`)
- `archlucid-ui/src/components/product-line/SecureNowDataSourcesHomeSection.tsx`
- `archlucid-ui/src/lib/product-line/securenow-home-outcome-copy.test.ts`
- `archlucid-ui/src/lib/product-line/filter-nav-groups-for-product-line.test.ts`

## What to build

1. Branch `sn-menu/data-sources-one-catalog` from current `master`.
2. Make `SECURENOW_DATA_SOURCES_HOME_ROWS` the only catalog. Five rows, in this order. Labels come from `SECURENOW_NAV_LABELS` for that href. Do not write a second label string.

   | Order | Label key | Href | Summary |
   |-------|-----------|------|---------|
   | 1 | `/integrations/cloud-connections` | `/integrations/cloud-connections` | Keep the current Home sentence: "Connect the Azure tenants and subscriptions SecureNow collects from." `recommendedFirst` stays on this row only. |
   | 2 | `/infrastructure/collection-agent` | `/infrastructure/collection-agent` | "Whether scheduled collection is running and what it found." |
   | 3 | `/infrastructure/declared-connections` | `/infrastructure/declared-connections` | "Record connections that collection cannot see." |
   | 4 | `/administration/connection-status` | `/administration/connection-status` | "Health of collection and integrations." |
   | 5 | `/infrastructure/manual-upload` | `/infrastructure/manual-upload` | "Upload a collection ZIP when live collection is not available." |

3. Build the SecureNow sidebar Data sources group from that catalog, in that order. Delete the hand-built sequence that inserts Collection Agent, then Azure Connections, then `SECURENOW_DATA_SOURCES_NAV_HREFS.slice(1)`.
4. Keep a source-nav link only when its href is in the catalog. Remap a governance href (`/governance/infrastructure/declared-connections`, `/governance/infrastructure/extract-upload`) onto the catalog href before that check, using the remap that already exists. Do not leave the governance href on the sidebar or on Home.
5. For the security product line, the catalog rows must be present in the source nav that reshape reads. Azure Connections and Manual Upload must not disappear from the sidebar while Home still lists them. If a reshape test builds a full security nav, the Data sources group is exactly these five hrefs in this order.
6. Do not add a row. Do not rename a route. Do not move Collection Agent into Integrations or Administration. Do not change other Home sections.

## Acceptance criteria

- Home Data sources and the sidebar Data sources group list the same five labels in the same order: Azure Connections, Collection Agent, Declared Connections, Connection Status, Manual Upload.
- Declared Connections on Home href is `/infrastructure/declared-connections`.
- Manual Upload on Home href is `/infrastructure/manual-upload`.
- Azure Connections remains the only row with `recommendedFirst`.
- The Architecture shell nav is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case stays whatever `SECURENOW_NAV_LABELS` already returns. Do not add another title-case pass.
- Do not commit.

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/product-line/securenow-home-outcome-copy.test.ts src/lib/product-line/filter-nav-groups-for-product-line.test.ts
```

## Done when

Tests pass. Open SecureNow Home and the sidebar Data sources group. Both show the five rows above, in that order, and Declared Connections and Manual Upload go to the `/infrastructure/...` addresses. Wait for that look before any commit.
