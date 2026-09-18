# SN-RT-HOLD — Written hold (not implementation)

**Wave:** SecureNow runtime connections (**SN-RT**). **Not an implementation prompt.** Paste only when a session starts secret harvest, Kudu, merging observed arrows into declared, SQL table harvest, hosted POST, or a second ZIP collector.

Library copy: [`docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../../docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md). Design: [`docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`](../../docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md).

## Goal

Close the Container Apps Data Flow gap with Reader-first declared wiring. Keep logs, SQL membership, and uploads in **separate** families. Do not turn SecureNow into a SIEM or an ER modeler.

## Do not implement from SN-RT sessions

| Temptation | Hold |
|-----------|------|
| Persist connection strings / KV values / API keys | Hosts, catalogs, secret **names** |
| Kudu / disk / ConfigMap / source parse | AX-DE-HOLD |
| Hosted POST `config/list` | Hosted GET-only |
| App Insights as **May access** | ObservedRuntime only |
| `sys.tables` / FK ER | Principals only (**SN-RT-08**) |
| Second `Get-*Package.ps1` | One collector family |
| Azure HTTP at Mermaid compile | Snapshot only |
| `"confidence": 80` | Ordinal bands |
| Mint OpenAI/Search when type absent | Empty stage |
| Auto-confirm uploaded guesses | SN-RT-10 |
| `terraform apply` | Plane |
| GTM **M-90 / M-44 / M-91 / M-92**; **TB-135 / TB-136** | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |
| Re-run AX-DE / SN-DF / SN-PE as greenfield | Consume |

## Authorized spine (SN-RT-01–10)

```text
A: Container Apps env GET → parse → SQL catalog/FQDN → PaaS stages → RBAC allowlist
        → B: opt-in LAW companion → ObservedRuntime family
              → C: opt-in database principals
                    → D: upload parsers → confirm HumanAssertion
```

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **SN-RT-01–10** and the plane.

## Done when

The hold is written. No code from this file.
