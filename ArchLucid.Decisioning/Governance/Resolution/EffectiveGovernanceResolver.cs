using System.Diagnostics;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using IPlatformBundledPolicyPackAvailability = ArchLucid.Core.Governance.PolicyPacks.IPlatformBundledPolicyPackAvailability;

namespace ArchLucid.Decisioning.Governance.Resolution;

/// <summary>
///     Default <see cref="IEffectiveGovernanceResolver" />: merges applicable pack contents into one
///     <see cref="PolicyPackContentDocument" />
///     using explicit precedence (project &gt; workspace &gt; tenant, pin boost, then
///     <see cref="PolicyPackAssignment.AssignedUtc" />).
/// </summary>
/// <remarks>
///     <para>
///         <strong>Why:</strong> Enterprise governance is layered; operators need deterministic “effective” state and an
///         explainable trace
///         (<see cref="GovernanceResolutionDecision" />, <see cref="GovernanceConflictRecord" />) for audits and the
///         governance-resolution API.
///     </para>
///     <para>
///         <strong>Callers:</strong> <see cref="EffectiveGovernanceLoader" />, HTTP governance-resolution endpoint (API
///         layer), and
///         <c>EffectiveGovernanceResolverTests</c>.
///     </para>
/// </remarks>
/// <param name="assignmentRepository">Supplies hierarchical assignment rows for the scope.</param>
/// <param name="packRepository">Resolves pack metadata for each assignment.</param>
/// <param name="versionRepository">Loads <c>ContentJson</c> for the assigned version string.</param>
public sealed partial class EffectiveGovernanceResolver(
    IPolicyPackAssignmentRepository assignmentRepository,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPlatformBundledPolicyPackAvailability platformAvailability) : IEffectiveGovernanceResolver
{
    /// <inheritdoc />
    /// <remarks>
    ///     Pipeline: (1) list assignments, (2) filter enabled + <see cref="AppliesToScope" />, (3) load pack/version and
    ///     deserialize JSON
    ///     (skip bad rows), (4) merge each facet via <see cref="EffectiveGovernanceFacetMerger" />.
    ///     Appends human-readable counts to <see cref="EffectiveGovernanceResolutionResult.Notes" />.
    /// </remarks>
    public async Task<EffectiveGovernanceResolutionResult> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        Stopwatch resolveWallClock = Stopwatch.StartNew();

        try
        {
            IReadOnlyList<PolicyPackAssignment> assignments = await assignmentRepository
                    .ListByScopeAsync(tenantId, workspaceId, projectId, ct)
                ;

            List<PolicyPackAssignment> applicable = FilterApplicableAssignments(
                assignments,
                tenantId,
                workspaceId,
                projectId);

            (List<EffectiveGovernanceFacetMerger.ResolvedPackRow> resolvedPacks, List<string> skippedNotes) =
                await LoadResolvedPacksAsync(applicable, tenantId, workspaceId, projectId, ct);

            return BuildResolutionResult(tenantId, workspaceId, projectId, resolvedPacks, skippedNotes);
        }
        finally
        {
            resolveWallClock.Stop();
            ArchLucidInstrumentation.GovernanceResolveDurationMilliseconds.Record(
                resolveWallClock.Elapsed.TotalMilliseconds);
        }
    }
}
