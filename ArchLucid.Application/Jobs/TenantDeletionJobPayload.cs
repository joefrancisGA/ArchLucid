using System.Text.Json.Serialization;

namespace ArchLucid.Application.Jobs;

[method: JsonConstructor]
public sealed record TenantDeletionJobPayload(
    Guid TenantId,
    string RequestedByUserId,
    string RequestedByUserName,
    string? CorrelationId);
