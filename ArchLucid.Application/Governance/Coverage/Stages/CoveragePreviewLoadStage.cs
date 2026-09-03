using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage.Stages;

/// <inheritdoc cref="ICoveragePreviewLoadStage" />
public sealed class CoveragePreviewLoadStage(
    IPolicyPackRepository packRepository,
    IPolicyPackAssignmentRepository assignmentRepository) : ICoveragePreviewLoadStage
{
    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackAssignmentRepository _assignmentRepository =
        assignmentRepository ?? throw new ArgumentNullException(nameof(assignmentRepository));

    public async Task<CoveragePreviewLoadResult> LoadAsync(ScopeContext scope, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<PolicyPack> packs =
            await _packRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

        IReadOnlyList<PolicyPackAssignment> assignments =
            await _assignmentRepository.ListByScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken);

        Dictionary<string, PolicyPack> packByName = packs
            .Where(pack => !pack.IsDeleted)
            .GroupBy(pack => pack.Name, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<Guid, PolicyPackAssignment> assignmentByPackId = assignments
            .Where(assignment => AppliesToScope(assignment, scope))
            .GroupBy(assignment => assignment.PolicyPackId)
            .ToDictionary(group => group.Key, group => group.First());

        return new CoveragePreviewLoadResult
        {
            Packs = packs,
            Assignments = assignments,
            PackByName = packByName,
            AssignmentByPackId = assignmentByPackId,
        };
    }

    private static bool AppliesToScope(PolicyPackAssignment assignment, ScopeContext scope)
    {
        if (assignment.TenantId != scope.TenantId)
            return false;

        return assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => true,
            GovernanceScopeLevel.Workspace => assignment.WorkspaceId == scope.WorkspaceId,
            GovernanceScopeLevel.Project => assignment.WorkspaceId == scope.WorkspaceId
                && assignment.ProjectId == scope.ProjectId,
            _ => false,
        };
    }
}
