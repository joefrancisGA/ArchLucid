> **Scope:** Paste-ready GPT-5.6 Luna prompts. Read an app setting or connection string, keep the hostname and target name, and discard the secret. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/declared-connection-host-00-index.md`](../../.cursor/prompts/declared-connection-host-00-index.md), [`.cursor/prompts/declared-connection-host-01-parse-secret-bearing-values.md`](../../.cursor/prompts/declared-connection-host-01-parse-secret-bearing-values.md), [`.cursor/prompts/declared-connection-host-02-connection-string-hosts.md`](../../.cursor/prompts/declared-connection-host-02-connection-string-hosts.md), [`.cursor/prompts/declared-connection-host-03-discard-before-write.md`](../../.cursor/prompts/declared-connection-host-03-discard-before-write.md), [`.cursor/prompts/declared-connection-host-04-operator-choice.md`](../../.cursor/prompts/declared-connection-host-04-operator-choice.md), [`.cursor/prompts/declared-connection-host-hold.md`](../../.cursor/prompts/declared-connection-host-hold.md)

# Declared connection hostnames — Luna prompts

**Created:** 2026-10-18 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

SecureNow is trusted to read an app setting long enough to learn which resource it names. The setting value is not evidence. The hostname, database or catalog name, storage account, and Key Vault host plus secret name are. Today `AzureInventoryAppSettingHostRedactor.ShouldRejectValue` and `Test-ArchLucidAzureAppSettingHostRejectedValue` return true for `Password=`, `AccountKey=`, `SharedAccessKey=`, `token=`, `secret=`, and `key=`, and both parsers return nothing. A normal SQL or storage connection string therefore never becomes a row in `app-settings-hosts.json`. Hosted pull never calls `config/list` and always records `app-settings-not-collected-hosted-get-only`.

AX-DE-18 already shipped the companion file, the Tier 1 switch `-IncludeAppSettingsHosts`, and the inferred hostname edge. This set changes the parse-and-discard rule and the operator choice. Do not re-run AX-DE-18.

| ID | Prompt | Intent |
|----|--------|--------|
| **DCH-01** | [declared-connection-host-01-parse-secret-bearing-values.md](../../.cursor/prompts/declared-connection-host-01-parse-secret-bearing-values.md) | A SQL or Key Vault setting that also contains a secret still yields the host, catalog, vault host, and secret name. |
| **DCH-02** | [declared-connection-host-02-connection-string-hosts.md](../../.cursor/prompts/declared-connection-host-02-connection-string-hosts.md) | Storage, Service Bus, Event Hub, Cosmos, and Redis connection strings yield the same kind of host row. The key stays out of the row. |
| **DCH-03** | [declared-connection-host-03-discard-before-write.md](../../.cursor/prompts/declared-connection-host-03-discard-before-write.md) | The raw value is absent from the companion, warnings, logs, and exceptions. |
| **DCH-04** | [declared-connection-host-04-operator-choice.md](../../.cursor/prompts/declared-connection-host-04-operator-choice.md) | SecureNow opts in. A Reader-only pull stays off. Hosted uses the same parser only when that choice is on. |
| **Hold** | [declared-connection-host-hold.md](../../.cursor/prompts/declared-connection-host-hold.md) | Out of scope for every session in this set. |

Run **DCH-01**, then **DCH-02**, then **DCH-03**, then **DCH-04**. Each session ends before commit. A package already collected does not grow new rows until the next collection that opts in.

A hostname edge stays inferred. It is evidence that configuration names a target, not evidence that traffic occurred.

## Do not pull into these sessions

- Reading a Key Vault secret value
- Kudu, SCM, disk, or ConfigMap scrapes
- Promoting a hostname match to an observed fact
- A second companion file or a second collector family
- Re-running **AX-DE-18**, **SN-RT**, or **NR-31** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
