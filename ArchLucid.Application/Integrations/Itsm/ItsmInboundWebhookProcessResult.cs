using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Inbound ITSM webhook parse outcome and optional durable audit for API <c>IAuditService.LogAsync</c>.</summary>
public readonly record struct ItsmInboundWebhookProcessResult(bool Accepted, AuditEvent? DurableAuditEvent);
