using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioEffectivenessTests
{
    private const string Scenario = "reviewed-scenario";
    private const string Hash = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    [Fact]
    public async Task Fresh_complete_later_evidence_and_the_existing_verifier_establish_agreement()
    {
        var fixture = new Fixture();
        var result = await fixture.RunAsync(fixture.Instance());
        Assert.Equal(PortfolioEffectivenessStatus.Measured, result.Status);
        Assert.Equal(fixture.LaterId, result.LaterSnapshotId);
        var compared = Assert.Single(result.Scenarios);
        Assert.Equal(PortfolioExposureState.AbsentWithinCoverage, compared.Observed);
        Assert.Equal(PortfolioObservedComparison.Agrees, compared.Comparison);
        Assert.Equal(Hash, compared.ObservedEvidenceSha256);
        Assert.Equal(fixture.InstanceId, Assert.Single(result.VerifiedActionReceipts).InstanceId);
        fixture.Instances.Verify(row => row.TryGetByIdInScopeAsync(fixture.Scope.Project, fixture.InstanceId,
            CancellationToken.None), Times.Once);
        fixture.Instances.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(RemediationInstanceStatus.Approved)]
    [InlineData(RemediationInstanceStatus.Executed)]
    [InlineData(RemediationInstanceStatus.ChangeImplemented)]
    [InlineData(RemediationInstanceStatus.VerificationFailed)]
    public async Task Approval_application_or_failed_verification_alone_never_earns_credit(RemediationInstanceStatus status)
    {
        var fixture = new Fixture();
        var result = await fixture.RunAsync(fixture.Instance(status));
        AssertUnknown(result);
    }

    [Fact]
    public async Task Fresh_positive_observation_can_contradict_an_expected_removal()
    {
        var fixture = new Fixture();
        var review = fixture.Review with { Observations = [new(Scenario, PortfolioExposureState.Present, Hash)] };
        var result = await fixture.RunAsync(fixture.Instance(RemediationInstanceStatus.VerificationFailed), review: review);
        Assert.Equal(PortfolioEffectivenessStatus.Measured, result.Status);
        Assert.Equal(PortfolioObservedComparison.Contradicts, Assert.Single(result.Scenarios).Comparison);
    }

    [Fact]
    public async Task Missing_incomplete_or_stale_capture_never_counts_as_observed_absence()
    {
        var fixture = new Fixture();
        foreach (var later in new AzureInventorySnapshotRecord?[]
                 { null, fixture.Snapshot(fixture.LaterId, fixture.After, complete: false), fixture.Snapshot(fixture.LaterId, fixture.Before) })
        {
            AssertUnknown(await fixture.RunAsync(fixture.Instance(), later: () => later));
        }
    }

    [Fact]
    public async Task Capture_must_be_strictly_after_the_applied_change()
    {
        var fixture = new Fixture();
        var sameTime = fixture.Snapshot(fixture.LaterId, fixture.Applied);
        AssertUnknown(await fixture.RunAsync(fixture.Instance(), later: () => sameTime));
    }

    [Theory]
    [InlineData("{\"passed\":true,\"failures\":[]}")]
    [InlineData("{\"passed\":false,\"passed\":true,\"failures\":[]}")]
    [InlineData("not-json")]
    public async Task Incomplete_or_forged_legacy_status_without_the_complete_bound_receipt_is_unknown(string json)
    {
        var fixture = new Fixture();
        AssertUnknown(await fixture.RunAsync(fixture.Instance(receipt: json)));
    }

    [Fact]
    public async Task An_out_of_scope_snapshot_and_a_wrong_action_binding_are_rejected()
    {
        var fixture = new Fixture();
        var foreign = fixture.Snapshot(fixture.LaterId, fixture.After, foreign: true);
        var outside = await fixture.RunAsync(fixture.Instance(), later: () => foreign);
        var wrongAction = await fixture.RunAsync(fixture.Instance(target: Guid.NewGuid()));
        foreach (var result in new[] { outside, wrongAction })
        {
            Assert.Equal(PortfolioEffectivenessStatus.Rejected, result.Status);
            Assert.Empty(result.Scenarios);
        }
    }

    [Fact]
    public async Task An_unreviewed_change_to_the_observed_roster_is_rejected_before_reading()
    {
        var fixture = new Fixture();
        var changed = fixture.Review with { Observations = [new(Scenario, PortfolioExposureState.Present, Hash)] };
        var result = await fixture.Reader.ReadAsync(fixture.Pin, fixture.Graph, fixture.Plan, fixture.Modeled, changed,
            PortfolioEffectivenessReader.ReviewSha256(fixture.Review));
        Assert.Equal(PortfolioEffectivenessStatus.Rejected, result.Status);
        fixture.Instances.VerifyNoOtherCalls();
        fixture.Snapshots.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Unobserved_scenario_is_unknown_even_if_the_instance_was_verified()
    {
        var fixture = new Fixture();
        AssertUnknown(await fixture.RunAsync(fixture.Instance(), review: fixture.Review with { Observations = [] }));
    }

    [Fact]
    public async Task Cancellation_is_forwarded_without_reading_or_mutating()
    {
        var fixture = new Fixture();
        using var source = new CancellationTokenSource();
        source.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Reader.ReadAsync(
            fixture.Pin, fixture.Graph, fixture.Plan, fixture.Modeled, fixture.Review,
            PortfolioEffectivenessReader.ReviewSha256(fixture.Review), source.Token));
        fixture.Instances.VerifyNoOtherCalls();
        fixture.Snapshots.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promotion_requires_checked_fixture_quality_resources_and_later_observations()
    {
        var fixture = new Fixture();
        var observation = await fixture.RunAsync(fixture.Instance());
        var report = Benchmark();
        var policy = Policy();
        var valid = Evaluate(policy, report, [observation, observation]);
        var missing = Evaluate(policy, report, []);
        var unsafeSolver = Evaluate(policy, report with
        {
            Measurements = [report.Measurements[0] with { FeasibleAndWithinExpectedQuality = false }],
        }, [observation]);
        var highCost = Evaluate(policy with { MaximumComputeCostUsd = 0.001m }, report, [observation]);
        var pricedReport = report with
        {
            UsdPerCpuHour = 3_600m,
            Measurements = [report.Measurements[0] with { EstimatedComputeCostUsd = 0.02m }],
        };
        var withinBudget = Evaluate(policy with { MaximumComputeCostUsd = 0.025m }, pricedReport, [observation]);
        var missingFixture = Evaluate(policy with { RequiredBenchmarkFixtureIds = ["medium"] }, report, [observation]);
        var unchanged = observation with
        {
            Scenarios = [observation.Scenarios[0] with { Baseline = PortfolioExposureState.AbsentWithinCoverage }],
        };
        var noMeasuredChange = Evaluate(policy, report, [unchanged]);
        var invalidPin = PortfolioPromotionAssurance.Evaluate(policy, report, [observation], Hash);

        Assert.True(valid.EligibleForPromotionReview, string.Join(", ", valid.Issues.Select(row => row.Reason)));
        Assert.Equal(1, valid.Calibration.MeasuredSamples);
        Assert.Equal(1, valid.Calibration.Agreements);
        Assert.Equal(1, valid.Calibration.MeasuredChangedPredictions);
        Assert.False(missing.EligibleForPromotionReview);
        Assert.False(unsafeSolver.EligibleForPromotionReview);
        Assert.False(highCost.EligibleForPromotionReview);
        Assert.False(missingFixture.EligibleForPromotionReview);
        Assert.False(noMeasuredChange.EligibleForPromotionReview);
        Assert.Equal(1, noMeasuredChange.Calibration.MeasuredSamples);
        Assert.Equal(0, noMeasuredChange.Calibration.MeasuredChangedPredictions);
        Assert.True(withinBudget.EligibleForPromotionReview, string.Join(", ", withinBudget.Issues.Select(row => row.Reason)));
        Assert.False(invalidPin.EligibleForPromotionReview);
    }

    [Fact]
    public async Task The_promotion_gate_blocks_contradictions_unknowns_and_conflicting_repeat_observations()
    {
        var fixture = new Fixture();
        var confirmed = await fixture.RunAsync(fixture.Instance());
        var contradicted = await fixture.RunAsync(fixture.Instance(), review: fixture.Review with
        {
            Observations = [new(Scenario, PortfolioExposureState.Present, Hash)],
        });
        var unknown = await fixture.RunAsync(fixture.Instance(), review: fixture.Review with { Observations = [] });

        var block = Evaluate(Policy(), Benchmark(), [contradicted]);
        Assert.False(block.EligibleForPromotionReview);
        Assert.Equal(1, block.Calibration.Contradictions);
        Assert.False(Evaluate(Policy(), Benchmark(), [unknown]).EligibleForPromotionReview);
        var conflict = Evaluate(Policy(), Benchmark(), [confirmed, contradicted]);
        Assert.False(conflict.EligibleForPromotionReview);
        Assert.Equal(1, conflict.Calibration.Unknown);
        Assert.Equal(0, conflict.Calibration.MeasuredSamples);
    }

    private static void AssertUnknown(PortfolioEffectivenessResult result)
    {
        Assert.Equal(PortfolioEffectivenessStatus.Inconclusive, result.Status);
        var compared = Assert.Single(result.Scenarios);
        Assert.Equal(PortfolioObservedComparison.Unknown, compared.Comparison);
        Assert.Equal(PortfolioExposureState.Unknown, compared.Observed);
        Assert.Null(compared.ObservedEvidenceSha256);
    }

    private static PortfolioBenchmarkReport Benchmark() => new("cohort-v1", BoundedRemediationPortfolioOptimizer.Version,
        [new("small", Hash, true, 10, 8, 9, 10, 5, 4, 3, 30, 20, 100, 500, null)])
        { MeasurementEnvironment = "fixture-runner" };

    private static PortfolioPromotionPolicy Policy() => new("policy-v1", "cohort-v1", 1, 100, 100, 200, null, 1, 0, 0)
        { RequiredBenchmarkFixtureIds = ["small"] };

    private static PortfolioPromotionDecision Evaluate(PortfolioPromotionPolicy policy, PortfolioBenchmarkReport benchmark,
        IReadOnlyList<PortfolioEffectivenessResult> observations) => PortfolioPromotionAssurance.Evaluate(
            policy, benchmark, observations, PortfolioPromotionAssurance.EvidenceSha256(policy, benchmark, observations));

    private sealed class Fixture
    {
        internal Mock<IRemediationInstanceRepository> Instances { get; } = new(MockBehavior.Strict);
        internal Mock<IAzureInventorySnapshotRepository> Snapshots { get; } = new(MockBehavior.Strict);
        internal PortfolioEffectivenessReader Reader { get; }
        internal ProjectSnapshotScopeKey Scope { get; } = ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid());
        internal Guid LaterId { get; } = Guid.NewGuid();
        internal Guid InstanceId { get; } = Guid.NewGuid();
        private Guid Target { get; } = Guid.NewGuid();
        private Guid Pattern { get; } = Guid.NewGuid();
        private Guid PatternVersion { get; } = Guid.NewGuid();
        private Guid Finding { get; } = Guid.NewGuid();
        internal DateTime Before { get; } = new(2026, 11, 1, 12, 0, 0, DateTimeKind.Utc);
        internal DateTime Applied => Before.AddMinutes(5);
        internal DateTime After => Before.AddHours(1);
        internal RemediationPortfolioGraph Graph { get; }
        internal PortfolioOptimizationPin Pin { get; }
        internal PortfolioImpactPlan Plan { get; }
        internal PortfolioImpactResult Modeled { get; }
        internal PortfolioEffectivenessReview Review { get; }

        internal Fixture()
        {
            var binding = new PortfolioBinding(Scope, Hash, "policy", "engine", "risk-model");
            Graph = new(binding, Hash, true,
                [new("action", "reviewed-control", Target, Pattern, PatternVersion, [Finding], [], true)],
                [], [new(Scenario, "cause", [Finding], [], true)], [], [new(Scenario, ["action"], [])], []);
            Pin = new(binding, Graph.GraphSha256);
            PortfolioImpactCapture capture = new(Pin, "observations-v1", true, [new("control", PortfolioControlState.NotEnforced)],
                [new(Scenario, true, [new("declared", Hash, [new("control", PortfolioControlState.NotEnforced)])])]);
            Plan = new(Pin, null, ["action"], [new("action", Hash,
                [new("control", PortfolioControlState.NotEnforced, PortfolioControlState.Enforced)])]);
            string planHash = RemediationPortfolioImpactEvaluator.PlanSha256(Plan);
            var impactPin = new PortfolioImpactPin(Pin, RemediationPortfolioImpactEvaluator.CaptureSha256(capture), planHash);
            Modeled = new RemediationPortfolioImpactEvaluator(new FakeTimeProvider()).Evaluate(
                impactPin, Graph, capture, Plan, new(10_000, TimeSpan.FromSeconds(1)));
            Review = new(Pin, planHash, PortfolioEffectivenessReader.ModeledImpactSha256(Modeled),
                LaterId, Hash, [new("action", InstanceId)], [new(Scenario, PortfolioExposureState.AbsentWithinCoverage, Hash)]);
            Reader = new(Instances.Object, Snapshots.Object);
        }

        internal AzureInventorySnapshotRecord Snapshot(Guid id, DateTime at, bool complete = true, bool foreign = false) => new()
        {
            SnapshotId = id, TenantId = foreign ? Guid.NewGuid() : Scope.TenantId, WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId, CapturedUtc = at, CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            CompletenessScore = complete ? 1m : .5m, ContentHashSha256 = Convert.FromHexString(Hash),
        };

        internal RemediationInstanceRecord Instance(RemediationInstanceStatus status = RemediationInstanceStatus.Verified,
            string? receipt = null, Guid? target = null)
        {
            Guid resourceRow = Guid.NewGuid();
            var verification = RemediationInstanceVerificationEvaluator.Evaluate(
                new() { CloudResourceId = Target },
                new()
                {
                    Execution = new RemediationPatternExecutionDefinition { VerificationQueries = ["property:reviewedControl=true"] },
                },
                new AzureInventorySnapshotDetailReadModel
                {
                    Header = Snapshot(LaterId, After),
                    Resources = [new AzureInventoryResourceRecord { ResourceRowId = resourceRow, CloudResourceId = Target }],
                    Properties = [new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = resourceRow, PropertyKey = "reviewedControl", PropertyValue = "true",
                    }],
                }, Scope.SnapshotId, Before, changeImplementedUtc: Applied);
            Assert.True(verification.Passed);
            return new()
            {
                InstanceId = InstanceId, TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId, ProjectId = Scope.ProjectId,
                FindingId = Finding, PatternId = Pattern, PatternVersionId = PatternVersion, CloudResourceId = target ?? Target,
                Status = status, ApprovedUtc = Before.AddMinutes(1), ApprovedByActorKey = "approved",
                ChangeImplementedUtc = Applied, ExecutionSnapshotId = Scope.SnapshotId, VerificationSnapshotId = LaterId,
                VerifiedUtc = After.AddMinutes(1), VerificationResultJson = receipt ?? verification.ResultJson,
            };
        }

        internal Task<PortfolioEffectivenessResult> RunAsync(RemediationInstanceRecord instance,
            Func<AzureInventorySnapshotRecord?>? later = null, PortfolioEffectivenessReview? review = null)
        {
            Snapshots.Setup(repo => repo.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(scope =>
                    Scope.Project.Matches(scope.TenantId, scope.WorkspaceId, scope.ProjectId)), Scope.SnapshotId, CancellationToken.None))
                .ReturnsAsync(Snapshot(Scope.SnapshotId, Before));
            Snapshots.Setup(repo => repo.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(scope =>
                    Scope.Project.Matches(scope.TenantId, scope.WorkspaceId, scope.ProjectId)), LaterId, CancellationToken.None))
                .ReturnsAsync(later is null ? Snapshot(LaterId, After) : later());
            Instances.Setup(repo => repo.TryGetByIdInScopeAsync(Scope.Project, InstanceId, CancellationToken.None))
                .ReturnsAsync(instance);
            var approvedReview = review ?? Review;
            return Reader.ReadAsync(Pin, Graph, Plan, Modeled, approvedReview,
                PortfolioEffectivenessReader.ReviewSha256(approvedReview));
        }
    }
}
