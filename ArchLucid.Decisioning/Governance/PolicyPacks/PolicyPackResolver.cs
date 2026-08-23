using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Default <see cref="IPolicyPackResolver" />: loads hierarchical assignments, filters
///     <see cref="PolicyPackAssignment.IsEnabled" />,
///     and attaches each pack’s <see cref="PolicyPackVersion.ContentJson" />.
/// </summary>
/// <remarks>
///     Differs from <see cref="IEffectiveGovernanceResolver" /> in that it does not merge IDs/dictionaries or emit
///     decisions/conflicts.
///     Used for operator visibility of “which packs are attached” (see HTTP effective-set endpoint).
/// </remarks>
public sealed class PolicyPackResolver(
    IPolicyPackAssignmentRepository assignmentRepository,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPlatformBundledPolicyPackAvailability platformAvailability) : IPolicyPackResolver
{
    /// <inheritdoc />
    /// <remarks>
    ///     Iterates assignments in repository order (typically <see cref="PolicyPackAssignment.AssignedUtc" /> descending).
    ///     Missing <see cref="PolicyPack" /> or <see cref="PolicyPackVersion" /> causes that assignment to be skipped
    ///     (orphan-safe).
    /// </remarks>
    public async Task<ArchLucid.Contracts.Governance.PolicyPacks.EffectivePolicyPackSet> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        IReadOnlyList<PolicyPackAssignment> assignments = await assignmentRepository
                .ListByScopeAsync(tenantId, workspaceId, projectId, ct)
            ;

        bool focusedPilotMode = PilotModeGovernanceScope.IsActive;

        EffectivePolicyPackSet result = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        foreach (PolicyPackAssignment assignment in assignments)
        {
            if (!AppliesToScope(assignment, tenantId, workspaceId, projectId))
                continue;

            if (!focusedPilotMode && !assignment.IsEnabled)
                continue;

            PolicyPack? pack = await packRepository.GetByIdAsync(assignment.PolicyPackId, ct);

            if (pack is null)
                continue;

            if (focusedPilotMode && !FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(
                    pack.Name,
                    assignment.IsPinned,
                    PlatformOverlayPolicyPacks.IsOverlayDisplayName(
                        pack.Name,
                        PilotModeGovernanceScope.ActiveCloudProvider)))
                continue;

            if (!await platformAvailability.IsGloballyActiveAsync(pack, ct))
                continue;

            PolicyPackVersion? version = await versionRepository
                    .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, ct)
                ;

            if (version is null)
                continue;

            result.Packs.Add(
                new ResolvedPolicyPack
                {
                    PolicyPackId = pack.PolicyPackId,
                    Name = pack.Name,
                    Version = version.Version,
                    PackType = pack.PackType,
                    ContentJson = version.ContentJson,
                    QualityDimension = pack.QualityDimension,
                });
        }

        return result;
    }

    private static bool AppliesToScope(
        PolicyPackAssignment assignment,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        if (assignment.TenantId != tenantId)
            return false;

        return assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => true,
            GovernanceScopeLevel.Workspace => assignment.WorkspaceId == workspaceId,
            GovernanceScopeLevel.Project => assignment.WorkspaceId == workspaceId && assignment.ProjectId == projectId,
            _ => false,
        };
    }
}

