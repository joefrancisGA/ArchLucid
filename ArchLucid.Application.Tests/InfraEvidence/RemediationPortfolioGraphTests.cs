using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioGraphTests
{
    [Fact]
    public async Task Two_findings_keep_provenance_but_one_scenario_counts_once()
    {
        var f = new Fixture();
        var graph = await f.ReadAsync();
        var cause = Assert.Single(graph.Causes);
        var action = Assert.Single(graph.Actions);
        var scenario = Assert.Single(graph.Scenarios);
        Assert.Equal(f.FindingIds.Order(), cause.FindingIds);
        Assert.Equal(f.FindingIds.Order(), action.FindingIds);
        Assert.Equal(cause.Id, scenario.CauseId);
        Assert.True(action.Eligible);
        Assert.True(graph.CanEvaluateSelections);
        Assert.Contains(action.Evidence, item => item.Kind == PortfolioEvidenceKind.Path);
        Assert.Contains(action.Evidence, item => item.Kind == PortfolioEvidenceKind.PatternMatch);

        var result = graph.EvaluateSelection([action.Id]);
        Assert.True(result.Feasible);
        Assert.Equal(scenario.Id, Assert.Single(result.CoveredScenarioIds));
        Assert.Empty(result.UnknownScenarioIds);
    }

    [Fact]
    public async Task Aliases_collapse_by_scoped_target_kind_and_approved_version_not_by_titles()
    {
        var f = new Fixture();
        var second = f.Action("strengthen-control", Guid.NewGuid());
        var proposal = f.Proposal with
        {
            Actions = [f.First with { FindingIds = [f.FindingIds[0]] }, second with { FindingIds = [f.FindingIds[1]] }],
            Coverage = [f.Clause(f.First.Key), f.Clause(second.Key)],
        };
        var graph = await f.ReadAsync(proposal);
        var action = Assert.Single(graph.Actions);
        Assert.Equal(f.FindingIds.Order(), action.FindingIds);
        Assert.Single(graph.Coverage);
        Assert.Single(graph.EvaluateSelection([action.Id, action.Id]).CoveredScenarioIds);
    }

    [Fact]
    public async Task Independently_stated_scenarios_do_not_collapse_just_because_they_share_a_cause()
    {
        var f = new Fixture();
        var another = f.Scenario with { Key = Guid.NewGuid() };
        var proposal = f.Proposal with
        {
            Scenarios = [f.Scenario, another],
            Coverage = [f.Clause(f.First.Key), f.Clause(f.First.Key) with { ScenarioKey = another.Key }],
        };
        var graph = await f.ReadAsync(proposal);
        Assert.Single(graph.Causes);
        Assert.Equal(2, graph.EvaluateSelection([graph.Actions[0].Id]).CoveredScenarioIds.Count);
    }

    [Fact]
    public async Task Independently_sufficient_alternatives_never_double_count_a_scenario()
    {
        var f = new Fixture();
        var second = f.Action("isolate-control", Guid.NewGuid());
        var proposal = f.Proposal with
        {
            Actions = [f.First, second],
            Relationships = [f.Relation(f.First.Key, second.Key, PortfolioRelationship.Alternative)],
            Coverage = [f.Clause(f.First.Key), f.Clause(second.Key)],
        };
        var graph = await f.ReadAsync(proposal);
        Assert.Equal(2, graph.Actions.Count);
        Assert.Single(graph.EvaluateSelection([graph.Actions[0].Id]).CoveredScenarioIds);
        Assert.Single(graph.EvaluateSelection([graph.Actions[1].Id]).CoveredScenarioIds);
        Assert.Single(graph.EvaluateSelection(graph.Actions.Select(x => x.Id)).CoveredScenarioIds);
    }

    [Fact]
    public async Task A_joint_clause_requires_every_distinct_action()
    {
        var f = new Fixture();
        var second = f.Action("isolate-control", Guid.NewGuid());
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [f.First, second],
            Coverage = [f.Clause(f.First.Key, second.Key)],
        });
        Assert.Empty(graph.EvaluateSelection([graph.Actions[0].Id]).CoveredScenarioIds);
        Assert.Empty(graph.EvaluateSelection([graph.Actions[1].Id]).CoveredScenarioIds);
        Assert.Single(graph.EvaluateSelection(graph.Actions.Select(x => x.Id)).CoveredScenarioIds);
    }

    [Fact]
    public async Task Same_content_aliases_cannot_satisfy_a_multi_action_bundle()
    {
        var f = new Fixture();
        var alias = f.First with { Key = Guid.NewGuid() };
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [f.First, alias],
            Coverage = [f.Clause(f.First.Key, alias.Key)],
        });
        Assert.Empty(graph.Coverage);
        Assert.Contains(graph.Issues, row => row.Reason == "coverage_bundle_incompatible");
        Assert.Single(graph.EvaluateSelection([]).UnknownScenarioIds);
    }

    [Fact]
    public async Task Prerequisites_are_directional_and_transitive()
    {
        var f = new Fixture();
        var second = f.Action("isolate-control", Guid.NewGuid());
        var third = f.Action("verify-control", Guid.NewGuid());
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [f.First, second, third],
            Relationships = [f.Relation(f.First.Key, second.Key, PortfolioRelationship.Requires),
                f.Relation(second.Key, third.Key, PortfolioRelationship.Requires)],
        });
        string firstId = graph.Actions.Single(x => x.ActionKind == f.First.ActionKind).Id;
        string secondId = graph.Actions.Single(x => x.ActionKind == second.ActionKind).Id;
        string thirdId = graph.Actions.Single(x => x.ActionKind == third.ActionKind).Id;
        Assert.False(graph.EvaluateSelection([firstId, secondId]).Feasible);
        Assert.True(graph.EvaluateSelection([thirdId]).Feasible);
        Assert.Single(graph.EvaluateSelection([firstId, secondId, thirdId]).CoveredScenarioIds);
    }

    [Fact]
    public async Task A_cycle_blocks_its_dependents_but_not_unrelated_actions()
    {
        var f = new Fixture();
        var second = f.Action("isolate-control", Guid.NewGuid());
        var third = f.Action("verify-control", Guid.NewGuid());
        var unrelated = f.Action("review-control", Guid.NewGuid());
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [f.First, second, third, unrelated],
            Relationships = [
                f.Relation(f.First.Key, second.Key, PortfolioRelationship.Requires),
                f.Relation(second.Key, f.First.Key, PortfolioRelationship.Requires),
                f.Relation(third.Key, f.First.Key, PortfolioRelationship.Requires),
            ],
        });
        Assert.Equal(unrelated.ActionKind, Assert.Single(graph.Actions, x => x.Eligible).ActionKind);
        Assert.Contains(graph.Issues, row => row.Reason == "prerequisite_cycle_or_dependency_on_cycle");
        Assert.Empty(graph.Coverage);
    }

    [Fact]
    public async Task Conflicts_are_symmetric_and_an_incompatible_chain_is_not_a_candidate()
    {
        var f = new Fixture();
        var second = f.Action("isolate-control", Guid.NewGuid());
        var third = f.Action("verify-control", Guid.NewGuid());
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [f.First, second, third],
            Relationships = [
                f.Relation(second.Key, f.First.Key, PortfolioRelationship.Conflicts),
                f.Relation(third.Key, f.First.Key, PortfolioRelationship.Requires),
                f.Relation(third.Key, second.Key, PortfolioRelationship.Requires),
            ],
            Coverage = [f.Clause(f.First.Key, second.Key)],
        });
        Assert.False(graph.Actions.Single(x => x.ActionKind == third.ActionKind).Eligible);
        Assert.Contains(graph.Issues, row => row.Reason == "prerequisite_chain_conflicts");
        Assert.Contains(graph.Issues, row => row.Reason == "coverage_bundle_incompatible");
        string[] ids = graph.Actions.Where(x => x.Eligible).Select(x => x.Id).ToArray();
        Assert.Equal(2, ids.Length);
        Assert.False(graph.EvaluateSelection(ids).Feasible);
        Assert.False(graph.EvaluateSelection(ids.Reverse()).Feasible);
        Assert.Empty(graph.EvaluateSelection(ids).CoveredScenarioIds);
    }

    [Theory]
    [InlineData(PortfolioSupport.Unknown, true)]
    [InlineData(PortfolioSupport.Candidate, false)]
    [InlineData(PortfolioSupport.Reviewed, true)]
    public async Task Missing_or_unverified_prerequisite_is_not_silently_dropped(PortfolioSupport support, bool dangling)
    {
        var f = new Fixture();
        var second = f.Action("isolate-control", Guid.NewGuid());
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [f.First, second],
            Relationships = [f.Relation(f.First.Key, dangling ? Guid.NewGuid() : second.Key,
                PortfolioRelationship.Requires) with { Support = support }],
        });
        Assert.False(graph.Actions.Single(x => x.ActionKind == f.First.ActionKind).Eligible);
        Assert.Empty(graph.Coverage);
        Assert.Contains(graph.Issues, row => row.Reason == "required_constraint_unverified_or_invalid");
    }

    [Fact]
    public async Task A_confirmed_action_and_cut_point_are_not_automatic_coverage()
    {
        var f = new Fixture();
        var action = f.First with { TargetResourceId = f.Cut.CloudResourceId!.Value,
            Evidence = [.. f.First.Evidence, RemediationPortfolioGraphBuilder.Reference(f.Cut)] };
        var graph = await f.ReadAsync(f.Proposal with
        {
            Actions = [action],
            Coverage = [f.Clause(action.Key) with { Support = PortfolioSupport.Candidate }],
        });
        Assert.True(Assert.Single(graph.Actions).Eligible);
        Assert.Empty(graph.Coverage);
        Assert.Single(graph.EvaluateSelection([graph.Actions[0].Id]).UnknownScenarioIds);
        f.Cuts.Verify(repo => repo.ListBySnapshotAsync(f.Scope, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task An_unrelated_same_snapshot_cut_point_cannot_bind_an_action_target()
    {
        var f = new Fixture(cutCitesPath: false);
        var action = f.First with { TargetResourceId = f.Cut.CloudResourceId!.Value,
            Evidence = [.. f.First.Evidence, RemediationPortfolioGraphBuilder.Reference(f.Cut)] };
        var graph = await f.ReadAsync(f.Proposal with { Actions = [action] });
        Assert.False(graph.Actions[0].Eligible);
        Assert.Contains(graph.Issues, row => row.Reason == "action_target_or_match_unverified");
    }

    [Fact]
    public async Task A_new_match_without_the_reviewed_pin_cannot_substitute_for_evidence()
    {
        var f = new Fixture();
        var action = f.First with
        {
            Evidence = f.First.Evidence.Where(x => x.Kind != PortfolioEvidenceKind.PatternMatch).ToArray(),
        };
        var graph = await f.ReadAsync(f.Proposal with { Actions = [action] });
        Assert.False(graph.Actions[0].Eligible);
        Assert.Empty(graph.Coverage);
    }

    [Fact]
    public async Task Changed_path_content_at_the_same_identity_invalidates_prior_evidence()
    {
        var f = new Fixture();
        var action = f.First with { Evidence = f.First.Evidence.Select(x => x.Kind == PortfolioEvidenceKind.Path
            ? x with { Sha256 = new string('A', 64) } : x).ToArray() };
        var graph = await f.ReadAsync(f.Proposal with { Actions = [action] });
        Assert.False(graph.Actions[0].Eligible);
        Assert.Contains(graph.Issues, row => row.Reason == "action_evidence_missing_or_stale");
    }

    [Fact]
    public async Task Unverified_common_cause_does_not_credit_an_otherwise_valid_action()
    {
        var f = new Fixture();
        var cause = f.Proposal.Causes[0] with { Support = PortfolioSupport.Candidate };
        var graph = await f.ReadAsync(f.Proposal with { Causes = [cause] });
        Assert.True(graph.Actions[0].Eligible);
        Assert.False(graph.Causes[0].Reviewed);
        Assert.False(graph.Scenarios[0].Reviewed);
        var evaluation = graph.EvaluateSelection([graph.Actions[0].Id]);
        Assert.Empty(evaluation.CoveredScenarioIds);
        Assert.Single(evaluation.UnknownScenarioIds);
    }

    [Fact]
    public async Task Missing_stale_or_noncurrent_sources_leave_coverage_unknown()
    {
        foreach (var f in new[] { new Fixture(returnPaths: false), new Fixture(stalePath: true),
                     new Fixture(currentPattern: false) })
        {
            var graph = await f.ReadAsync();
            Assert.False(graph.Actions[0].Eligible);
            Assert.Empty(graph.Coverage);
            Assert.Single(graph.EvaluateSelection([]).UnknownScenarioIds);
        }
    }

    [Fact]
    public async Task Incomplete_snapshot_or_dependency_inventory_refuses_even_an_empty_selection()
    {
        var partial = new Fixture(complete: false);
        var graph = await partial.ReadAsync();
        Assert.False(graph.CanEvaluateSelections);
        Assert.False(graph.EvaluateSelection([]).Feasible);
        Assert.Contains(graph.Issues, row => row.Reason == "snapshot_coverage_incomplete");

        var full = new Fixture();
        graph = await full.ReadAsync(full.Proposal with { DependenciesComplete = false });
        Assert.False(graph.CanEvaluateSelections);
        Assert.False(graph.EvaluateSelection([]).Feasible);
        Assert.Contains(graph.Issues, row => row.Reason == "dependency_inventory_incomplete");
    }

    [Fact]
    public async Task Cross_scope_evidence_fails_closed_even_if_the_repository_returns_it()
    {
        var f = new Fixture(crossScopePath: true);
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.ReadAsync());
    }

    [Fact]
    public async Task Wrong_scope_or_changed_proposal_digest_rejects_before_reading_any_evidence()
    {
        var f = new Fixture();
        var other = ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(
            f.Scope.TenantId, f.Scope.WorkspaceId, Guid.NewGuid()), f.Scope.SnapshotId);
        await Assert.ThrowsAsync<ArgumentException>(() => f.Reader.ReadAsync(other, f.Proposal, f.Pin));
        await Assert.ThrowsAsync<ArgumentException>(() => f.Reader.ReadAsync(f.Scope,
            f.Proposal with { Binding = f.Proposal.Binding with { PolicyVersion = "v2" } }, f.Pin));
        f.Snapshots.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task A_replaced_capture_invalidates_the_graph_instead_of_silently_repinning()
    {
        var f = new Fixture(wrongInventory: true);
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.ReadAsync());
    }

    [Fact]
    public async Task Reordering_proposals_references_and_symmetric_edges_produces_the_same_digest()
    {
        var f = new Fixture();
        var other = f.Action("isolate-control", Guid.NewGuid());
        var relation = f.Relation(f.First.Key, other.Key, PortfolioRelationship.Conflicts);
        var input = f.Proposal with
        {
            Actions = [f.First, other],
            Relationships = [relation],
            Coverage = [f.Clause(f.First.Key), f.Clause(other.Key)],
        };
        var reordered = input with
        {
            Actions = input.Actions.Reverse().Select(x => x with
                { FindingIds = x.FindingIds.Reverse().ToArray(), Evidence = x.Evidence.Reverse().ToArray() }).ToArray(),
            Relationships = [relation with { FirstAction = relation.SecondAction, SecondAction = relation.FirstAction }],
            Coverage = input.Coverage.Reverse().ToArray(),
        };
        Assert.Equal(RemediationPortfolioGraphBuilder.ComputeProposalSha256(input),
            RemediationPortfolioGraphBuilder.ComputeProposalSha256(reordered));
        Assert.Equal((await f.ReadAsync(input)).GraphSha256, (await f.ReadAsync(reordered)).GraphSha256);
    }

    [Fact]
    public async Task Reviewed_policy_revision_changes_graph_identity_without_renaming_the_same_action()
    {
        var f = new Fixture();
        var first = await f.ReadAsync();
        var second = await f.ReadAsync(f.Proposal with { Binding = f.Proposal.Binding with { PolicyVersion = "v2" } });
        Assert.NotEqual(first.GraphSha256, second.GraphSha256);
        Assert.Equal(first.Actions[0].Id, second.Actions[0].Id);
    }

    [Fact]
    public async Task Current_approved_pattern_revision_is_part_of_the_stable_action_identity()
    {
        Guid newVersion = Guid.NewGuid();
        var first = new Fixture();
        var second = new Fixture(scope: first.Scope, target: first.Target, pattern: first.Pattern,
            version: newVersion);
        Assert.NotEqual((await first.ReadAsync()).Actions[0].Id, (await second.ReadAsync()).Actions[0].Id);
    }

    [Fact]
    public async Task Duplicate_logical_source_proposal_keys_fail_before_repository_access()
    {
        var f = new Fixture();
        await Assert.ThrowsAsync<ArgumentException>(() => f.Reader.ReadAsync(f.Scope,
            f.Proposal with { Actions = [f.First, f.First] }, f.Pin));
        f.Snapshots.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Read_graph_handoff_preserves_canonical_actions_in_the_advisory_plan()
    {
        var fixture = new Fixture();
        var graph = await fixture.ReadAsync();
        var action = Assert.Single(graph.Actions);
        var scenario = Assert.Single(graph.Scenarios);
        var pin = new PortfolioOptimizationPin(graph.Binding, graph.GraphSha256);
        var request = new PortfolioOptimizationRequest(pin, "scenario-policy-v1", "estimate-policy-v1",
            new("USD", 25, [], 0), [new(scenario.Id, 42)],
            [new(action.Id, "reviewed-v1", new(25, PortfolioEstimateKind.ReviewedEstimate),
                [], PortfolioEstimateKind.Measured, new(0, PortfolioEstimateKind.Measured))],
            [], new(pin, "rank-v1", fixture.FindingIds, 2), new(25, 25, TimeSpan.FromSeconds(1)));

        var result = new BoundedRemediationPortfolioOptimizer(new FakeTimeProvider()).Optimize(pin, graph, request);

        Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
        var plan = Assert.IsType<PortfolioAdvisoryPlan>(result.BestFeasiblePlan);
        Assert.Equal(action.Id, Assert.Single(plan.SelectedActionIds));
        Assert.Equal(scenario.Id, Assert.Single(plan.CoveredScenarioIds));
        Assert.Equal(42, plan.ModeledCoveragePoints);
        Assert.Equal(action.Id, Assert.Single(result.TopN.Plan!.SelectedActionIds));
        Assert.Equal(25, result.TopN.Plan.Usage.Cost);
    }

    private sealed class Fixture
    {
        public ProjectSnapshotScopeKey Scope { get; }
        public Guid Pattern { get; }
        public Guid Target { get; }
        private Guid Version { get; }
        public Guid[] FindingIds { get; }
        public PortfolioActionProposal First { get; }
        public PortfolioScenarioProposal Scenario { get; }
        public RemediationPortfolioProposal Proposal { get; }
        public string Pin { get; }
        public SecurityEvidenceCutPointRecord Cut { get; }
        public Mock<IAzureInventorySnapshotRepository> Snapshots { get; } = new(MockBehavior.Strict);
        public Mock<ISecurityEvidenceCutPointRepository> Cuts { get; } = new(MockBehavior.Strict);
        private PortfolioEvidenceReference[] Facts { get; }
        private PortfolioEvidenceReference[] ActionEvidence { get; }
        public RemediationPortfolioGraphReader Reader { get; }

        public Fixture(bool complete = true, bool returnPaths = true, bool stalePath = false, bool currentPattern = true,
            bool crossScopePath = false, bool wrongInventory = false, bool cutCitesPath = true,
            ProjectSnapshotScopeKey? scope = null, Guid? target = null, Guid? pattern = null, Guid? version = null)
        {
            Scope = scope ?? ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid());
            Pattern = pattern ?? Guid.NewGuid();
            Target = target ?? Guid.NewGuid();
            Version = version ?? Guid.NewGuid();
            FindingIds = [Guid.NewGuid(), Guid.NewGuid()];
            var path = new SecurityEvidencePathRecord
            {
                PathId = Guid.NewGuid(), TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId,
                ProjectId = crossScopePath ? Guid.NewGuid() : Scope.ProjectId,
                SnapshotId = stalePath ? Guid.NewGuid() : Scope.SnapshotId,
                CanonicalHopHashSha256 = new byte[32],
            };
            var findingRows = FindingIds.Select(id => new OperationalSecurityFindingRecord
            {
                FindingId = id, TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId, ProjectId = Scope.ProjectId,
                PathId = path.PathId, CloudResourceId = Target, Status = OperationalSecurityFindingStatus.Open,
            }).ToArray();
            var approved = new RemediationPatternVersionRecord
            {
                TenantId = Scope.TenantId, PatternId = Pattern, VersionId = Version, Version = "1",
                Status = RemediationPatternStatus.Approved,
            };
            var matchRows = FindingIds.Select(id => new RemediationPatternMatchResultRecord
            {
                MatchResultId = Guid.NewGuid(), TenantId = Scope.TenantId, FindingId = id, PatternId = Pattern,
                VersionId = Version, IsActive = true, MatchKind = RemediationPatternMatchKind.ExactMatch,
                PatternKey = "pattern", PatternVersion = "1",
            }).ToArray();
            Cut = new()
            {
                CutPointId = Guid.NewGuid(), TenantId = Scope.TenantId, SnapshotId = Scope.SnapshotId,
                CloudResourceId = Guid.NewGuid(), SuggestedPatternKey = "pattern",
                CollapsedPathIdsJson = JsonSerializer.Serialize(new[] { cutCitesPath ? path.PathId : Guid.NewGuid() }),
            };
            Facts = [.. findingRows.Select(RemediationPortfolioGraphBuilder.Reference), RemediationPortfolioGraphBuilder.Reference(path)];
            ActionEvidence = [.. Facts, RemediationPortfolioGraphBuilder.Reference(approved),
                .. matchRows.Select(RemediationPortfolioGraphBuilder.Reference)];
            First = Action("strengthen-control", Guid.NewGuid());
            var cause = new PortfolioCauseProposal(Guid.NewGuid(), FindingIds, PortfolioSupport.Reviewed, Facts);
            Scenario = new(Guid.NewGuid(), cause.Key, FindingIds, PortfolioSupport.Reviewed, Facts);
            Proposal = new(new PortfolioBinding(Scope, new string('0', 64), "v1", "v1", "v1"),
                true, [First], [cause], [Scenario], [], [Clause(First.Key)]);
            Pin = RemediationPortfolioGraphBuilder.ComputeProposalSha256(Proposal);

            Snapshots.Setup(repo => repo.TryGetBySnapshotIdAsync(
                    It.Is<ScopeContext>(x => Scope.Project.Matches(x.TenantId, x.WorkspaceId, x.ProjectId)),
                    Scope.SnapshotId, CancellationToken.None))
                .ReturnsAsync(new AzureInventorySnapshotRecord
                {
                    TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId, ProjectId = Scope.ProjectId,
                    SnapshotId = Scope.SnapshotId, CapturedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    ContentHashSha256 = wrongInventory ? Enumerable.Repeat((byte)1, 32).ToArray() : new byte[32],
                    CaptureStatus = AzureInventoryCaptureStatus.Succeeded, CompletenessScore = complete ? 1m : 0.5m,
                });
            Mock<IProjectScopedOperationalSecurityFindingRepository> findings = new(MockBehavior.Strict);
            findings.Setup(repo => repo.ListByIdsInScopeAsync(Scope.Project, It.IsAny<IReadOnlyList<Guid>>(), CancellationToken.None))
                .ReturnsAsync((ProjectScopeKey _, IReadOnlyList<Guid> keys, CancellationToken _) =>
                    findingRows.Where(row => keys.Contains(row.FindingId)).ToArray());
            Mock<ISecurityEvidencePathRepository> paths = new(MockBehavior.Strict);
            paths.Setup(repo => repo.ListByIdsInScopeAsync(Scope.Project, It.IsAny<IReadOnlyCollection<Guid>>(), CancellationToken.None))
                .ReturnsAsync(returnPaths ? [path] : []);
            Cuts.Setup(repo => repo.ListBySnapshotAsync(Scope, CancellationToken.None)).ReturnsAsync([Cut]);
            Mock<IRemediationPatternRepository> patterns = new(MockBehavior.Strict);
            patterns.Setup(repo => repo.TryGetCurrentApprovedVersionAsync(Scope.TenantId, Pattern, CancellationToken.None))
                .ReturnsAsync(currentPattern ? new RemediationPatternApprovedVersionRecord
                {
                    Pattern = new RemediationPatternRecord { PatternId = Pattern, TenantId = Scope.TenantId, CurrentApprovedVersion = "1" },
                    Version = approved,
                } : null);
            Mock<IRemediationPatternMatchRepository> matches = new(MockBehavior.Strict);
            foreach (var match in matchRows)
                matches.Setup(repo => repo.TryGetActiveMatchInScopeAsync(Scope.Project, match.FindingId, CancellationToken.None))
                    .ReturnsAsync(match);
            Reader = new(Snapshots.Object, findings.Object, paths.Object, Cuts.Object, matches.Object, patterns.Object);
        }

        public PortfolioActionProposal Action(string kind, Guid id) =>
            new(id, kind, Target, Pattern, Version, FindingIds, ActionEvidence);
        public PortfolioCoverageProposal Clause(params Guid[] actions) =>
            new(Scenario.Key, actions, PortfolioSupport.Reviewed, Facts);
        public PortfolioRelationshipProposal Relation(Guid from, Guid to, PortfolioRelationship kind) =>
            new(from, to, kind, PortfolioSupport.Reviewed, Facts);
        public Task<RemediationPortfolioGraph> ReadAsync(RemediationPortfolioProposal? proposal = null)
        {
            proposal ??= Proposal;
            return Reader.ReadAsync(Scope, proposal, RemediationPortfolioGraphBuilder.ComputeProposalSha256(proposal));
        }
    }
}
