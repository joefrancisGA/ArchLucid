namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Authorization facts only. Never includes draft text, answers, or the persisted read model.</summary>
public sealed record DraftRequestAccessMetadata(
    Guid DraftId,
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    Guid? ArchitectureId,
    string CreatedByUserId,
    string? PriorRunId,
    string? SpawnedRunId,
    DateTime UpdatedUtc);
