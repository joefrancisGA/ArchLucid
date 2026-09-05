using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Default <see cref="IPolicyPackManagementService" /> implementation: orchestrates create / publish / assign stages.
/// </summary>
public sealed class PolicyPackManagementService(
    IPolicyPackCreateStage createStage,
    IPolicyPackPublishStage publishStage,
    IPolicyPackAssignStage assignStage) : IPolicyPackManagementService
{
    private readonly IPolicyPackCreateStage _createStage =
        createStage ?? throw new ArgumentNullException(nameof(createStage));

    private readonly IPolicyPackPublishStage _publishStage =
        publishStage ?? throw new ArgumentNullException(nameof(publishStage));

    private readonly IPolicyPackAssignStage _assignStage =
        assignStage ?? throw new ArgumentNullException(nameof(assignStage));

    /// <inheritdoc />
    public Task<PolicyPack> CreatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct) =>
        _createStage.CreatePackAsync(tenantId, workspaceId, projectId, name, description, packType, initialContentJson, ct);

    /// <inheritdoc />
    public Task<PolicyPackVersion> PublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct) =>
        _publishStage.PublishVersionAsync(policyPackId, version, contentJson, ct);

    /// <inheritdoc />
    public Task<PolicyPackAssignment> AssignAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        bool isOrganizationRequired = false,
        bool isEnabled = true,
        CancellationToken ct = default) =>
        _assignStage.AssignAsync(
            tenantId,
            workspaceId,
            projectId,
            policyPackId,
            version,
            scopeLevel,
            isPinned,
            isOrganizationRequired,
            isEnabled,
            ct);

    /// <inheritdoc />
    public Task<bool> TryArchiveAssignmentAsync(Guid tenantId, Guid assignmentId, CancellationToken ct) =>
        _assignStage.TryArchiveAssignmentAsync(tenantId, assignmentId, ct);
}
