<!-- Recovery Services vaults — Composer prompts. Paste one numbered file per
     session. Origin: 2026-09-24 owner request: unconnected Recovery Services
     vaults are acceptable on the inventory. A later view may show which
     resources a vault protects. Leave vaults off other diagrams unless the
     viewer opts in. Do not implement from this index. -->

# Recovery Services vaults — Composer prompt set (RSV-01–RSV-04)

An unconnected `Microsoft.RecoveryServices/vaults` card is an honest picture of the snapshot we have today. The vault resource is inventoried. Backup protected items and Site Recovery replication items are not. A vault does not store the workload. It protects it.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/recovery-services-0N-*.md` file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

**Do not re-run AZI, DEC, IDA, DRS, IDL, IDS, IDT, IDH, IDG, or IDR** inside an RSV session.

## Policy (locked)

1. Same resource group is not protection. Do not draw a vault edge because a VM, disk, SQL server, or storage account sits in the vault's group.
2. A protection edge exists only when a collected backup item or replication item cites both the vault and a source resource id that is in the snapshot.
3. Direction is **vault → protected resource**. Backup label: `backs up`. Site Recovery label: `replicates`, and only when the collected item names a target. Do not use `CONNECTS_TO`.
4. A failed or forbidden protection read is a coverage gap. It is not an empty protection set and it is not a reason to invent edges.
5. Business continuity is the only diagram that shows Recovery Services vaults by default. Every other mode hides them until `includeRecoveryServices` is set.
6. The existing Recovery Services Vault SVG stays. Do not crop, recolor, or replace it. Do not classify the vault as Key Vault.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Default canvas** | Vaults render as ordinary compute cards, often with no edges | Vault nodes drop out of every mode except the one RSV-02 adds | RSV-01 |
| **Mode** | No business-continuity view | `businessContinuity` lists vaults and states that protection coverage is not collected yet | RSV-02 |
| **Evidence** | Vault ARM row only | Backup protected items and Site Recovery items become `PROTECTS` edges, or an explicit gap | RSV-03 |
| **Opt-in** | No viewer control | Checkbox `includeRecoveryServices` puts cited vaults and `PROTECTS` edges onto other modes | RSV-04 |

## What this set does not change

Keep Executive, Network, Data, Data flow, and Full subscription behavior for every other resource. Keep `includeNeverShow` and `includePrivateEndpoints` as separate switches. Do not add Backup vaults (`Microsoft.DataProtection/backupVaults`) in this set. Do not add a finding that an unconnected vault is a defect.

## Run order

**01 → 02 → 03 → 04.**

RSV-01 and RSV-02 do not call Azure. RSV-03 is the only prompt that adds a GET. RSV-04 only exposes the edges RSV-03 stored.
