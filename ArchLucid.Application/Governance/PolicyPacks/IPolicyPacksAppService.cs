using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>
/// Application-layer orchestration for policy pack mutations: delegates to <see cref="IPolicyPackManagementService"/> and emits audit events.
/// </summary>
public interface IPolicyPacksAppService
{
    Task<PolicyPack> CreatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct);

    Task<PolicyPackVersion> PublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct);

    Task<PolicyPackAssignment?> TryAssignAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        bool isOrganizationRequired,
        CancellationToken ct);

    Task<bool> TryArchiveAssignmentAsync(Guid tenantId, Guid assignmentId, CancellationToken ct);

    Task<bool> TrySoftDeletePackAsync(Guid tenantId, Guid policyPackId, CancellationToken ct);

    Task<PolicyPack?> TryDuplicatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        CancellationToken ct);
}
