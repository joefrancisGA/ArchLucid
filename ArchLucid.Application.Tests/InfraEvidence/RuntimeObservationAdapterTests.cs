using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RuntimeObservationAdapterTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(1);
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
    };
    private static readonly RuntimeObservationRequest Request = new(
        Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app/slots/blue",
        "deployment-2", "Java");

    private static RuntimeObservationBatch Batch() => new(
        Request, Now.AddMinutes(-5), true, ["worker-1", "worker-2"],
        [new("worker-1", "17.0.21.1", Now), new("worker-2", "17.0.21.1", Now)],
        "trusted-source:batch-1");

    [Fact]
    public async Task Complete_authorized_batch_can_establish_compliance()
    {
        FakeSource source = new(Batch());
        RuntimeObservationAssessment result = await Assess(source);
        Assert.Equal(RuntimePatchStatus.Compliant, result.Patch.Status);
        Assert.Equal("trusted-source:batch-1", result.EvidenceReference);
        Assert.Equal(1, source.Calls);
    }

    [Fact]
    public async Task Foreign_request_is_rejected_before_collection()
    {
        FakeSource source = new(Batch());
        RuntimeObservationRequest[] requests =
        [
            Request with { TenantId = Guid.NewGuid() },
            Request with { WorkspaceId = Guid.NewGuid() },
            Request with { ProjectId = Guid.NewGuid() },
        ];

        foreach (RuntimeObservationRequest request in requests)
        {
            RuntimeObservationAssessment result = await new RuntimeObservationAdapter(source)
                .AssessAsync(Scope, request, "17.0.21.1", Now, MaxAge);
            Assert.Equal(RuntimePatchStatus.Unknown, result.Patch.Status);
        }
        Assert.Equal(0, source.Calls);
    }

    [Fact]
    public async Task Foreign_or_previous_deployment_batch_is_rejected()
    {
        RuntimeObservationRequest[] foreign =
        [
            Request with { TenantId = Guid.NewGuid() },
            Request with { WorkspaceId = Guid.NewGuid() },
            Request with { ProjectId = Guid.NewGuid() },
            Request with { ResourceId = Request.ResourceId + "-other" },
            Request with { DeploymentGeneration = "deployment-1" },
            Request with { RuntimeFamily = "NGINX" },
        ];
        foreach (RuntimeObservationRequest request in foreign)
        {
            RuntimeObservationAssessment result = await Assess(new FakeSource(Batch() with { Scope = request }));
            Assert.Equal(RuntimePatchStatus.Unknown, result.Patch.Status);
            Assert.Null(result.EvidenceReference);
        }
    }

    [Fact]
    public async Task Missing_stale_or_ambiguous_source_evidence_is_unknown()
    {
        RuntimeObservationBatch?[] invalid =
        [
            null,
            Batch() with { EvidenceReference = "" },
            Batch() with { EnumeratedAt = Now.AddHours(-2) },
            Batch() with { EnumeratedAt = Now.AddMinutes(1) },
            Batch() with { InstanceIds = [] },
            Batch() with { InstanceIds = ["worker-1", "worker-1"] },
            Batch() with { Observations = [new("unlisted", "17.0.21.1", Now)] },
            Batch() with { Observations = [new("worker-1", "17.0.21.1", Now.AddMinutes(-6))] },
            Batch() with { Observations = [new("worker-1", "17.0.21.1", Now.AddMinutes(1))] },
        ];
        foreach (RuntimeObservationBatch? batch in invalid)
        {
            RuntimeObservationAssessment result = await Assess(new FakeSource(batch));
            Assert.Equal(RuntimePatchStatus.Unknown, result.Patch.Status);
            Assert.Null(result.EvidenceReference);
        }
    }

    [Fact]
    public async Task Incomplete_observations_never_establish_compliance()
    {
        Assert.Equal(RuntimePatchStatus.Unknown,
            (await Assess(new FakeSource(Batch() with { Complete = false }))).Patch.Status);
        Assert.Equal(RuntimePatchStatus.Unknown,
            (await Assess(new FakeSource(Batch() with
            {
                Observations = [new("worker-1", "17.0.21.1", Now)],
            }))).Patch.Status);
    }

    [Fact]
    public async Task Verified_vulnerable_observation_is_noncompliant()
    {
        RuntimeObservationAssessment result = await Assess(new FakeSource(Batch() with
        {
            Complete = false,
            Observations = [new("worker-1", "17.0.20", Now)],
        }));
        Assert.Equal(RuntimePatchStatus.NonCompliant, result.Patch.Status);
    }

    [Fact]
    public async Task Cancellation_prevents_collection()
    {
        FakeSource source = new(Batch());
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => new RuntimeObservationAdapter(source)
            .AssessAsync(Scope, Request, "17.0.21.1", Now, MaxAge, cancellation.Token));
        Assert.Equal(0, source.Calls);
    }

    private static Task<RuntimeObservationAssessment> Assess(FakeSource source) =>
        new RuntimeObservationAdapter(source).AssessAsync(Scope, Request, "17.0.21.1", Now, MaxAge);

    private sealed class FakeSource(RuntimeObservationBatch? batch) : IAuthorizedRuntimeObservationSource
    {
        public int Calls { get; private set; }

        public Task<RuntimeObservationBatch?> ReadAsync(
            RuntimeObservationRequest request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(batch);
        }
    }
}
