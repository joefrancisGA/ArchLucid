# Integration events and webhook interoperability

## CloudEvents on HTTP webhooks

When `WebhookDelivery:UseCloudEventsEnvelope` is **true**, digest and alert webhook POST bodies are wrapped in a [CloudEvents 1.0](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md) JSON envelope (`specversion`, `type`, `source`, `id`, `time`, `datacontenttype`, `data`). The existing HMAC header still signs the **final** JSON (the envelope).

- Configure `CloudEventsSource` and `CloudEventsType` under `WebhookDelivery` if you need stable routing keys for external receivers.

## Azure Service Bus (optional)

`IIntegrationEventPublisher` publishes UTF-8 JSON payloads after selected lifecycle events (e.g. authority run completed). Messages include a deterministic `messageId` when publishing directly or from the outbox (for Service Bus duplicate detection when enabled on the queue/topic).

**Managed identity (preferred in Azure):** set the namespace FQDN and queue/topic name. Optionally set `ServiceBusManagedIdentityClientId` for a user-assigned identity.

```json
"IntegrationEvents": {
  "ServiceBusFullyQualifiedNamespace": "mysb.servicebus.windows.net",
  "ServiceBusManagedIdentityClientId": "",
  "QueueOrTopicName": "archiforge-integration-events"
}
```

**Connection string (legacy bootstrap):** still supported when the namespace is not set.

```json
"IntegrationEvents": {
  "ServiceBusConnectionString": "<connection-string>",
  "QueueOrTopicName": "archiforge-integration-events"
}
```

**Transactional outbox:** when `TransactionalOutboxEnabled` is **true** and storage is **Sql**, the run-completed event is written to `dbo.IntegrationEventOutbox` in the same SQL transaction as the authority commit; a worker leader publishes rows asynchronously.

When no usable Service Bus configuration is present, a **no-op** publisher is registered.

- Use a **queue** for simplest at-least-once delivery; use a **topic** with subscriptions for fan-out.
- Grant the API/worker identity **Azure Service Bus Data Sender** on the namespace when using managed identity.

## Event type: `com.archiforge.authority.run.completed`

Payload shape (UTF-8 JSON):

```json
{
  "runId": "...",
  "manifestId": "...",
  "tenantId": "...",
  "workspaceId": "...",
  "projectId": "..."
}
```

Publish failures are logged as warnings and **do not** roll back the committed authority run. With the transactional outbox, failed sends leave the row pending for retry until `MarkProcessed` succeeds.
