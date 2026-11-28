using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.Analysis;

/// <summary>Unregistered rehearsal adapter. Observes the active Authority checkpoint, never leases or publishes it.</summary>
internal sealed class AuthorityTopologyShadowAdapter(
    IScopeContextProvider scopeProvider, IRunRepository runs, IGraphSnapshotRepository graphs,
    IAnalysisRecoveryRepository checkpoints, TimeProvider clock)
{
    internal async Task<AuthorityTopologyComparison> ObserveAsync(ProjectScopeKey project, Guid runId,
        AuthorityTopologyShadowPreparation baseline, AuthorityTopologyShadowPreparation candidate, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (runId == Guid.Empty || baseline.Scope != project || candidate.Scope != project || !IsActive(project))
            return Inconclusive("scope_or_run_mismatch");

        if (!PreparationMatchesRun(baseline, runId) || !PreparationMatchesRun(candidate, runId))
            return Inconclusive("prerequisites_unverified");

        ScopeContext scope = new() { TenantId = project.TenantId, WorkspaceId = project.WorkspaceId, ProjectId = project.ProjectId };
        AuthorityTopologyShadowBinding? binding = await ReadBindingAsync(project, scope, runId, ct);

        if (binding is null)
            return Inconclusive("checkpoint_or_run_unverified");

        AuthorityTopologyRehearsalInput? left = await ReadEffectiveInputAsync(scope, binding, baseline, ct);

        if (left is null)
            return Inconclusive("effective_input_unverified");

        if (!IsActive(project) || binding != await ReadBindingAsync(project, scope, runId, ct))
            return Inconclusive("checkpoint_changed_during_observation");

        AuthorityTopologyRehearsalInput? right = await ReadEffectiveInputAsync(scope, binding, candidate, ct);

        if (right is null)
            return Inconclusive("effective_input_unverified");

        AuthorityTopologyComparison observation = await AuthorityTopologyOfflineComparison.CompareAsync(left, right, clock, ct);

        if (!IsActive(project) || binding != await ReadBindingAsync(project, scope, runId, ct))
            return Inconclusive("checkpoint_changed_during_observation");

        return observation;
    }

    private bool IsActive(ProjectScopeKey project)
    {
        ScopeContext active = scopeProvider.GetCurrentScope();

        return project.Matches(active.TenantId, active.WorkspaceId, active.ProjectId);
    }

    private async Task<AuthorityTopologyShadowBinding?> ReadBindingAsync(
        ProjectScopeKey project, ScopeContext scope, Guid runId, CancellationToken ct)
    {
        if (!IsActive(project))
            return null;

        RunRecord? run = await runs.GetByIdAsync(scope, runId, ct);

        if (run is null || !CommittedRunEvidenceBinding.MatchesActiveRun(scope, runId, run)
            || run.GoldenManifestId is not null || run.CompletedUtc is not null
            || run.ContextSnapshotId is not Guid contextId || contextId == Guid.Empty
            || run.GraphSnapshotId is not Guid graphId || graphId == Guid.Empty
            || run.PinnedPolicyPackIdsHashSha256 is not { Length: 32 } policy
            || run.PinnedEvidencePackagePinsHashSha256 is not { Length: 32 } evidence)
            return null;

        if (!MatchesJson(run.PinnedPolicyPackIdsJson, policy) || !MatchesJson(run.PinnedEvidencePackagePinsJson, evidence)
            || !RunHeaderPinDeserializer.TryDeserializePolicyPackRows(run.PinnedPolicyPackIdsJson!, out var policies)
            || !RunHeaderPinDeserializer.TryDeserializeEvidenceRows(run.PinnedEvidencePackagePinsJson!, out var evidenceRows)
            || evidenceRows.Length == 0)
            return null;

        // Copy the mutable read model before the next await.
        string policyPin = Convert.ToHexString(policy);
        string evidencePin = Convert.ToHexString(evidence);
        string headerWitness = AnalysisDependencyFingerprint.Digest(new
        {
            run.ArchitectureVersionId, run.PinnedArchitectureVersionContentHashSha256,
            run.KnowledgeModelId, run.PinnedKnowledgeModelContentHashSha256, run.EngineProvenanceJson,
            run.DecisionTraceId, run.ArtifactBundleId, run.FindingsSnapshotId,
        });
        string resolvedPolicyIds = PolicyIdsWitness(policies.Select(row => row.PolicyPackId));
        string resolvedEvidence = EvidenceWitness(evidenceRows);
        AnalysisRecoveryClaim? context = await checkpoints.ReadAsync(new(project, "authority", runId, "context_ingestion"), ct);

        if (!Matches(context, contextId))
            return null;

        AnalysisRecoveryClaim? graph = await checkpoints.ReadAsync(new(project, "authority", runId, "graph"), ct);

        if (!Matches(graph, graphId))
            return null;

        return new(runId, contextId, graphId, policyPin, evidencePin, headerWitness, resolvedPolicyIds, resolvedEvidence,
            context!.InputVersion, context.Fence, context.Attempts, graph!.InputVersion, graph.Fence, graph.Attempts);
    }

    private async Task<AuthorityTopologyRehearsalInput?> ReadEffectiveInputAsync(
        ScopeContext scope, AuthorityTopologyShadowBinding binding, AuthorityTopologyShadowPreparation prepared, CancellationToken ct)
    {
        if (!IsActive(prepared.Scope) || prepared.Context.ContextSnapshotId != binding.ContextId || prepared.PolicyPinWitness != binding.PolicyPin
            || prepared.EvidencePinWitness != binding.EvidencePin
            || PolicyIdsWitness(prepared.Context.EnabledPolicyPackIds) != binding.ResolvedPolicyIdsWitness
            || EvidenceWitness(prepared.Context.EvidencePins.Select(pin =>
                new PinnedEvidencePackageRow(pin.Provider, pin.PackageId.GetValueOrDefault(), pin.CollectionUtc))) != binding.ResolvedEvidenceWitness
            || !prepared.Context.EvidencePins.Any(pin => SamePin(pin, prepared.Context.EvidencePin!)))
            return null;

        GraphSnapshot? stored = await graphs.GetByIdAsync(scope, binding.GraphId, ct);

        if (stored is null || stored.GraphSnapshotId != binding.GraphId || stored.RunId != binding.RunId
            || stored.ContextSnapshotId != binding.ContextId)
            return null;

        AuthorityTopologyGraphProjection? privateCopy = AuthorityTopologyGraphProjection.Capture(stored);

        if (privateCopy is null)
            return null;

        GraphSnapshot graph = privateCopy.Graph;

        // Match the actual pre-engine order without reusing the live policy stage's failure swallowing.
        GraphNode[] anchors = graph.Nodes.Where(node =>
            string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase)).ToArray();

        if (anchors.Length != 1
            || anchors[0].Properties.GetValueOrDefault(ContextGraphPropertyKeys.ContextCanonicalFingerprint) != prepared.Context.ContextCanonicalFingerprint
            || anchors[0].Properties.GetValueOrDefault(ContextGraphPropertyKeys.PolicyPackPinsHashSha256Hex) != binding.PolicyPin
            || anchors[0].Properties.GetValueOrDefault(ContextGraphPropertyKeys.EvidencePackagePinsHashSha256Hex) != binding.EvidencePin)
            return null;

        ct.ThrowIfCancellationRequested();
        try
        {
            new EvidenceGraphMaterializer().Materialize(graph, prepared.Context);
        }
        catch (ConflictException)
        {
            return null;
        }

        FindingAnalysisContextGraphStamp.Stamp(graph, prepared.Context);
        PolicyExpectationGraphStamp.Stamp(graph, prepared.Policy);

        return new(prepared.Scope, graph,
            AnalysisDependencyFingerprint.Digest(new
            {
                prepared.Context.ContextCanonicalFingerprint, prepared.Context.KnowledgeModelFingerprint,
                prepared.Context.ArchitectureVersionId, binding.HeaderWitness,
            }),
            AnalysisDependencyFingerprint.Digest(new { binding.PolicyPin, prepared.Policy, prepared.Context.EnabledPolicyPackIds }),
            AnalysisDependencyFingerprint.Digest(new
            {
                PinCommitment = binding.EvidencePin, prepared.Context.EvidencePin, prepared.Context.EvidencePins, prepared.CoverageWitness,
            }),
            prepared.ConfigurationWitness, prepared.Coverage, AuthorityTopologyOfflineComparison.ProjectionVersion,
            AuthorityTopologyOfflineComparison.EngineBuild);
    }

    private static bool PreparationMatchesRun(AuthorityTopologyShadowPreparation prepared, Guid runId) =>
        prepared.Context.RunId == runId && prepared.Coverage == AuthorityTopologyCoverage.VerifiedComplete
        && prepared.Context.HasCreateTimeEvidencePinCommitment && prepared.Context.EvidencePin is
            { PackageId: Guid packageId, CollectionUtc: not null } && packageId != Guid.Empty
        && !string.IsNullOrWhiteSpace(prepared.Context.ContextCanonicalFingerprint)
        && IsDigest(prepared.PolicyPinWitness) && IsDigest(prepared.EvidencePinWitness)
        && IsDigest(prepared.CoverageWitness) && IsDigest(prepared.ConfigurationWitness);

    private static bool MatchesJson(string? json, byte[] digest) =>
        json is { Length: > 0 and <= 64_000 } && SHA256.HashData(Encoding.UTF8.GetBytes(json)).AsSpan().SequenceEqual(digest);

    private static string PolicyIdsWitness(IEnumerable<string> ids) =>
        AnalysisDependencyFingerprint.Digest(ids.Order(StringComparer.Ordinal).ToArray());

    private static string EvidenceWitness(IEnumerable<PinnedEvidencePackageRow> pins) =>
        AnalysisDependencyFingerprint.Digest(pins.OrderBy(pin => pin.Provider, StringComparer.Ordinal)
            .ThenBy(pin => pin.PackageId).ThenBy(pin => pin.CollectionUtc).ToArray());

    private static bool SamePin(EvidencePackagePin left, EvidencePackagePin right) =>
        left.PackageId == right.PackageId && left.Provider == right.Provider && left.CollectionUtc == right.CollectionUtc;

    private static bool Matches(AnalysisRecoveryClaim? claim, Guid expected) =>
        claim is { State: "succeeded", Fence: > 0, Attempts: > 0, Owner: null, LeaseUntilUtc: null }
        && IsDigest(claim.InputVersion) && string.Equals(claim.ResultReference, expected.ToString("D"), StringComparison.Ordinal);

    private static bool IsDigest(string? value) => value is { Length: 64 } && value.All(char.IsAsciiHexDigitUpper);

    private static AuthorityTopologyComparison Inconclusive(string reason) =>
        new(AuthorityTopologyComparisonOutcome.Inconclusive, reason);
}
