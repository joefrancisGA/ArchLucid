using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Services;

namespace ArchLucid.Application.Analysis;

/// <summary>Bounded offline evidence for a single graph-only engine. Deliberately unregistered and not called by runtime orchestration.</summary>
internal static class AuthorityTopologyOfflineComparison
{
    internal const string ProjectionVersion = "authority/topology-anti-pattern/shadow/v2";

    internal static Guid EngineBuild => typeof(TopologyAntiPatternFindingEngine).Module.ModuleVersionId;

    internal static async Task<AuthorityTopologyComparison> CompareAsync(
        AuthorityTopologyRehearsalInput baseline, AuthorityTopologyRehearsalInput candidate, TimeProvider clock, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        ArgumentNullException.ThrowIfNull(baseline);
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(clock);

        if (baseline.Graph is null || candidate.Graph is null)
            return new(AuthorityTopologyComparisonOutcome.Inconclusive, "graph_unsupported_or_ambiguous");

        if (baseline.Scope != candidate.Scope || baseline.Scope is null
            || baseline.Graph.RunId != candidate.Graph.RunId || baseline.Graph.ContextSnapshotId != candidate.Graph.ContextSnapshotId)
            return new(AuthorityTopologyComparisonOutcome.Inconclusive, "scope_or_run_mismatch");

        if (baseline.Coverage != AuthorityTopologyCoverage.VerifiedComplete
            || candidate.Coverage != AuthorityTopologyCoverage.VerifiedComplete
            || !HasWitnesses(baseline) || !HasWitnesses(candidate))
            return new(AuthorityTopologyComparisonOutcome.Inconclusive, "prerequisites_unverified");

        if (baseline.ProjectionVersion != ProjectionVersion || candidate.ProjectionVersion != ProjectionVersion
            || baseline.EngineBuild != EngineBuild || candidate.EngineBuild != EngineBuild)
            return new(AuthorityTopologyComparisonOutcome.Inconclusive, "comparison_version_unsupported");

        AuthorityTopologyGraphProjection? left = AuthorityTopologyGraphProjection.Capture(baseline.Graph);
        AuthorityTopologyGraphProjection? right = AuthorityTopologyGraphProjection.Capture(candidate.Graph);

        if (left is null || right is null)
            return new(AuthorityTopologyComparisonOutcome.Inconclusive, "graph_unsupported_or_ambiguous");

        var engine = new TopologyAntiPatternFindingEngine();
        string leftFingerprint = Fingerprint(baseline, left, engine.EngineType);
        string rightFingerprint = Fingerprint(candidate, right, engine.EngineType);

        if (baseline.ContextWitness != candidate.ContextWitness || baseline.PolicyWitness != candidate.PolicyWitness
            || baseline.EvidenceWitness != candidate.EvidenceWitness || baseline.ConfigurationWitness != candidate.ConfigurationWitness)
            return new(AuthorityTopologyComparisonOutcome.Different, "pinned_dependency_changed", leftFingerprint, rightFingerprint);

        // The reviewed engine does not read the analysis context. Supply only the shared immutable identity subset.
        FindingAnalysisContext context = new()
        {
            RunId = baseline.Graph.RunId, ContextSnapshotId = baseline.Graph.ContextSnapshotId,
            ContextCanonicalFingerprint = baseline.ContextWitness,
        };

        ct.ThrowIfCancellationRequested();
        IReadOnlyList<Finding> leftFindings = await engine.AnalyzeAsync(left.Graph, context, ct);
        ct.ThrowIfCancellationRequested();
        IReadOnlyList<Finding> rightFindings = await engine.AnalyzeAsync(right.Graph, context, ct);
        ct.ThrowIfCancellationRequested();

        string[] leftResults = leftFindings.Select(FindingContent).ToArray();
        string[] rightResults = rightFindings.Select(FindingContent).ToArray();
        bool multiset = leftResults.Order(StringComparer.Ordinal)
            .SequenceEqual(rightResults.Order(StringComparer.Ordinal), StringComparer.Ordinal);
        bool sequence = leftResults.SequenceEqual(rightResults, StringComparer.Ordinal);

        // Independent negative control. Same topology must not conceal a changed selected evidence path.
        bool pathsMatch = PathEvidence(left.Graph).SequenceEqual(PathEvidence(right.Graph), StringComparer.Ordinal);
        bool mergeSequenceMatches = MergeSequence(leftFindings, clock).SequenceEqual(MergeSequence(rightFindings, clock), StringComparer.Ordinal);

        ct.ThrowIfCancellationRequested();

        string? disagreement = !pathsMatch ? "order_sensitive_path_evidence_changed"
            : !multiset ? "engine_output_changed"
            : leftFingerprint != rightFingerprint ? "effective_input_changed"
            : !mergeSequenceMatches ? "authority_merge_order_changed"
            : null;

        return new(disagreement is null ? AuthorityTopologyComparisonOutcome.EquivalentForConsumer : AuthorityTopologyComparisonOutcome.Different,
            disagreement ?? "reviewed_consumer_agrees", leftFingerprint, rightFingerprint,
            multiset, sequence, mergeSequenceMatches, pathsMatch);
    }

    private static string Fingerprint(AuthorityTopologyRehearsalInput input,
        AuthorityTopologyGraphProjection projection, string engineType) =>
        AnalysisDependencyFingerprint.Digest(new
        {
            ProjectionVersion, Engine = engineType, Build = EngineBuild,
            input.Scope, projection.Graph.RunId, projection.Graph.ContextSnapshotId, projection.Graph.SchemaVersion,
            input.ContextWitness, input.PolicyWitness, input.EvidenceWitness, input.ConfigurationWitness, input.Coverage,
            projection.CanonicalDigest,
        });

    private static bool HasWitnesses(AuthorityTopologyRehearsalInput input) =>
        IsDigest(input.ContextWitness) && IsDigest(input.PolicyWitness)
        && IsDigest(input.EvidenceWitness) && IsDigest(input.ConfigurationWitness);

    private static bool IsDigest(string? value) =>
        value is { Length: 64 } && value.All(char.IsAsciiHexDigitUpper);

    private static string FindingContent(Finding finding)
    {
        JsonObject payload = JsonSerializer.SerializeToNode(finding)!.AsObject();
        // The factory assigns a random observation ID every invocation. All semantic and provenance fields remain.
        payload.Remove(nameof(Finding.FindingId));
        return AnalysisDependencyFingerprint.Digest(payload);
    }

    private static IEnumerable<string> PathEvidence(GraphSnapshot graph) =>
        DataFlowTrustBoundaryPathAnalyzer.Analyze(graph).Select(path => AnalysisDependencyFingerprint.Digest(path))
            .Order(StringComparer.Ordinal);

    private static IEnumerable<string> MergeSequence(IReadOnlyList<Finding> findings, TimeProvider clock)
    {
        FindingsSnapshot snapshot = new();
        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(snapshot, findings, clock);
        return snapshot.Findings.Select(FindingContent);
    }
}
