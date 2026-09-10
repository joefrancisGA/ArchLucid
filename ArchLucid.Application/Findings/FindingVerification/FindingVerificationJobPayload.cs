using System.Text.Json.Serialization;

namespace ArchLucid.Application.Findings.FindingVerification;

/// <summary>Durable background job payload for ADR 0062 verification passes.</summary>
[method: JsonConstructor]
public sealed record FindingVerificationJobPayload(
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    Guid RunId,
    Guid? VerificationFindingsSnapshotId,
    string TriggeredByUserId,
    string? CorrelationId);
