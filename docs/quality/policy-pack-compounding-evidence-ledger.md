# Policy-pack compounding-evidence ledger (TB-885 / DX-18)

> Internal differentiability instrument — **not** a buyer compounding rate.

- **Schema:** `archlucid.policy-pack-compounding-evidence-ledger.v1`
- **Generated (UTC):** 2026-09-07T20:33:58Z
- **Policy pack id:** `22222222-2222-2222-2222-222222222222`
- **Historical run id:** `dddddddddddddddddddddddddddddddd`
- **Older version:** `1.0.0` (gate blocked: False)
- **Newer version:** `2.0.0` (gate blocked: True)
- **Fixture:** `policy-ab-demo (synthetic - internal demo validation only)`

## Incremental catch (newer vs older on same run)

- **Gate blocked flipped:** True
- **Added compliance rule keys:** demo-ctrl-network-isolation
- **Findings newly blocking commit:** demo-finding-critical

## Change-log citations

- `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` `VersionPublished` — Version '2.0.0' published for pack '22222222-2222-2222-2222-222222222222'.

## Claim boundary

Internal differentiability instrument — not a buyer compounding rate.

## C# regression

`dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~PolicyPackCompoundingEvidenceLedgerTests"`

