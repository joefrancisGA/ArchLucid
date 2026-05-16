namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>
///     Seeds first-party <see cref="ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackType.PlatformDefault" /> packs
///     for a tenant's default workspace/project scope.
/// </summary>
public interface IDefaultPolicyPackSeeder
{
    /// <summary>
    ///     Idempotent: creates, publishes, and assigns v1 defaults when missing for the given scope.
    /// </summary>
    Task EnsureDefaultPolicyPacksAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct);
}
