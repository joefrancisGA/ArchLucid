<!-- Declared connection hostnames — Luna prompts.
     Origin: 2026-10-18. Read an app setting, keep the host and target name, discard the value.
     Do not implement from this index. -->

# Declared connection hostnames — prompt set (DCH-01–DCH-04)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/declared-connection-host-*.md` file per session.

Record: [`docs/architecture/DECLARED_CONNECTION_HOST_LUNA_PROMPTS.md`](../../docs/architecture/DECLARED_CONNECTION_HOST_LUNA_PROMPTS.md).

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Secret-bearing SQL and Key Vault** | `Password=` or `secret=` drops the whole value, so the host is lost. | The host, catalog, vault host, and secret name are kept. The secret text is not. | **DCH-01** |
| **Other connection strings** | Storage, Service Bus, Event Hub, Cosmos, and Redis strings that carry a key produce no row. | Those strings produce the same host row. The key is not stored. | **DCH-02** |
| **Discard** | A future log or warning can still echo the value that was just parsed. | Companion JSON, warnings, logs, and exceptions contain the setting name and the host only. | **DCH-03** |
| **Choice** | Hosted pull never reads app settings. The diagrams page says values are never collected. | SecureNow opts in. Reader-only stays off and keeps the existing warning. | **DCH-04** |

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04.**

**DCH-02** follows **DCH-01**. **DCH-03** follows **DCH-02**. **DCH-04** follows **DCH-03**. Do not re-run AX-DE-18.

## Prompt files (paste one per session)

| # | File | What it changes |
|---|------|-----------------|
| 01 | `declared-connection-host-01-parse-secret-bearing-values.md` | SQL and Key Vault values that also contain a secret still yield a host row |
| 02 | `declared-connection-host-02-connection-string-hosts.md` | Storage, Service Bus, Event Hub, Cosmos, and Redis hosts |
| 03 | `declared-connection-host-03-discard-before-write.md` | The raw value never leaves the parser |
| 04 | `declared-connection-host-04-operator-choice.md` | SecureNow opt-in, including hosted `config/list` |
| Hold | `declared-connection-host-hold.md` | Out of scope. Do not paste this as implementation work. |
