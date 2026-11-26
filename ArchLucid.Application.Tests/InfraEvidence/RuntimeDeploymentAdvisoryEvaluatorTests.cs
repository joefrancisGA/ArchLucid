using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RuntimeDeploymentAdvisoryEvaluatorTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(),
        Guid.NewGuid(), "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app", "generation-2", "php");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Request.TenantId, WorkspaceId = Request.WorkspaceId, ProjectId = Request.ProjectId
    };
    private static readonly VerifiedRuntimeAdvisory Advisory = new("test-advisory", "php", "php", "upstream",
        "8.4.0", "8.4.10", "verified-advisory", Now.AddHours(-1), Now.AddHours(1), ["feature"]);

    private static RuntimeObservedInstance Instance(string id, string version, RuntimePrerequisiteState state) =>
        new(id, version, Now.AddMinutes(-1))
        {
            Vendor = "php", Distribution = "upstream",
            Prerequisites = new Dictionary<string, RuntimePrerequisiteState> { ["feature"] = state }
        };

    private static RuntimeObservationBatch Batch(bool complete, params RuntimeObservedInstance[] instances) =>
        new(Request, Now.AddMinutes(-2), complete, ["one", "two"], instances, "verified-attestation");

    [Fact]
    public async Task Affected_instance_dominates_missing_coverage()
    {
        var result = await Assess(Batch(false, Instance("one", "8.4.2", RuntimePrerequisiteState.Present)));
        Assert.Equal(RuntimeApplicability.Affected, result.Applicability);
        Assert.False(result.Complete);
        Assert.Equal("verified-attestation", result.EvidenceReference);
    }

    [Fact]
    public async Task Patched_conclusion_requires_every_instance()
    {
        var patched = Instance("one", "8.4.10", RuntimePrerequisiteState.Unknown);
        Assert.Equal(RuntimeApplicability.Unknown, (await Assess(Batch(true, patched))).Applicability);
        var result = await Assess(Batch(true, patched, patched with { InstanceId = "two" }));
        Assert.Equal(RuntimeApplicability.OutsideAffectedRange, result.Applicability);
        Assert.True(result.Complete);
    }

    [Fact]
    public async Task Missing_vendor_and_prerequisites_do_not_establish_exclusion()
    {
        var item = Instance("one", "8.4.2", RuntimePrerequisiteState.Absent);
        var result = await Assess(Batch(true, item with { Vendor = null }, item with { InstanceId = "two" }));
        Assert.Equal(RuntimeApplicability.Unknown, result.Applicability);
        result = await Assess(Batch(true, item with { Prerequisites = null }, item with { InstanceId = "two" }));
        Assert.Equal(RuntimeApplicability.Unknown, result.Applicability);
    }

    [Fact]
    public async Task Conflicting_latest_observations_and_foreign_scope_are_rejected()
    {
        var item = Instance("one", "8.4.10", RuntimePrerequisiteState.Absent);
        Assert.Equal(RuntimeApplicability.Unknown, (await Assess(Batch(true, item,
            item with { Version = "8.4.2" }, item with { InstanceId = "two" }))).Applicability);
        var source = new Source(Batch(true, item, item with { InstanceId = "two" }));
        var result = await new RuntimeDeploymentAdvisoryEvaluator(source).AssessAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Scope.WorkspaceId, ProjectId = Scope.ProjectId },
            Request, Advisory, Now, TimeSpan.FromMinutes(5));
        Assert.Equal(RuntimeApplicability.Unknown, result.Applicability);
        Assert.Equal(0, source.Calls);
    }

    private static Task<RuntimeDeploymentAdvisoryAssessment> Assess(RuntimeObservationBatch batch) =>
        new RuntimeDeploymentAdvisoryEvaluator(new Source(batch)).AssessAsync(
            Scope, Request, Advisory, Now, TimeSpan.FromMinutes(5));

    private sealed class Source(RuntimeObservationBatch batch) : IAuthorizedRuntimeObservationSource
    {
        public int Calls { get; private set; }
        public Task<RuntimeObservationBatch?> ReadAsync(RuntimeObservationRequest request, CancellationToken ct)
        {
            Calls++;
            return Task.FromResult<RuntimeObservationBatch?>(batch);
        }
    }
}
