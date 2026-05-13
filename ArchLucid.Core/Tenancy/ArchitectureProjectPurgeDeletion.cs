namespace ArchLucid.Core.Tenancy;

/// <summary>One architecture project row physically removed by retention purge (audit input).</summary>
public sealed record ArchitectureProjectPurgeDeletion(Guid ProjectId, Guid TenantId, Guid WorkspaceId);
