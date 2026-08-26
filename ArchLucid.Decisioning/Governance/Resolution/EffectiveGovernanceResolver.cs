using System.Diagnostics;
using System.Text.Json;

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
public sealed class EffectiveGovernanceResolver(
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
    public async Task<ArchLucid.Contracts.Governance.Resolution.EffectiveGovernanceResolutionResult> ResolveAsync(
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

            bool focusedPilotMode = Core.Governance.PolicyPacks.PilotModeGovernanceScope.IsActive;

            List<PolicyPackAssignment> applicable = assignments
                .Where(x => AppliesToScope(x, tenantId, workspaceId, projectId))
                .Where(x => focusedPilotMode || x.IsEnabled)
                .ToList();

            List<EffectiveGovernanceFacetMerger.ResolvedPackRow> resolvedPacks = [];
            List<string> skippedNotes = [];

            if (focusedPilotMode)
                skippedNotes.Add(GovernanceConstants.Notes.FocusedPilotModeActive);

            // Cache deserialized content per (packId, version) — the same version may appear
            // across multiple scope-level assignments and deserializing the same JSON repeatedly
            // is pure waste.
            Dictionary<(Guid PackId, string Version), PolicyPackContentDocument> contentCache = [];

            IReadOnlyList<PolicyPack> loadedPacks = applicable.Count == 0
                ? Array.Empty<PolicyPack>()
                : await packRepository.GetByIdsAsync(
                    applicable.Select(static assignment => assignment.PolicyPackId).Distinct().ToList(),
                    ct);

            Dictionary<Guid, PolicyPack> packById = loadedPacks
                .Where(pack => ArchLucid.Core.Governance.PolicyPacks.PolicyPackVisibility.IsVisibleInScope(
                    pack,
                    tenantId,
                    workspaceId,
                    projectId))
                .ToDictionary(static pack => pack.PolicyPackId);

            foreach (PolicyPackAssignment assignment in applicable)
            {
                if (!packById.TryGetValue(assignment.PolicyPackId, out PolicyPack? pack))
                {
                    skippedNotes.Add(
                        string.Format(
                            GovernanceConstants.Notes.SkippedPackNotFound,
                            assignment.PolicyPackId));
                    continue;
                }

                if (focusedPilotMode && !Core.Governance.PolicyPacks.FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(
                        pack.Name,
                        assignment.IsPinned,
                        Core.Governance.PolicyPacks.PlatformOverlayPolicyPacks.IsOverlayDisplayName(
                            pack.Name,
                            Core.Governance.PolicyPacks.PilotModeGovernanceScope.ActiveCloudProvider)))
                {
                    skippedNotes.Add(
                        string.Format(
                            GovernanceConstants.Notes.SkippedFocusedPilotPack,
                            pack.Name,
                            assignment.PolicyPackId));
                    continue;
                }

                if (!await platformAvailability.IsGloballyActiveAsync(pack, ct))
                {
                    skippedNotes.Add(
                        string.Format(
                            GovernanceConstants.Notes.SkippedPackGloballyInactive,
                            pack.Name,
                            assignment.PolicyPackId));
                    continue;
                }

                PolicyPackVersion? version = await versionRepository
                        .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, ct)
                    ;

                if (version is null)
                {
                    skippedNotes.Add(
                        string.Format(
                            GovernanceConstants.Notes.SkippedVersionNotFound,
                            pack.Name,
                            assignment.PolicyPackId,
                            assignment.PolicyPackVersion));
                    continue;
                }

                (Guid, string) cacheKey = (assignment.PolicyPackId, assignment.PolicyPackVersion);

                if (!contentCache.TryGetValue(cacheKey, out PolicyPackContentDocument? content))
                {
                    try
                    {
                        content = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                            version.ContentJson,
                            PolicyPackJsonSerializerOptions.Default);
                    }
                    catch (JsonException ex)
                    {
                        skippedNotes.Add(
                            string.Format(
                                GovernanceConstants.Notes.SkippedCorruptJson,
                                pack.Name,
                                assignment.PolicyPackId,
                                assignment.PolicyPackVersion,
                                ex.Message));
                        continue;
                    }

                    if (content is null)
                    {
                        skippedNotes.Add(
                            string.Format(
                                GovernanceConstants.Notes.SkippedNullContent,
                                pack.Name,
                                assignment.PolicyPackId,
                                assignment.PolicyPackVersion));
                        continue;
                    }

                    contentCache[cacheKey] = content;
                    ArchLucidInstrumentation.GovernancePackContentDeserializeCacheMisses.Add(1);
                }
                else

                    ArchLucidInstrumentation.GovernancePackContentDeserializeCacheHits.Add(1);

                resolvedPacks.Add(new EffectiveGovernanceFacetMerger.ResolvedPackRow(assignment, pack, version, content));
            }

            EffectiveGovernanceResolutionResult result = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

            foreach (string note in skippedNotes)
                result.Notes.Add(note);

            EffectiveGovernanceFacetMerger.Merge(result, resolvedPacks);

            return result;
        }
        finally
        {
            resolveWallClock.Stop();
            ArchLucidInstrumentation.GovernanceResolveDurationMilliseconds.Record(
                resolveWallClock.Elapsed.TotalMilliseconds);
        }
    }

    /// <summary>
    ///     Determines whether an assignment row applies to the runtime project context, independent of repository SQL details.
    /// </summary>
    /// <remarks>
    ///     Called only from <see cref="ResolveAsync" />. Tenant rows ignore workspace/project columns; workspace rows require
    ///     workspace match;
    ///     project rows require both workspace and project match.
    /// </remarks>
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
            _ => false
        };
    }

    /// <summary>
    ///     Computes a single sortable rank: base tier (tenant 1000, workspace 2000, project 3000) plus 100 when
    ///     <see cref="PolicyPackAssignment.IsPinned" />.
    /// </summary>
    /// <remarks>
    ///     <strong>Why tier &gt; pin:</strong> an unpinned project assignment (3000) still beats a pinned tenant assignment
    ///     (1100), so scope always wins over pin.
    ///     Exposed as <c>internal</c> for unit tests. Used by <see cref="EffectiveGovernanceFacetMerger" />.
    /// </remarks>
    internal static int GetPrecedenceRank(PolicyPackAssignment assignment)
    {
        int tier = assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => GovernanceConstants.PrecedenceTiers.Tenant,
            GovernanceScopeLevel.Workspace => GovernanceConstants.PrecedenceTiers.Workspace,
            GovernanceScopeLevel.Project => GovernanceConstants.PrecedenceTiers.Project,
            _ => 0
        };

        return assignment.IsPinned ? tier + GovernanceConstants.PrecedenceTiers.PinnedBoost : tier;
    }
}
