# 1. System context (security)

ArchLucid is an Azure-first architecture authority platform. Operators use the architect workspace; automation calls the versioned API; SQL holds authoritative run state; Worker drains outboxes. Security review starts from this boundary picture, then zooms into controls below.

![System overview](../../architecture_diagrams/archlucid-system-overview.svg)
