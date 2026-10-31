> **Scope:** SecureNow scenario chooser for fixture walkthroughs. Not customer evidence. Not a starter proof pack. Not an approved offer. Beta remains NO_GO.

# SecureNow scenario chooser

Pick one row. Do not present the fixture as a customer outcome.

| Scenario | Buyer job | Open this | Honest label | Pack |
| --- | --- | --- | --- | --- |
| `public-storage-path` | Show possible public network access on a storage account and how SecureNow ranks a path without claiming an exploit. | [Fixture storyboard](FIXTURE_STORYBOARD.md), [buyer proof demo](BUYER_PROOF_DEMO.md) | Fixture, not an observed exploit. | [public-storage-path pack](scenario-packs/public-storage-path.md) |
| `collection-gap` | Show that a missing or stale capture stays visible instead of implying full coverage. | [Storyboard beat 1 — Scope and freshness](FIXTURE_STORYBOARD.md#beat-1--scope-and-freshness) | A gap is not a clean bill of health. | [collection-gap pack](scenario-packs/collection-gap.md) |
| `advisory-cut-no-write` | Show an advisory cut point and that Azure change happens outside SecureNow. | [Storyboard beats 3 and 4](FIXTURE_STORYBOARD.md#beat-3--advisory-cut-point), [Engineer action](FIXTURE_STORYBOARD.md#beat-4--engineer-action) | SecureNow does not change Azure. | [advisory-cut-no-write pack](scenario-packs/advisory-cut-no-write.md) |
| `later-capture-not-verified` | Show a later capture that is missing an element and the honest not-verified outcome. | [Storyboard beat 5 — Verify or fail honestly](FIXTURE_STORYBOARD.md#beat-5--verify-or-fail-honestly) | **NOT VERIFIED** | [later-capture-not-verified pack](scenario-packs/later-capture-not-verified.md) |
| `contributor-role-between-snapshots` | Show a unit fixture where removing a Contributor assignment removes probable privilege paths between snapshots. | [SecureNowArchitectTwoSnapshotGoldenFixtureTests.cs](../../ArchLucid.Application.Tests/InfraEvidence/SecureNowArchitectTwoSnapshotGoldenFixtureTests.cs) | Unit fixture, not a sponsor demo. | [contributor-role-between-snapshots pack](scenario-packs/contributor-role-between-snapshots.md) |

## What this chooser does not include

This chooser does not include `templates/starter-proof-packs/`. It does not fill [`EXECUTIVE_PROOF_PACKET_TEMPLATE.md`](EXECUTIVE_PROOF_PACKET_TEMPLATE.md). A fixture walkthrough is not customer evidence.
