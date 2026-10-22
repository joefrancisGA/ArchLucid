using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-11 suggestion 109: synthesize commit-time governance assignments from create-time policy pack pins.
/// </summary>
public static class RunHeaderPinnedPolicyPackAssignmentFactory
{
    public static IReadOnlyList<PolicyPackAssignment> BuildSyntheticAssignments(RunRecord header, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(header.PinnedPolicyPackIdsJson))
            return [];

        if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(
                header.PinnedPolicyPackIdsJson,
                out PinnedPolicyPackRow[] pinnedRows))
        {
            throw new ConflictException(
                "Commit blocked: policy pack pin JSON is not a valid PinnedPolicyPackRow array.");
        }

        List<PolicyPackAssignment> assignments = [];

        foreach (PinnedPolicyPackRow row in pinnedRows)
        {
            if (!Guid.TryParse(row.PolicyPackId, out Guid packId))
            {
                throw new ConflictException(
                    $"Commit blocked: pinned policy pack id '{row.PolicyPackId}' is not a valid GUID.");
            }

            assignments.Add(
                new PolicyPackAssignment
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    PolicyPackId = packId,
                    PolicyPackVersion = row.PolicyPackVersion,
                    IsEnabled = true,
                    IsPinned = true,
                    ScopeLevel = GovernanceScopeLevel.Project,
                    BlockCommitOnCritical = row.BlockCommitOnCritical,
                    BlockCommitMinimumSeverity = row.BlockCommitMinimumSeverity,
                });
        }

        return assignments;
    }

    /// <summary>
    ///     Wave-12 suggestion 118: commit/finalize paths must not fall back to live scope assignments.
    /// </summary>
    public static IReadOnlyList<PolicyPackAssignment> ResolveCommitTimeAssignmentsOrThrow(
        RunRecord header,
        ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(header.PinnedPolicyPackIdsJson))
        {
            throw new ConflictException(
                "Governance evaluation blocked: run is missing create-time policy pack pins.");
        }

        return BuildSyntheticAssignments(header, scope);
    }

    /// <summary>
    ///     Resolves pin-derived assignments and merges commit-blocking flags from scope rows matching pinned pack ids only.
    /// </summary>
    public static async Task<IReadOnlyList<PolicyPackAssignment>> ResolveCommitTimeAssignmentsWithEnforcementAsync(
        RunRecord header,
        ScopeContext scope,
        IPolicyPackAssignmentRepository assignmentRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(assignmentRepository);

        IReadOnlyList<PolicyPackAssignment> pinned = ResolveCommitTimeAssignmentsOrThrow(header, scope);

        if (pinned.Count == 0)
            return pinned;

        return await MergeEnforcementFromPinnedScopeAssignmentsAsync(
            pinned,
            scope,
            assignmentRepository,
            cancellationToken).ConfigureAwait(false);
    }

    internal static async Task<IReadOnlyList<PolicyPackAssignment>> MergeEnforcementFromPinnedScopeAssignmentsAsync(
        IReadOnlyList<PolicyPackAssignment> pinnedAssignments,
        ScopeContext scope,
        IPolicyPackAssignmentRepository assignmentRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(pinnedAssignments);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(assignmentRepository);

        if (pinnedAssignments.Count == 0)
            return pinnedAssignments;

        HashSet<Guid> pinnedPackIds = pinnedAssignments.Select(static assignment => assignment.PolicyPackId).ToHashSet();

        IReadOnlyList<PolicyPackAssignment> scopeAssignments = await assignmentRepository
            .ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        Dictionary<Guid, PolicyPackAssignment> scopeByPackId = scopeAssignments
            .Where(assignment => pinnedPackIds.Contains(assignment.PolicyPackId))
            .GroupBy(static assignment => assignment.PolicyPackId)
            .ToDictionary(
                static group => group.Key,
                static group => group.OrderByDescending(static assignment => assignment.AssignedUtc).First());

        List<PolicyPackAssignment> merged = [];

        foreach (PolicyPackAssignment pinned in pinnedAssignments)
        {
            if (!scopeByPackId.TryGetValue(pinned.PolicyPackId, out PolicyPackAssignment? scopeAssignment))
            {
                merged.Add(pinned);
                continue;
            }

            merged.Add(
                new PolicyPackAssignment
                {
                    TenantId = pinned.TenantId,
                    WorkspaceId = pinned.WorkspaceId,
                    ProjectId = pinned.ProjectId,
                    PolicyPackId = pinned.PolicyPackId,
                    PolicyPackVersion = pinned.PolicyPackVersion,
                    IsEnabled = scopeAssignment.IsEnabled,
                    IsPinned = pinned.IsPinned,
                    ScopeLevel = pinned.ScopeLevel,
                    AssignedUtc = scopeAssignment.AssignedUtc,
                    BlockCommitOnCritical = scopeAssignment.BlockCommitOnCritical,
                    BlockCommitMinimumSeverity = scopeAssignment.BlockCommitMinimumSeverity,
                });
        }

        return merged;
    }
}
