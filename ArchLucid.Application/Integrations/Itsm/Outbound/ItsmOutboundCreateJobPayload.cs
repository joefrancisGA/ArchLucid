using System.Text.Json.Serialization;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Scope + finding context serialized for durable ITSM outbound create jobs (TB-394).</summary>
[method: JsonConstructor]
public sealed record ItsmOutboundCreateJobPayload(
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    string FindingId,
    ItsmOutboundIssueProvider Provider,
    string? CorrelationId);
