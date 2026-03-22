using System.Text.Json;
using ArchiForge.Decisioning.Governance.PolicyPacks;

namespace ArchiForge.Decisioning.Governance.Resolution;

/// <summary>
/// Resolves layered policy pack assignments with explicit scope precedence:
/// project &gt; workspace &gt; tenant; pinned adds a bonus within the same tier; newer <see cref="PolicyPackAssignment.AssignedUtc"/> wins ties.
/// </summary>
public sealed class EffectiveGovernanceResolver(
    IPolicyPackAssignmentRepository assignmentRepository,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository) : IEffectiveGovernanceResolver
{
    private sealed record ResolvedPackRow(
        PolicyPackAssignment Assignment,
        PolicyPack Pack,
        PolicyPackVersion Version,
        PolicyPackContentDocument Content);

    public async Task<EffectiveGovernanceResolutionResult> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        var assignments = await assignmentRepository
            .ListByScopeAsync(tenantId, workspaceId, projectId, ct)
            .ConfigureAwait(false);

        var applicable = assignments
            .Where(x => x.IsEnabled)
            .Where(x => AppliesToScope(x, tenantId, workspaceId, projectId))
            .ToList();

        var resolvedPacks = new List<ResolvedPackRow>();

        foreach (var assignment in applicable)
        {
            var pack = await packRepository.GetByIdAsync(assignment.PolicyPackId, ct).ConfigureAwait(false);
            if (pack is null)
                continue;

            var version = await versionRepository
                .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, ct)
                .ConfigureAwait(false);

            if (version is null)
                continue;

            PolicyPackContentDocument? content;
            try
            {
                content = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                    version.ContentJson,
                    PolicyPackJsonSerializerOptions.Default);
            }
            catch (JsonException)
            {
                continue;
            }

            if (content is null)
                continue;

            resolvedPacks.Add(new ResolvedPackRow(assignment, pack, version, content));
        }

        var result = new EffectiveGovernanceResolutionResult
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        ResolveGuidIdList(
            result,
            "ComplianceRule",
            resolvedPacks,
            x => x.Content.ComplianceRuleIds,
            (content, ids) => content.ComplianceRuleIds = ids);

        ResolveStringKeyList(
            result,
            "ComplianceRuleKey",
            resolvedPacks,
            x => x.Content.ComplianceRuleKeys,
            (content, keys) => content.ComplianceRuleKeys = keys);

        ResolveGuidIdList(
            result,
            "AlertRule",
            resolvedPacks,
            x => x.Content.AlertRuleIds,
            (content, ids) => content.AlertRuleIds = ids);

        ResolveGuidIdList(
            result,
            "CompositeAlertRule",
            resolvedPacks,
            x => x.Content.CompositeAlertRuleIds,
            (content, ids) => content.CompositeAlertRuleIds = ids);

        ResolveDictionary(
            result,
            "AdvisoryDefault",
            resolvedPacks,
            x => x.Content.AdvisoryDefaults,
            (content, dict) => content.AdvisoryDefaults = dict);

        ResolveDictionary(
            result,
            "Metadata",
            resolvedPacks,
            x => x.Content.Metadata,
            (content, dict) => content.Metadata = dict);

        result.Notes.Add($"Resolved {resolvedPacks.Count} applicable policy pack assignment(s).");
        result.Notes.Add($"Produced {result.Decisions.Count} resolution decision(s).");
        result.Notes.Add($"Detected {result.Conflicts.Count} conflict(s).");

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

    /// <summary>
    /// Higher wins. Scope dominates: tenant=1000, workspace=2000, project=3000; +100 if pinned.
    /// </summary>
    internal static int GetPrecedenceRank(PolicyPackAssignment assignment)
    {
        var tier = assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => 1000,
            GovernanceScopeLevel.Workspace => 2000,
            GovernanceScopeLevel.Project => 3000,
            _ => 0,
        };

        return assignment.IsPinned ? tier + 100 : tier;
    }

    private static GovernanceResolutionCandidate ToCandidate(ResolvedPackRow row, string valueJson)
    {
        var a = row.Assignment;
        return new GovernanceResolutionCandidate
        {
            PolicyPackId = row.Pack.PolicyPackId,
            PolicyPackName = row.Pack.Name,
            Version = row.Version.Version,
            ScopeLevel = a.ScopeLevel,
            PrecedenceRank = GetPrecedenceRank(a),
            ValueJson = valueJson,
            AssignmentId = a.AssignmentId,
            AssignedUtc = a.AssignedUtc,
        };
    }

    private static List<GovernanceResolutionCandidate> OrderCandidates(IEnumerable<GovernanceResolutionCandidate> candidates) =>
        candidates
            .OrderByDescending(c => c.PrecedenceRank)
            .ThenByDescending(c => c.AssignedUtc)
            .ThenByDescending(c => c.AssignmentId)
            .ToList();

    private static string BuildResolutionReason(IReadOnlyList<GovernanceResolutionCandidate> ordered)
    {
        if (ordered.Count == 0)
            return "No candidates.";
        if (ordered.Count == 1)
            return "Only one applicable candidate existed.";

        var winner = ordered[0];
        var second = ordered[1];
        if (winner.PrecedenceRank != second.PrecedenceRank)
            return "Higher governance scope tier (project > workspace > tenant), or pinned assignment within a tier, outranked the other candidate(s).";

        if (winner.AssignedUtc != second.AssignedUtc)
            return "Same scope tier and pin state; the newer assignment (AssignedUtc) won.";

        return "Same scope tier, pin state, and timestamp; winner chosen by deterministic tie-break (AssignmentId).";
    }

    private static void ResolveGuidIdList(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, List<Guid>> selector,
        Action<PolicyPackContentDocument, List<Guid>> setter)
    {
        var allIds = packs
            .SelectMany(selector)
            .Distinct()
            .ToList();

        var effective = new List<Guid>();

        foreach (var id in allIds)
        {
            var raw = id.ToString("D");
            var candidates = OrderCandidates(
                packs
                    .Where(x => selector(x).Contains(id))
                    .Select(x => ToCandidate(x, raw)));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            effective.Add(id);

            result.Decisions.Add(new GovernanceResolutionDecision
            {
                ItemType = itemType,
                ItemKey = raw,
                WinningPolicyPackId = candidates[0].PolicyPackId,
                WinningPolicyPackName = candidates[0].PolicyPackName,
                WinningVersion = candidates[0].Version,
                WinningScopeLevel = candidates[0].ScopeLevel,
                ResolutionReason = BuildResolutionReason(candidates),
                Candidates = candidates,
            });

            if (candidates.Count > 1)
            {
                result.Conflicts.Add(new GovernanceConflictRecord
                {
                    ItemType = itemType,
                    ItemKey = raw,
                    ConflictType = "DuplicateDefinition",
                    Description =
                        $"Multiple policy packs defined the same {itemType} item. The higher-precedence candidate was selected.",
                    Candidates = candidates,
                });
            }
        }

        setter(result.EffectiveContent, effective);
    }

    private static void ResolveStringKeyList(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, List<string>> selector,
        Action<PolicyPackContentDocument, List<string>> setter)
    {
        var allKeys = packs
            .SelectMany(selector)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var effective = new List<string>();

        foreach (var key in allKeys)
        {
            var candidates = OrderCandidates(
                packs
                    .Where(x => selector(x).Contains(key, StringComparer.OrdinalIgnoreCase))
                    .Select(x =>
                    {
                        var v = selector(x).First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
                        return ToCandidate(x, JsonSerializer.Serialize(v, PolicyPackJsonSerializerOptions.Default));
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            var canonical = packs
                .SelectMany(selector)
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
            effective.Add(canonical);

            result.Decisions.Add(new GovernanceResolutionDecision
            {
                ItemType = itemType,
                ItemKey = canonical,
                WinningPolicyPackId = candidates[0].PolicyPackId,
                WinningPolicyPackName = candidates[0].PolicyPackName,
                WinningVersion = candidates[0].Version,
                WinningScopeLevel = candidates[0].ScopeLevel,
                ResolutionReason = BuildResolutionReason(candidates),
                Candidates = candidates,
            });

            if (candidates.Count > 1)
            {
                result.Conflicts.Add(new GovernanceConflictRecord
                {
                    ItemType = itemType,
                    ItemKey = canonical,
                    ConflictType = "DuplicateDefinition",
                    Description =
                        $"Multiple policy packs defined the same {itemType} key. The higher-precedence candidate was selected.",
                    Candidates = candidates,
                });
            }
        }

        setter(result.EffectiveContent, effective);
    }

    private static void ResolveDictionary(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, Dictionary<string, string>> selector,
        Action<PolicyPackContentDocument, Dictionary<string, string>> setter)
    {
        var keys = packs
            .SelectMany(x => selector(x).Keys)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var effective = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var key in keys)
        {
            var candidates = OrderCandidates(
                packs
                    .Where(x =>
                        selector(x).Keys.Any(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase)))
                    .Select(x =>
                    {
                        var dict = selector(x);
                        var actualKey = dict.Keys.First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
                        var val = dict[actualKey];
                        return ToCandidate(x, val);
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            var canonicalKey = packs
                .SelectMany(x => selector(x).Keys)
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
            effective[canonicalKey] = candidates[0].ValueJson;

            result.Decisions.Add(new GovernanceResolutionDecision
            {
                ItemType = itemType,
                ItemKey = canonicalKey,
                WinningPolicyPackId = candidates[0].PolicyPackId,
                WinningPolicyPackName = candidates[0].PolicyPackName,
                WinningVersion = candidates[0].Version,
                WinningScopeLevel = candidates[0].ScopeLevel,
                ResolutionReason = BuildResolutionReason(candidates),
                Candidates = candidates,
            });

            if (candidates.Count > 1)
            {
                var distinctValues = candidates
                    .Select(x => x.ValueJson)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count();

                if (distinctValues > 1)
                {
                    result.Conflicts.Add(new GovernanceConflictRecord
                    {
                        ItemType = itemType,
                        ItemKey = canonicalKey,
                        ConflictType = "ValueConflict",
                        Description =
                            $"Multiple policy packs defined different values for {itemType} '{canonicalKey}'. The higher-precedence value was selected.",
                        Candidates = candidates,
                    });
                }
            }
        }

        setter(result.EffectiveContent, effective);
    }
}
