# 1. System context (buyer)

ArchLucid is an Azure-first architecture authority platform: operators use the architect workspace; automation calls the versioned API; SQL holds authoritative run state; Worker drains outboxes; Azure OpenAI / Service Bus / Blob are optional depending on profile.

![System overview](../../architecture_diagrams/archlucid-system-overview.svg)

![Review happy path](../../architecture_diagrams/archlucid-review-happy-path.svg)
