using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public static class RemediationPortfolioGraphBuilder
{
    internal const int MaxActions = 128;
    private const int MaxItems = 1024;
    private const int MaxReferences = 64;

    /// <summary>Canonical content identity. It is not proof of independent approval.</summary>
    public static string ComputeProposalSha256(RemediationPortfolioProposal proposal) =>
        AnalysisDependencyFingerprint.Digest(Normalize(proposal));

    public static PortfolioEvidenceReference Reference(OperationalSecurityFindingRecord item) =>
        MakeReference(PortfolioEvidenceKind.Finding, item.FindingId, item);
    public static PortfolioEvidenceReference Reference(SecurityEvidencePathRecord item) =>
        MakeReference(PortfolioEvidenceKind.Path, item.PathId, item);
    public static PortfolioEvidenceReference Reference(SecurityEvidenceCutPointRecord item) =>
        MakeReference(PortfolioEvidenceKind.CutPoint, item.CutPointId, item);
    public static PortfolioEvidenceReference Reference(RemediationPatternVersionRecord item) =>
        MakeReference(PortfolioEvidenceKind.PatternVersion, item.VersionId, item);
    public static PortfolioEvidenceReference Reference(RemediationPatternMatchResultRecord item) =>
        MakeReference(PortfolioEvidenceKind.PatternMatch, item.MatchResultId, item);

    private static PortfolioEvidenceReference MakeReference<T>(PortfolioEvidenceKind kind, Guid id, T item) =>
        new(kind, id, AnalysisDependencyFingerprint.Digest(item));

    internal static RemediationPortfolioProposal FreezeReviewed(ProjectSnapshotScopeKey scope,
        RemediationPortfolioProposal proposal, string reviewedProposalSha256)
    {
        var frozen = Normalize(proposal);
        if (frozen.Binding.Scope != scope || !string.Equals(AnalysisDependencyFingerprint.Digest(frozen),
                Hash(reviewedProposalSha256), StringComparison.Ordinal))
            throw new ArgumentException("Reviewed proposal does not match its authorized scope or digest.", nameof(proposal));
        return frozen;
    }

    internal static RemediationPortfolioGraph Build(RemediationPortfolioProposal proposal, bool snapshotComplete,
        IReadOnlyList<OperationalSecurityFindingRecord> findings,
        IReadOnlyList<SecurityEvidencePathRecord> paths,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        IReadOnlyDictionary<Guid, RemediationPatternVersionRecord> approvedPatterns,
        IReadOnlyDictionary<Guid, RemediationPatternMatchResultRecord> matches)
    {
        ProjectSnapshotScopeKey scoped = proposal.Binding.Scope;
        var findingIndex = findings.ToDictionary(item => item.FindingId);
        var pathIndex = paths.ToDictionary(item => item.PathId);
        var cutIndex = cutPoints.ToDictionary(item => item.CutPointId);
        var references = findings.Select(Reference).Concat(paths.Select(Reference)).Concat(cutPoints.Select(Reference))
            .Concat(approvedPatterns.Values.Select(Reference)).Concat(matches.Values.Select(Reference))
            .ToDictionary(item => (item.Kind, item.RecordId));
        bool ReferencesMatch(IReadOnlyList<PortfolioEvidenceReference> items) => items.Count > 0
            && items.All(item => references.TryGetValue((item.Kind, item.RecordId), out var actual) && actual == item);
        bool Verified(PortfolioSupport support, IReadOnlyList<PortfolioEvidenceReference> items) =>
            snapshotComplete && support == PortfolioSupport.Reviewed
            && items.Any(item => item.Kind is PortfolioEvidenceKind.Finding or PortfolioEvidenceKind.Path or PortfolioEvidenceKind.CutPoint)
            && ReferencesMatch(items);
        bool FindingReferences(IReadOnlyList<Guid> ids, IReadOnlyList<PortfolioEvidenceReference> items) =>
            ids.Count > 0 && ids.All(id => findingIndex.TryGetValue(id, out var item)
                && item.Status == OperationalSecurityFindingStatus.Open
                && (item.PathId is null || (pathIndex.ContainsKey(item.PathId.Value)
                    && items.Any(reference => reference.Kind == PortfolioEvidenceKind.Path && reference.RecordId == item.PathId)))
                && items.Any(reference => reference.Kind == PortfolioEvidenceKind.Finding && reference.RecordId == id));

        string Stable(string kind, params object[] keys) => AnalysisDependencyFingerprint.Create(scoped.Project,
            RemediationPortfolioGraph.SchemaVersion + "-" + kind, keys);
        List<PortfolioIssue> issues = [];
        var blocked = new HashSet<string>(StringComparer.Ordinal);
        void Issue(string id, string reason) => issues.Add(new(id, reason));
        void Block(string id, string reason)
        {
            Issue(id, reason);
            blocked.Add(id);
        }
        bool canEvaluate = snapshotComplete && proposal.DependenciesComplete;
        if (!snapshotComplete)
            Issue("graph", "snapshot_coverage_incomplete");
        if (!proposal.DependenciesComplete)
            Issue("graph", "dependency_inventory_incomplete");

        var aliases = proposal.Actions.ToDictionary(item => item.Key,
            item => Stable("action", item.ActionKind, item.TargetResourceId, item.PatternId, item.PatternVersionId));
        List<PortfolioActionNode> actions = [];
        foreach (var group in proposal.Actions.GroupBy(row => aliases[row.Key], StringComparer.Ordinal))
        {
            PortfolioActionProposal first = group.First();
            bool current = approvedPatterns.TryGetValue(first.PatternId, out var version)
                && version.VersionId == first.PatternVersionId;
            if (!current)
                Block(group.Key, "pattern_not_current_approved");
            foreach (var item in group)
            {
                bool approvedReference = item.Evidence.Any(e => e.Kind == PortfolioEvidenceKind.PatternVersion
                    && e.RecordId == item.PatternVersionId);
                bool UsesPinnedMatch(Guid id) => matches.TryGetValue(id, out var match) && match.IsActive
                    && match.PatternId == item.PatternId && match.VersionId == item.PatternVersionId
                    && (match.MatchKind is RemediationPatternMatchKind.ExactMatch or RemediationPatternMatchKind.ProbableMatch)
                    && item.Evidence.Any(e => e.Kind == PortfolioEvidenceKind.PatternMatch && e.RecordId == match.MatchResultId);
                bool targetMatches = item.FindingIds.Any(id => findingIndex.TryGetValue(id, out var finding)
                    && finding.CloudResourceId == item.TargetResourceId && UsesPinnedMatch(id));
                bool cutPointMatches = current && item.Evidence.Any(e => e.Kind == PortfolioEvidenceKind.CutPoint
                    && cutIndex.TryGetValue(e.RecordId, out var cut) && cut.CloudResourceId == item.TargetResourceId
                    && item.FindingIds.Any(id => UsesPinnedMatch(id)
                        && findingIndex[id].PathId is Guid path && CutPointCitesPath(cut, path)
                        && string.Equals(cut.SuggestedPatternKey, matches[id].PatternKey, StringComparison.Ordinal)));
                if (!approvedReference || !ReferencesMatch(item.Evidence)
                    || !FindingReferences(item.FindingIds, item.Evidence))
                    Block(group.Key, "action_evidence_missing_or_stale");
                if (!targetMatches && !cutPointMatches)
                    Block(group.Key, "action_target_or_match_unverified");
            }
            actions.Add(new(group.Key, first.ActionKind, first.TargetResourceId, first.PatternId, first.PatternVersionId,
                Ids(group.SelectMany(row => row.FindingIds)), SortEvidence(group.SelectMany(row => row.Evidence)), false));
        }

        var causes = proposal.Causes.ToDictionary(item => item.Key, item =>
        {
            string id = Stable("cause", item.Key);
            bool reviewed = Verified(item.Support, item.Evidence) && FindingReferences(item.FindingIds, item.Evidence);
            if (!reviewed)
                Issue(id, "root_cause_unverified");
            return new PortfolioCauseNode(id, item.FindingIds, item.Evidence, reviewed);
        });
        var cases = proposal.Scenarios.ToDictionary(item => item.Key, item =>
        {
            string id = Stable("scenario", item.Key);
            bool hasCause = causes.TryGetValue(item.CauseKey, out var cause);
            bool reviewed = hasCause && cause!.Reviewed && item.FindingIds.All(cause.FindingIds.Contains)
                && Verified(item.Support, item.Evidence) && FindingReferences(item.FindingIds, item.Evidence);
            if (!reviewed)
                Issue(id, hasCause ? "scenario_unverified" : "scenario_cause_missing");
            return new PortfolioScenarioNode(id, Stable("cause", item.CauseKey), item.FindingIds, item.Evidence, reviewed);
        });

        List<PortfolioRelationshipEdge> edges = [];
        foreach (var relation in proposal.Relationships)
        {
            aliases.TryGetValue(relation.FirstAction, out string? first);
            aliases.TryGetValue(relation.SecondAction, out string? second);
            if (first is null || second is null || first == second || !Verified(relation.Support, relation.Evidence))
            {
                string reason = relation.Relationship == PortfolioRelationship.Alternative
                    ? "alternative_unverified" : "required_constraint_unverified_or_invalid";
                Issue(first ?? second ?? "graph", reason);
                if (relation.Relationship != PortfolioRelationship.Alternative)
                {
                    if (first is not null)
                        Block(first, reason);
                    if (second is not null && relation.Relationship == PortfolioRelationship.Conflicts)
                        Block(second, reason);
                }
                continue;
            }
            if (relation.Relationship != PortfolioRelationship.Requires && StringComparer.Ordinal.Compare(first, second) > 0)
                (first, second) = (second, first);
            edges.Add(new(first, second, relation.Relationship, relation.Evidence));
        }
        edges = edges.GroupBy(edge => (edge.FirstActionId, edge.SecondActionId, edge.Relationship))
            .Select(group => new PortfolioRelationshipEdge(group.Key.FirstActionId, group.Key.SecondActionId, group.Key.Relationship,
                SortEvidence(group.SelectMany(row => row.Evidence)))).ToList();

        var requirements = edges.Where(e => e.Relationship == PortfolioRelationship.Requires).ToLookup(e => e.FirstActionId, e => e.SecondActionId);
        var conflicts = edges.Where(e => e.Relationship == PortfolioRelationship.Conflicts).ToArray();
        var dependents = edges.Where(e => e.Relationship == PortfolioRelationship.Requires).ToLookup(e => e.SecondActionId, e => e.FirstActionId);
        var counts = actions.ToDictionary(action => action.Id, action => requirements[action.Id].Count(), StringComparer.Ordinal);
        Queue<string> ready = new(counts.Where(x => x.Value == 0).Select(x => x.Key));
        while (ready.TryDequeue(out string? next))
        {
            foreach (string dependent in dependents[next])
            {
                if (--counts[dependent] == 0)
                    ready.Enqueue(dependent);
            }
        }
        foreach (var item in counts.Where(item => item.Value > 0))
            Block(item.Key, "prerequisite_cycle_or_dependency_on_cycle");

        HashSet<string> Closure(IEnumerable<string> roots)
        {
            var result = new HashSet<string>(StringComparer.Ordinal);
            Stack<string> stack = new(roots);
            while (stack.TryPop(out string? id))
            {
                if (result.Add(id))
                {
                    foreach (string required in requirements[id])
                        stack.Push(required);
                }
            }
            return result;
        }
        bool HasConflict(HashSet<string> selected) =>
            conflicts.Any(edge => selected.Contains(edge.FirstActionId) && selected.Contains(edge.SecondActionId));

        foreach (var action in actions)
        {
            var chain = Closure([action.Id]);
            if (HasConflict(chain))
                Block(action.Id, "prerequisite_chain_conflicts");
        }
        foreach (var action in actions)
        {
            if (Closure([action.Id]).Any(id => id != action.Id && blocked.Contains(id)))
                Block(action.Id, "prerequisite_unavailable");
        }
        var eligible = actions.Select(action => action with { Eligible = canEvaluate && !blocked.Contains(action.Id) }).ToArray();
        var allowed = eligible.Where(action => action.Eligible).Select(action => action.Id).ToHashSet(StringComparer.Ordinal);
        List<PortfolioCoverageClause> coverage = [];
        foreach (var clause in proposal.Coverage)
        {
            var actionIds = clause.AllActions.Select(key => aliases.GetValueOrDefault(key)).ToArray();
            var ids = actionIds.OfType<string>().Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
            string scenarioId = Stable("scenario", clause.ScenarioKey);
            if (!cases.TryGetValue(clause.ScenarioKey, out var scenario) || !scenario.Reviewed
                || !Verified(clause.Support, clause.Evidence)
                || !clause.Evidence.Any(item => scenario.Evidence.Contains(item)
                    && item.Kind is PortfolioEvidenceKind.Finding or PortfolioEvidenceKind.Path or PortfolioEvidenceKind.CutPoint)
                || actionIds.Any(id => id is null || !allowed.Contains(id!)))
                Issue(scenarioId, "coverage_unverified_or_action_unavailable");
            else if (ids.Length != actionIds.Length || HasConflict(Closure(ids)))
                Issue(scenarioId, "coverage_bundle_incompatible");
            else
                coverage.Add(new(scenarioId, RemediationPortfolioGraph.Freeze(ids), clause.Evidence));
        }
        coverage = coverage.GroupBy(row => (row.ScenarioId, Key: string.Join(",", row.AllActionIds)))
            .Select(group => new PortfolioCoverageClause(group.Key.ScenarioId, group.First().AllActionIds,
                SortEvidence(group.SelectMany(row => row.Evidence)))).ToList();

        return new(proposal.Binding, AnalysisDependencyFingerprint.Digest(proposal), canEvaluate,
            eligible, causes.Values, cases.Values, edges, coverage, issues);
    }

    private static RemediationPortfolioProposal Normalize(RemediationPortfolioProposal value)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(value.Binding);
        ArgumentNullException.ThrowIfNull(value.Binding.Scope);
        var binding = value.Binding with { InventorySha256 = Hash(value.Binding.InventorySha256),
            PolicyVersion = Token(value.Binding.PolicyVersion), EngineVersion = Token(value.Binding.EngineVersion),
            RiskModelVersion = Token(value.Binding.RiskModelVersion) };

        var actions = Rows(value.Actions, MaxActions).Select(row => row with
        {
            Key = Key(row.Key), ActionKind = Token(row.ActionKind), TargetResourceId = Key(row.TargetResourceId),
            PatternId = Key(row.PatternId), PatternVersionId = Key(row.PatternVersionId),
            FindingIds = Ids(Rows(row.FindingIds, MaxReferences)), Evidence = NormalizeEvidence(row.Evidence),
        }).OrderBy(row => row.Key).ToArray();
        var causes = Rows(value.Causes, MaxItems).Select(row => row with
        {
            Key = Key(row.Key), FindingIds = Ids(Rows(row.FindingIds, MaxReferences)),
            Support = CheckedEnum(row.Support), Evidence = NormalizeEvidence(row.Evidence),
        }).OrderBy(row => row.Key).ToArray();
        var scenarios = Rows(value.Scenarios, MaxItems).Select(row => row with
        {
            Key = Key(row.Key), CauseKey = Key(row.CauseKey), FindingIds = Ids(Rows(row.FindingIds, MaxReferences)),
            Support = CheckedEnum(row.Support), Evidence = NormalizeEvidence(row.Evidence),
        }).OrderBy(row => row.Key).ToArray();
        var edges = Rows(value.Relationships, MaxItems).Select(row =>
        {
            var first = Key(row.FirstAction);
            var second = Key(row.SecondAction);
            if (row.Relationship != PortfolioRelationship.Requires && first.CompareTo(second) > 0)
                (first, second) = (second, first);
            return new PortfolioRelationshipProposal(first, second, CheckedEnum(row.Relationship),
                CheckedEnum(row.Support), NormalizeEvidence(row.Evidence));
        }).OrderBy(row => row.Relationship).ThenBy(row => row.FirstAction).ThenBy(row => row.SecondAction)
            .ThenBy(row => row.Support).ThenBy(row => AnalysisDependencyFingerprint.Digest(row.Evidence), StringComparer.Ordinal);
        var coverage = Rows(value.Coverage, MaxItems).Select(row => row with
        {
            ScenarioKey = Key(row.ScenarioKey), AllActions = UniqueClause(row.AllActions),
            Support = CheckedEnum(row.Support), Evidence = NormalizeEvidence(row.Evidence),
        }).OrderBy(row => row.ScenarioKey).ThenBy(row => string.Join(",", row.AllActions), StringComparer.Ordinal)
            .ThenBy(row => row.Support).ThenBy(row => AnalysisDependencyFingerprint.Digest(row.Evidence), StringComparer.Ordinal);

        if (actions.Select(x => x.Key).Distinct().Count() != actions.Length
            || causes.Select(x => x.Key).Distinct().Count() != causes.Length
            || scenarios.Select(x => x.Key).Distinct().Count() != scenarios.Length)
            throw Invalid("Duplicate proposal identities are ambiguous.");
        return new(binding, value.DependenciesComplete, RemediationPortfolioGraph.Freeze(actions),
            RemediationPortfolioGraph.Freeze(causes), RemediationPortfolioGraph.Freeze(scenarios),
            RemediationPortfolioGraph.Freeze(edges), RemediationPortfolioGraph.Freeze(coverage));
    }

    private static bool CutPointCitesPath(SecurityEvidenceCutPointRecord cutPoint, Guid path)
    {
        if (cutPoint.CollapsedPathIdsJson is not { Length: > 0 and <= 65_536 })
            return false;
        try
        {
            return JsonSerializer.Deserialize<Guid[]>(cutPoint.CollapsedPathIdsJson)?.Contains(path) == true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static IReadOnlyList<Guid> UniqueClause(IReadOnlyList<Guid> items)
    {
        var values = Ids(Rows(items, MaxActions));
        if (values.Count == 0 || values.Count != items.Count)
            throw Invalid("A coverage clause requires one or more distinct actions.");
        return values;
    }

    private static IReadOnlyList<Guid> Ids(IEnumerable<Guid> values) =>
        RemediationPortfolioGraph.Freeze(values.Select(Key).Distinct().Order());
    private static IReadOnlyList<PortfolioEvidenceReference> NormalizeEvidence(IReadOnlyList<PortfolioEvidenceReference> rows) =>
        SortEvidence(Rows(rows, MaxReferences).Select(item => new PortfolioEvidenceReference(CheckedEnum(item.Kind),
            Key(item.RecordId), Hash(item.Sha256))));
    private static IReadOnlyList<PortfolioEvidenceReference> SortEvidence(IEnumerable<PortfolioEvidenceReference> rows) =>
        RemediationPortfolioGraph.Freeze(rows.Distinct().OrderBy(item => item.Kind).ThenBy(item => item.RecordId)
            .ThenBy(item => item.Sha256, StringComparer.Ordinal));
    private static string Hash(string value) => value is { Length: 64 } && value.All(Uri.IsHexDigit)
        ? value.ToUpperInvariant() : throw Invalid("A SHA-256 evidence or proposal digest is required.");
    private static string Token(string value) => value is { Length: > 0 and <= 96 }
        && value.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.' or '/') ? value
        : throw Invalid("A bounded action or version identifier is required.");
    private static Guid Key(Guid value) => value == Guid.Empty ? throw Invalid("A nonempty record identity is required.") : value;
    private static T CheckedEnum<T>(T value) where T : struct, Enum => Enum.IsDefined(value)
        ? value : throw Invalid("An unknown portfolio vocabulary value was supplied.");
    private static IReadOnlyList<T> Rows<T>(IReadOnlyList<T> values, int maximum) =>
        values is not null && values.Count <= maximum && values.All(value => value is not null)
            ? values : throw Invalid("A missing or oversized portfolio collection was supplied.");
    private static ArgumentException Invalid(string message) => new(message, "proposal");
}
