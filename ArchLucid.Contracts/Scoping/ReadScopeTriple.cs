namespace ArchLucid.Contracts.Scoping;

/// <summary>
///     Tenant/workspace/project triple for scoped repository reads in contract assemblies that cannot reference Core.
/// </summary>
public readonly record struct ReadScopeTriple(Guid TenantId, Guid WorkspaceId, Guid ProjectId);
