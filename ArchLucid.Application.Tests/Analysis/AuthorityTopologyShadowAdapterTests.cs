using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuthorityTopologyShadowAdapterTests
{
    [Fact]
    public async Task Same_run_inputs_are_scoped_stamped_and_compared_without_writing_or_mutating()
    {
        var rig = new Rehearsal();
        rig.Candidate.Nodes.Reverse();
        string baselineBefore = JsonSerializer.Serialize(rig.Baseline);
        string candidateBefore = JsonSerializer.Serialize(rig.Candidate);

        AuthorityTopologyComparison result = await rig.ObserveAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.EquivalentForConsumer, result.Outcome);
        Assert.True(result.EngineMultisetMatches);
        Assert.Equal(3, rig.RunReads);
        Assert.Equal(2, rig.GraphReads);
        Assert.Equal(6, rig.CheckpointReads);
        Assert.Equal(baselineBefore, JsonSerializer.Serialize(rig.Baseline));
        Assert.Equal(candidateBefore, JsonSerializer.Serialize(rig.Candidate));

        AuthorityTopologyComparison raw = await AuthorityTopologyOfflineComparison.CompareAsync(
            rig.RawInput(rig.Baseline), rig.RawInput(rig.Candidate), new FakeTimeProvider(), CancellationToken.None);
        Assert.NotEqual(raw.BaselineFingerprint, result.BaselineFingerprint);
    }

    [Fact]
    public async Task Effective_policy_difference_is_not_lost_when_header_and_graph_refs_match()
    {
        var rig = new Rehearsal();
        AuthorityTopologyShadowPreparation preparation = rig.Preparation with
        {
            Policy = new PolicyPackExpectationFacet(["front-door"], [], [], true, null),
        };

        AuthorityTopologyComparison result = await rig.ObserveAsync(candidate: preparation);

        Assert.Equal(AuthorityTopologyComparisonOutcome.Different, result.Outcome);
        Assert.Equal("pinned_dependency_changed", result.Reason);
        Assert.NotEqual(result.BaselineFingerprint, result.CandidateFingerprint);
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("same_id_new_fence")]
    [InlineData("same_id_new_version")]
    [InlineData("different_result")]
    [InlineData("context_replaced")]
    [InlineData("sealed")]
    public async Task Equal_graphs_never_emit_a_match_when_a_binding_changes_during_observation(string change)
    {
        var rig = new Rehearsal();
        rig.AfterCandidateRead = () =>
        {
            switch (change)
            {
                case "missing":
                    rig.GraphClaim = null;
                    break;
                case "same_id_new_fence":
                    rig.GraphClaim = Claim(rig.GraphId, fence: 2);
                    break;
                case "same_id_new_version":
                    rig.GraphClaim = Claim(rig.GraphId, version: new string('C', 64));
                    break;
                case "different_result":
                    rig.GraphClaim = Claim(Guid.NewGuid());
                    break;
                case "context_replaced":
                    rig.ContextClaim = Claim(rig.ContextId, fence: 2);
                    break;
                case "sealed":
                    rig.Run.GoldenManifestId = Guid.NewGuid();
                    break;
            }
        };

        AuthorityTopologyComparison result = await rig.ObserveAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal("checkpoint_changed_during_observation", result.Reason);
        Assert.Null(result.BaselineFingerprint);
        Assert.Null(result.EngineMultisetMatches);
        Assert.Equal(2, rig.GraphReads);
    }

    [Fact]
    public async Task Removing_baseline_checkpoint_stops_before_reading_the_second_graph()
    {
        var rig = new Rehearsal
        {
            AfterBaselineRead = target => target.GraphClaim = null,
        };

        AuthorityTopologyComparison result = await rig.ObserveAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal("checkpoint_changed_during_observation", result.Reason);
        Assert.Equal(1, rig.GraphReads);
    }

    [Theory]
    [InlineData("foreign_project")]
    [InlineData("incomplete_coverage")]
    [InlineData("foreign_run_record")]
    [InlineData("missing_context_checkpoint")]
    [InlineData("running_graph_checkpoint")]
    [InlineData("stale_policy_pin")]
    [InlineData("forged_prepared_evidence")]
    public async Task Unverified_scope_or_prerequisites_prevent_graph_reads(string reason)
    {
        var rig = new Rehearsal();
        AuthorityTopologyShadowPreparation candidate = rig.Preparation;

        switch (reason)
        {
            case "foreign_project":
                rig.Active.ProjectId = Guid.NewGuid();
                break;
            case "incomplete_coverage":
                candidate = candidate with { Coverage = AuthorityTopologyCoverage.Incomplete };
                break;
            case "foreign_run_record":
                rig.Run.ScopeProjectId = Guid.NewGuid();
                break;
            case "missing_context_checkpoint":
                rig.ContextClaim = null;
                break;
            case "running_graph_checkpoint":
                rig.GraphClaim = new AnalysisRecoveryClaim { State = "running", ResultReference = rig.GraphId.ToString("D") };
                break;
            case "stale_policy_pin":
                rig.Run.PinnedPolicyPackIdsJson = "[{}]";
                break;
            case "forged_prepared_evidence":
                candidate = rig.Preparation with
                {
                    Context = rig.Context(new EvidencePackagePin
                    {
                        PackageId = Guid.NewGuid(), Provider = rig.Pin.Provider, CollectionUtc = rig.Pin.CollectionUtc,
                    }),
                };
                break;
        }

        AuthorityTopologyComparison result = await rig.ObserveAsync(candidate: candidate);

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal(reason == "forged_prepared_evidence" ? 1 : 0, rig.GraphReads);

        if (reason is "foreign_project" or "incomplete_coverage")
            Assert.Equal(0, rig.RunReads);

        if (reason is "foreign_run_record" or "stale_policy_pin")
            Assert.Equal(0, rig.CheckpointReads);
    }

    [Theory]
    [InlineData("wrong_graph")]
    [InlineData("wrong_context")]
    [InlineData("wrong_run")]
    [InlineData("missing_stamp")]
    [InlineData("multiple_context_nodes")]
    public async Task Scoped_lookup_result_still_has_to_match_all_exact_graph_anchors(string reason)
    {
        var rig = new Rehearsal();

        switch (reason)
        {
            case "wrong_graph":
                rig.Baseline.GraphSnapshotId = Guid.NewGuid();
                break;
            case "wrong_context":
                rig.Baseline.ContextSnapshotId = Guid.NewGuid();
                break;
            case "wrong_run":
                rig.Baseline.RunId = Guid.NewGuid();
                break;
            case "missing_stamp":
                rig.Baseline.Nodes[0].Properties.Remove(ContextGraphPropertyKeys.EvidencePackagePinsHashSha256Hex);
                break;
            case "multiple_context_nodes":
                rig.Baseline.Nodes.Add(new GraphNode { NodeId = "second-context", NodeType = GraphNodeTypes.ContextSnapshot });
                break;
        }

        AuthorityTopologyComparison result = await rig.ObserveAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal("effective_input_unverified", result.Reason);
        Assert.Equal(1, rig.GraphReads);
    }

    [Fact]
    public async Task Cancellation_during_input_read_propagates_without_an_observation()
    {
        using CancellationTokenSource cancel = new();
        var rig = new Rehearsal
        {
            AfterBaselineRead = _ => cancel.Cancel(),
        };

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => rig.ObserveAsync(ct: cancel.Token));
        Assert.Equal(1, rig.GraphReads);
    }

    [Fact]
    public async Task Authorized_adjacent_generation_can_be_observed_without_making_history_current()
    {
        var rig = new Rehearsal();
        rig.PreparePredecessor();
        rig.Baseline.CreatedUtc = new DateTime(2026, 11, 27, 12, 0, 0, DateTimeKind.Utc);
        rig.Candidate.CreatedUtc = rig.Baseline.CreatedUtc.AddMinutes(1);
        rig.Candidate.Nodes.Reverse();

        AuthorityTopologyComparison result = await rig.ObservePredecessorAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.EquivalentForConsumer, result.Outcome);
        Assert.Equal(result.BaselineFingerprint, result.CandidateFingerprint);
        Assert.Equal(2, rig.HistoryReads);
        Assert.Equal(2, rig.GraphReads);
        Assert.NotEqual(rig.Baseline.GraphSnapshotId, rig.Candidate.GraphSnapshotId);
        Assert.Equal(rig.Candidate.GraphSnapshotId.ToString("D"), rig.GraphClaim!.ResultReference);
    }

    [Theory]
    [InlineData("missing_history")]
    [InlineData("nonadjacent_fence")]
    [InlineData("nonadjacent_attempt")]
    [InlineData("same_output")]
    [InlineData("same_version")]
    [InlineData("changed_context")]
    [InlineData("invalid_reference")]
    public async Task Ambiguous_lineage_is_rejected_before_loading_any_graph(string issue)
    {
        var rig = new Rehearsal();
        rig.PreparePredecessor();
        AuthorityGraphCheckpointPredecessor saved = rig.Predecessor!;
        rig.Predecessor = issue switch
        {
            "missing_history" => null,
            "nonadjacent_fence" => saved with { Fence = 9 },
            "nonadjacent_attempt" => saved with { Attempts = 2 },
            "same_output" => saved with { ResultReference = rig.GraphId.ToString("D") },
            "same_version" => saved with { InputVersion = rig.GraphClaim!.InputVersion },
            "invalid_reference" => saved with { ResultReference = "opaque-reference" },
            _ => saved,
        };

        if (issue == "changed_context")
            rig.ContextClaim = Claim(rig.ContextId, fence: 2);

        AuthorityTopologyComparison result = await rig.ObservePredecessorAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal("checkpoint_lineage_unverified", result.Reason);
        Assert.Equal(0, rig.GraphReads);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Mid_comparison_history_or_active_replacement_discards_a_match(bool historyChanged)
    {
        var rig = new Rehearsal();
        rig.PreparePredecessor();
        rig.AfterCandidateRead = () =>
        {
            if (historyChanged)
            {
                rig.Predecessor = null;
            }
            else
            {
                rig.GraphClaim = Claim(rig.GraphId, fence: 3, attempts: 3);
            }
        };

        AuthorityTopologyComparison result = await rig.ObservePredecessorAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal(historyChanged ? "checkpoint_lineage_changed_during_observation" : "checkpoint_changed_during_observation", result.Reason);
        Assert.Null(result.EngineMultisetMatches);
    }

    [Fact]
    public async Task Historical_artifact_must_still_reference_the_exact_current_context()
    {
        var rig = new Rehearsal();
        rig.PreparePredecessor();
        rig.Baseline.ContextSnapshotId = Guid.NewGuid();

        AuthorityTopologyComparison result = await rig.ObservePredecessorAsync();

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal("effective_input_unverified", result.Reason);
        Assert.Equal(1, rig.GraphReads);
    }

    private static AnalysisRecoveryClaim Claim(Guid output, long fence = 1, string? version = null, int attempts = 1) => new()
    {
        State = "succeeded", InputVersion = version ?? new string('A', 64),
        ResultReference = output.ToString("D"), Fence = fence, Attempts = attempts,
    };

    private sealed class Rehearsal
    {
        private const string ContextWitness = "v2:fixture";
        private readonly Guid _runId = Guid.NewGuid();
        private readonly ProjectScopeKey _project = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        private readonly AuthorityTopologyShadowAdapter _adapter;
        private readonly string _policyPin;
        private readonly string _evidencePin;

        public Rehearsal()
        {
            Active = new ScopeContext { TenantId = _project.TenantId, WorkspaceId = _project.WorkspaceId, ProjectId = _project.ProjectId };
            string evidenceJson = JsonSerializer.Serialize(new[] { new PinnedEvidencePackageRow(Pin.Provider, Pin.PackageId!.Value, Pin.CollectionUtc) },
                ContractJson.CamelCaseIgnoreNullCompact);
            byte[] policyDigest = SHA256.HashData(Encoding.UTF8.GetBytes("[]"));
            byte[] evidenceDigest = SHA256.HashData(Encoding.UTF8.GetBytes(evidenceJson));
            _policyPin = Convert.ToHexString(policyDigest);
            _evidencePin = Convert.ToHexString(evidenceDigest);
            Run = new RunRecord
            {
                RunId = _runId, TenantId = _project.TenantId, WorkspaceId = _project.WorkspaceId, ScopeProjectId = _project.ProjectId,
                ContextSnapshotId = ContextId, GraphSnapshotId = GraphId,
                PinnedPolicyPackIdsJson = "[]", PinnedPolicyPackIdsHashSha256 = policyDigest,
                PinnedEvidencePackagePinsJson = evidenceJson, PinnedEvidencePackagePinsHashSha256 = evidenceDigest,
            };
            Baseline = Graph();
            Candidate = Graph();
            ContextClaim = Claim(ContextId);
            GraphClaim = Claim(GraphId);
            Preparation = new(_project, Context(Pin), new PolicyPackExpectationFacet(["private-network"], [], [], null, null),
                _policyPin, _evidencePin, new string('B', 64), new string('D', 64), AuthorityTopologyCoverage.VerifiedComplete);
            Mock<IScopeContextProvider> scopeProvider = new(MockBehavior.Strict);
            scopeProvider.Setup(x => x.GetCurrentScope()).Returns(Active);
            Mock<IRunRepository> runs = new(MockBehavior.Strict);
            runs.Setup(x => x.GetByIdAsync(It.Is<ScopeContext>(scope => InScope(scope)), _runId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => { RunReads++; return Run; });
            Mock<IGraphSnapshotRepository> graphs = new(MockBehavior.Strict);
            graphs.Setup(x => x.GetByIdAsync(It.Is<ScopeContext>(scope => InScope(scope)), GraphId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    GraphReads++;

                    if (GraphReads == 1)
                    {
                        AfterBaselineRead?.Invoke(this);
                        return Baseline;
                    }

                    AfterCandidateRead?.Invoke();
                    return Candidate;
                });
            graphs.Setup(x => x.GetByIdAsync(It.Is<ScopeContext>(scope => InScope(scope)), PredecessorGraphId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    GraphReads++;
                    AfterBaselineRead?.Invoke(this);
                    return Baseline;
                });
            Mock<IAnalysisRecoveryRepository> checkpoints = new(MockBehavior.Strict);
            checkpoints.Setup(x => x.ReadAsync(new AnalysisRecoveryStageKey(_project, "authority", _runId, "context_ingestion"), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => { CheckpointReads++; return ContextClaim; });
            checkpoints.Setup(x => x.ReadAsync(new AnalysisRecoveryStageKey(_project, "authority", _runId, "graph"), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => { CheckpointReads++; return GraphClaim; });
            checkpoints.Setup(x => x.ReadImmediateAuthorityGraphPredecessorAsync(_project, _runId, 2, It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => { HistoryReads++; return Predecessor; });
            _adapter = new(scopeProvider.Object, runs.Object, graphs.Object, checkpoints.Object, new FakeTimeProvider());
        }

        public Guid ContextId { get; } = Guid.NewGuid();
        public Guid GraphId { get; } = Guid.NewGuid();
        public Guid PredecessorGraphId { get; } = Guid.NewGuid();
        public AuthorityGraphCheckpointPredecessor? Predecessor { get; set; }
        public int HistoryReads { get; private set; }
        public EvidencePackagePin Pin { get; } = new()
        {
            PackageId = Guid.NewGuid(), Provider = "azure", CollectionUtc = new DateTime(2026, 11, 27, 12, 0, 0, DateTimeKind.Utc),
        };
        public GraphSnapshot Baseline { get; }
        public GraphSnapshot Candidate { get; }
        public ScopeContext Active { get; }
        public RunRecord Run { get; }
        public AuthorityTopologyShadowPreparation Preparation { get; }
        public Action<Rehearsal>? AfterBaselineRead { get; set; }
        public Action? AfterCandidateRead { get; set; }
        public AnalysisRecoveryClaim? ContextClaim { get; set; }
        public AnalysisRecoveryClaim? GraphClaim { get; set; }
        public int RunReads { get; private set; }
        public int GraphReads { get; private set; }
        public int CheckpointReads { get; private set; }

        public Task<AuthorityTopologyComparison> ObserveAsync(AuthorityTopologyShadowPreparation? candidate = null, CancellationToken ct = default) =>
            _adapter.ObserveAsync(_project, _runId, Preparation, candidate ?? Preparation, ct);

        public Task<AuthorityTopologyComparison> ObservePredecessorAsync() =>
            _adapter.ObservePredecessorAsync(_project, _runId, Preparation, Preparation, CancellationToken.None);

        public void PreparePredecessor()
        {
            Baseline.GraphSnapshotId = PredecessorGraphId;
            GraphClaim = Claim(GraphId, fence: 2, version: new string('C', 64), attempts: 2);
            Predecessor = new(new string('A', 64), 1, 1, PredecessorGraphId.ToString("D"),
                new DateTime(2026, 11, 27, 13, 0, 0, DateTimeKind.Utc));
        }

        public FindingAnalysisContext Context(EvidencePackagePin pin) => new()
        {
            RunId = _runId, ContextSnapshotId = ContextId, ContextCanonicalFingerprint = ContextWitness,
            HasCreateTimeEvidencePinCommitment = true, EvidencePin = pin, EvidencePins = [pin],
        };

        public AuthorityTopologyRehearsalInput RawInput(GraphSnapshot graph) => new(_project, graph,
            new string('A', 64), _policyPin, _evidencePin, new string('D', 64), AuthorityTopologyCoverage.VerifiedComplete,
            AuthorityTopologyOfflineComparison.ProjectionVersion, AuthorityTopologyOfflineComparison.EngineBuild);

        private bool InScope(ScopeContext scope) => _project.Matches(scope.TenantId, scope.WorkspaceId, scope.ProjectId);

        private GraphSnapshot Graph() => new()
        {
            RunId = _runId, ContextSnapshotId = ContextId, GraphSnapshotId = GraphId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context", NodeType = GraphNodeTypes.ContextSnapshot,
                    Properties =
                    {
                        [ContextGraphPropertyKeys.ContextCanonicalFingerprint] = ContextWitness,
                        [ContextGraphPropertyKeys.PolicyPackPinsHashSha256Hex] = _policyPin,
                        [ContextGraphPropertyKeys.EvidencePackagePinsHashSha256Hex] = _evidencePin,
                    },
                },
                new GraphNode
                {
                    NodeId = "compute", NodeType = GraphNodeTypes.TopologyResource, Category = GraphTopologyCategories.Compute,
                    Label = "api", Properties = { ["publicEndpoint"] = "true" },
                },
            ],
        };
    }
}
