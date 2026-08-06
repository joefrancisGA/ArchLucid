# 70. SQL open resilience

Transient SQL open/operation failures use Polly v8 exponential backoff with jitter, separate from product kill-switches. Read-replica and audit paths share the same transient detector so brownouts degrade to retries rather than silent partial writes.

![SQL open resilience](../architecture_diagrams/archlucid-sql-open-resilience.svg)
