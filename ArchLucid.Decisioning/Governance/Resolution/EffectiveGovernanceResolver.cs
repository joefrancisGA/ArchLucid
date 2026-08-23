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
    ///     (skip bad rows), (4) merge each facet via <see cref="ResolveGuidIdList" />, <see cref="ResolveStringKeyList" />,
    ///     <see cref="ResolveDictionary" />.
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

            List<ResolvedPackRow> resolvedPacks = [];
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

            Dictionary<Guid, PolicyPack> packById = loadedPacks.ToDictionary(static pack => pack.PolicyPackId);

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

                resolvedPacks.Add(new ResolvedPackRow(assignment, pack, version, content));
            }

            EffectiveGovernanceResolutionResult result = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

            foreach (string note in skippedNotes)
                result.Notes.Add(note);

            ResolveGuidIdList(
                result,
                GovernanceConstants.ItemTypes.ComplianceRule,
                resolvedPacks,
                x => x.Content.ComplianceRuleIds,
                (content, ids) => content.ComplianceRuleIds = ids);

            ResolveStringKeyList(
                result,
                GovernanceConstants.ItemTypes.ComplianceRuleKey,
                resolvedPacks,
                x => x.Content.ComplianceRuleKeys,
                (content, keys) => content.ComplianceRuleKeys = keys);

            ResolveGuidIdList(
                result,
                GovernanceConstants.ItemTypes.AlertRule,
                resolvedPacks,
                x => x.Content.AlertRuleIds,
                (content, ids) => content.AlertRuleIds = ids);

            ResolveGuidIdList(
                result,
                GovernanceConstants.ItemTypes.CompositeAlertRule,
                resolvedPacks,
                x => x.Content.CompositeAlertRuleIds,
                (content, ids) => content.CompositeAlertRuleIds = ids);

            ResolveDictionary(
                result,
                GovernanceConstants.ItemTypes.AdvisoryDefault,
                resolvedPacks,
                x => x.Content.AdvisoryDefaults,
                (content, dict) => content.AdvisoryDefaults = dict);

            ResolveDictionary(
                result,
                GovernanceConstants.ItemTypes.Metadata,
                resolvedPacks,
                x => x.Content.Metadata,
                (content, dict) => content.Metadata = dict);

            ResolveElicitationQuestionList(result, resolvedPacks);

            result.Notes.Add(string.Format(GovernanceConstants.Notes.ResolvedAssignmentCount, resolvedPacks.Count));
            result.Notes.Add(string.Format(GovernanceConstants.Notes.ProducedDecisionCount, result.Decisions.Count));
            result.Notes.Add(string.Format(GovernanceConstants.Notes.DetectedConflictCount, result.Conflicts.Count));

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
    ///     Exposed as <c>internal</c> for unit tests. Used by <see cref="OrderCandidates" />.
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

    /// <summary>Projects a <see cref="ResolvedPackRow" /> into a <see cref="GovernanceResolutionCandidate" /> for UI/API.</summary>
    /// <remarks>Called from resolve-* helpers when building candidate lists per item key.</remarks>
    private static GovernanceResolutionCandidate ToCandidate(ResolvedPackRow row, string valueJson)
    {
        PolicyPackAssignment a = row.Assignment;
        return new GovernanceResolutionCandidate
        {
            PolicyPackId = row.Pack.PolicyPackId,
            PolicyPackName = row.Pack.Name,
            Version = row.Version.Version,
            ScopeLevel = a.ScopeLevel,
            PrecedenceRank = GetPrecedenceRank(a),
            ValueJson = valueJson,
            AssignmentId = a.AssignmentId,
            AssignedUtc = a.AssignedUtc
        };
    }

    /// <summary>
    ///     Deterministic ordering: higher <see cref="GovernanceResolutionCandidate.PrecedenceRank" />, then newer
    ///     <see cref="GovernanceResolutionCandidate.AssignedUtc" />, then
    ///     <see cref="GovernanceResolutionCandidate.AssignmentId" />.
    /// </summary>
    /// <remarks>Shared by all merge strategies so ties never depend on enumeration order.</remarks>
    private static List<GovernanceResolutionCandidate> OrderCandidates(
        IEnumerable<GovernanceResolutionCandidate> candidates)
    {
        return candidates
            .OrderByDescending(c => c.PrecedenceRank)
            .ThenByDescending(c => c.AssignedUtc)
            .ThenByDescending(c => c.AssignmentId)
            .ToList();
    }

    /// <summary>Builds operator-facing text explaining why the first candidate in an ordered list won.</summary>
    /// <remarks>Called when appending <see cref="GovernanceResolutionDecision.ResolutionReason" />.</remarks>
    private static string BuildResolutionReason(List<GovernanceResolutionCandidate> ordered)
    {
        if (ordered.Count == 0)
            return GovernanceConstants.ResolutionReasons.NoCandidates;

        if (ordered.Count == 1)
            return GovernanceConstants.ResolutionReasons.SingleCandidate;

        GovernanceResolutionCandidate winner = ordered[0];
        GovernanceResolutionCandidate second = ordered[1];

        if (winner.PrecedenceRank != second.PrecedenceRank)
            return GovernanceConstants.ResolutionReasons.HigherScopeTier;

        return winner.AssignedUtc != second.AssignedUtc
            ? GovernanceConstants.ResolutionReasons.SameTierNewerAssignment
            : GovernanceConstants.ResolutionReasons.SameTierTieBreak;
    }

    /// <summary>
    ///     Merges a list-valued facet keyed by <see cref="Guid" /> (e.g. compliance / alert rule ids): union of distinct ids,
    ///     winner per id.
    /// </summary>
    /// <remarks>
    ///     Emits <see cref="GovernanceConflictRecord" /> with <c>DuplicateDefinition</c> when multiple packs mention the same
    ///     id.
    ///     Invoked from <see cref="ResolveAsync" /> for ComplianceRule, AlertRule, and CompositeAlertRule facets.
    /// </remarks>
    private static void ResolveGuidIdList(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, List<Guid>?> selector,
        Action<PolicyPackContentDocument, List<Guid>> setter)
    {
        List<Guid> allIds = packs
            .SelectMany(x => selector(x) ?? [])
            .Distinct()
            .ToList();

        List<Guid> effective = [];

        foreach (Guid id in allIds)
        {
            string raw = id.ToString("D");
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(x => (selector(x) ?? []).Contains(id))
                    .Select(x => ToCandidate(x, raw)));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            effective.Add(id);

            GovernanceFacetResolutionRecorder.RecordWinnerWithDuplicateConflict(
                result,
                itemType,
                raw,
                candidates,
                BuildResolutionReason(candidates),
                string.Format(GovernanceConstants.Notes.DuplicateDefinitionItem, itemType));
        }

        setter(result.EffectiveContent, effective);
    }

    /// <summary>
    ///     Merges string list facets (e.g. <see cref="PolicyPackContentDocument.ComplianceRuleKeys" />) with
    ///     case-insensitive key equality.
    /// </summary>
    /// <remarks>
    ///     Stores JSON-encoded <see cref="GovernanceResolutionCandidate.ValueJson" /> for keys so UI can show quoted strings
    ///     consistently.
    ///     <c>DuplicateDefinition</c> conflicts when the same key appears in multiple packs.
    /// </remarks>
    private static void ResolveStringKeyList(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, List<string>?> selector,
        Action<PolicyPackContentDocument, List<string>> setter)
    {
        List<string> allKeys = packs
            .SelectMany(x => selector(x) ?? [])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> effective = [];

        foreach (string key in allKeys)
        {
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(x => (selector(x) ?? []).Contains(key, StringComparer.OrdinalIgnoreCase))
                    .Select(x =>
                    {
                        List<string> list = selector(x) ?? [];
                        string v = list.First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
                        return ToCandidate(x, JsonSerializer.Serialize(v, PolicyPackJsonSerializerOptions.Default));
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            string canonical = packs
                .SelectMany(x => selector(x) ?? [])
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
            effective.Add(canonical);

            GovernanceFacetResolutionRecorder.RecordWinnerWithDuplicateConflict(
                result,
                itemType,
                canonical,
                candidates,
                BuildResolutionReason(candidates),
                string.Format(GovernanceConstants.Notes.DuplicateDefinitionKey, itemType));
        }

        setter(result.EffectiveContent, effective);
    }

    /// <summary>
    ///     Merges dictionary facets (<see cref="PolicyPackContentDocument.AdvisoryDefaults" />,
    ///     <see cref="PolicyPackContentDocument.Metadata" />):
    ///     last-winner per key by precedence; <c>ValueConflict</c> when values differ across packs.
    /// </summary>
    /// <remarks>
    ///     Unlike id lists, duplicate keys with identical values do not produce a value conflict—only
    ///     <see cref="GovernanceResolutionDecision" /> entries.
    /// </remarks>
    private static void ResolveDictionary(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, Dictionary<string, string>?> selector,
        Action<PolicyPackContentDocument, Dictionary<string, string>> setter)
    {
        List<string> keys = packs
            .SelectMany(x => (selector(x) ?? []).Keys)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

#pragma warning disable IDE0028 // Simplify collection initialization
        Dictionary<string, string> effective = new(StringComparer.OrdinalIgnoreCase);
#pragma warning restore IDE0028 // Simplify collection initialization

        foreach (string key in keys)
        {
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(x =>
                        (selector(x) ?? []).Keys.Any(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase)))
                    .Select(x =>
                    {
                        Dictionary<string, string> dict = selector(x) ?? [];
                        string actualKey =
                            dict.Keys.First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
                        string val = dict[actualKey];
                        return ToCandidate(x, val);
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            string canonicalKey = packs
                .SelectMany(x => (selector(x) ?? []).Keys)
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
            effective[canonicalKey] = candidates[0].ValueJson;

            GovernanceFacetResolutionRecorder.RecordWinner(
                result,
                itemType,
                canonicalKey,
                candidates,
                BuildResolutionReason(candidates));

            GovernanceFacetResolutionRecorder.RecordValueConflict(
                result,
                itemType,
                canonicalKey,
                candidates,
                string.Format(GovernanceConstants.Notes.ValueConflict, itemType, canonicalKey));
        }

        setter(result.EffectiveContent, effective);
    }

    /// <summary>
    ///     Merges <see cref="PolicyPackContentDocument.ElicitationQuestions" /> by <see cref="ElicitationQuestion.QuestionKey" />
    ///     with the same precedence rules as other list facets.
    /// </summary>
    private static void ResolveElicitationQuestionList(
        EffectiveGovernanceResolutionResult result,
        List<ResolvedPackRow> packs)
    {
        List<string> allKeys = packs
            .SelectMany(static row => row.Content.ElicitationQuestions)
            .Select(static question => question.QuestionKey)
            .Where(static key => !string.IsNullOrWhiteSpace(key))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<ElicitationQuestion> effective = [];

        foreach (string key in allKeys)
        {
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(row => row.Content.ElicitationQuestions.Exists(question =>
                        string.Equals(question.QuestionKey, key, StringComparison.OrdinalIgnoreCase)))
                    .Select(row =>
                    {
                        ElicitationQuestion question = row.Content.ElicitationQuestions.First(q =>
                            string.Equals(q.QuestionKey, key, StringComparison.OrdinalIgnoreCase));

                        string valueJson = JsonSerializer.Serialize(question, PolicyPackJsonSerializerOptions.Default);

                        return ToCandidate(row, valueJson);
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;

            ElicitationQuestion? winningQuestion = JsonSerializer.Deserialize<ElicitationQuestion>(
                candidates[0].ValueJson,
                PolicyPackJsonSerializerOptions.Default);

            if (winningQuestion is null)
                continue;

            effective.Add(winningQuestion);

            string canonicalKey = packs
                .SelectMany(static row => row.Content.ElicitationQuestions)
                .Select(static question => question.QuestionKey)
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));

            GovernanceFacetResolutionRecorder.RecordWinnerWithDuplicateConflict(
                result,
                GovernanceConstants.ItemTypes.ElicitationQuestion,
                canonicalKey,
                candidates,
                BuildResolutionReason(candidates),
                string.Format(
                    GovernanceConstants.Notes.DuplicateDefinitionKey,
                    GovernanceConstants.ItemTypes.ElicitationQuestion));

            GovernanceFacetResolutionRecorder.RecordValueConflict(
                result,
                GovernanceConstants.ItemTypes.ElicitationQuestion,
                canonicalKey,
                candidates,
                string.Format(
                    GovernanceConstants.Notes.ValueConflict,
                    GovernanceConstants.ItemTypes.ElicitationQuestion,
                    canonicalKey));
        }

        result.EffectiveContent.ElicitationQuestions = effective;
    }

    /// <summary>
    ///     One materialized pack contribution: assignment + pack + version + parsed <see cref="PolicyPackContentDocument" />.
    /// </summary>
    /// <remarks>Internal to <see cref="ResolveAsync" />; keeps merge helpers strongly typed.</remarks>
    private sealed record ResolvedPackRow(
        PolicyPackAssignment Assignment,
        PolicyPack Pack,
        PolicyPackVersion Version,
        PolicyPackContentDocument Content);
}

