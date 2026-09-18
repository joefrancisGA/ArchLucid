> **Scope:** Contributor-reference — written hold for SecureNow **runtime connection** prompts (**SN-RT-HOLD**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Design:** [`../securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`](../securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md) · **Prompts:** [`../architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md)

# SecureNow runtime connection hold (SN-RT-HOLD)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/securenow-runtime-connection-11-hold.md`](../../.cursor/prompts/securenow-runtime-connection-11-hold.md) only when a session starts secret harvest, Kudu, merging observed arrows into declared, SQL table/FK harvest, hosted POST, or a second ZIP collector.

## Authorized spine

```text
A: Reader ARM GET Container Apps env + parsers + RBAC allowlist + stages
        → B (opt-in): Log Analytics observations as a separate Observed family
              → C (opt-in): sys.database_principals names only
                    → D (opt-in): uploaded config → confirm → HumanAssertion
```

## Do not implement from SN-RT sessions

| Temptation | Hold |
|-----------|------|
| Persist connection-string **values**, KV secret values, API keys | Hosts, catalog names, secret **names**, ARM ids only |
| Kudu / SCM / VM disk / AKS ConfigMap / source parse | AX-DE-HOLD |
| Hosted POST `config/list` | Hosted GET-only; Container Apps env is GET |
| Relabel App Insights / audit as declared or **May access** | Observed family only (**SN-RT-07**) |
| SQL `sys.tables` / FKs / ER diagrams | **SN-RT-08** is principals only |
| Second ZIP collector / new `Get-*Package.ps1` | Extend existing extractor family |
| Azure HTTP at Mermaid compile | Snapshot companions only |
| Numeric `"confidence": 80` | Ordinal bands |
| Mint OpenAI / Search / Fabric when ARM type is absent | Stage empty |
| `terraform apply` / ARM writes | Plane |
| GTM **M-90 / M-44 / M-91 / M-92**; **TB-135 / TB-136** | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |
| Re-run AX-DE-01–18 / SN-DF / SN-PE as greenfield | Consume |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **SN-RT-01–10** and the plane.

## Done when

The hold is written. No code from this file.
