> **Scope:** Operational data retention and PII handling for engineers and authorized administrators.
>
> **Status:** current

# Data retention operations

Customer-facing retention summaries live in **[Security and trust](/help/security-trust)** and **[What ArchLucid does with your data](/help/data-handling)**.

## PII and conversation retention

- **Architecture requests and run payloads** may include system descriptions, URLs, and free text that operators paste from internal docs. Treat stored **run rows**, **context snapshots**, **agent traces** (including optional inline prompts when enabled), and **audit** entries as **tenant-scoped operational data**, not anonymous telemetry.
- **LLM calls:** When **`AgentExecution:TraceStorage:PersistFullPrompts`** or inline forensic columns are enabled, prompts and completions may be persisted in SQL and/or blob storage. Restrict access via **RBAC**, **private networking**, and **SQL/Key Vault** permissions aligned with your data classification policy.
- **Retention:** Default posture is **keep until archived/deleted by operator workflows** (see **[AUDIT_RETENTION_POLICY.md](../AUDIT_RETENTION_POLICY.md)** for audit export and tiering notes). For regulated environments, define **explicit retention / purge** runbooks per workspace and document them in deployment packages.
- **Exports:** Support bundles, DOCX/ZIP exports, and audit CSVs can contain **PII-sized** content; distribute only over approved channels and encrypt at rest in transit per org policy.

## SQL RLS break-glass bypass (removed)

> **[Removed 2026-06-06]** SQL Row-Level Security was removed per ADR 0037. `SqlRowLevelSecurityBypassAmbient`, `ARCHLUCID_ALLOW_RLS_BYPASS`, and related controls no longer exist. Database-per-tenant catalogs are the primary isolation mechanism; see ADR 0037.

## Related reads

- **[AUDIT_RETENTION_POLICY.md](../AUDIT_RETENTION_POLICY.md)** — audit export and tiering.
- **[DATA_HANDLING.md](../customer-facing/DATA_HANDLING.md)** — customer-facing data flow summary.
