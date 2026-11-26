using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration.Events;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Projection;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class PostCommitProjectionOutboxAuthorizationTests
{
    [Theory]
    [InlineData("missing-tenant")]
    [InlineData("missing-project")]
    [InlineData("foreign-drain")]
    [InlineData("no-run")]
    [InlineData("different-run")]
    [InlineData("foreign-run-workspace")]
    [InlineData("archived")]
    [InlineData("uncommitted")]
    [InlineData("missing-manifest")]
    [InlineData("foreign-manifest-project")]
    [InlineData("different-anchor")]
    [InlineData("bad-seal")]
    [InlineData("legacy-purge")]
    [InlineData("project-drain-purge")]
    [InlineData("sample-trigger-purge")]
    public async Task Invalid_binding_stops_before_evidence_or_side_effects(string fault)
    {
        bool purge = fault.EndsWith("-purge", StringComparison.Ordinal);
        ManifestDocument manifest = NewManifest();
        RunRecord run = RetrievalIndexingBindingTestSupport.CreateCommittedRun(manifest);
        PostCommitProjectionOutboxEntry job = new()
        {
            WorkType = purge ? PostCommitProjectionWorkTypes.SampleRunPurgeForTenant :
                PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
            TenantId = fault == "missing-tenant" ? Guid.Empty : run.TenantId,
            WorkspaceId = run.WorkspaceId,
            ProjectId = fault == "missing-project" ? Guid.Empty : run.ScopeProjectId,
            OutboxId = Guid.NewGuid(),
            RunId = fault == "legacy-purge" ? null : run.RunId,
        };
        switch (fault)
        {
            case "different-run": run.RunId = Guid.NewGuid(); break;
            case "foreign-run-workspace": run.WorkspaceId = Guid.NewGuid(); break;
            case "archived": run.ArchivedUtc = TimeProvider.System.UtcNowDateTime(); break;
            case "uncommitted": run.LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit); break;
            case "foreign-manifest-project": manifest.ProjectId = Guid.NewGuid(); break;
            case "different-anchor": manifest.FindingsSnapshotId = Guid.NewGuid(); break;
            case "sample-trigger-purge": run.IsSample = true; break;
        }

        bool checksRun = fault is not ("missing-tenant" or "missing-project" or "foreign-drain" or "legacy-purge" or "project-drain-purge");
        bool checksManifest = fault is "missing-manifest" or "foreign-manifest-project" or "different-anchor" or "bad-seal";
        Harness h = new(job);
        if (checksRun)
            h.SetupRun(fault == "no-run" ? null : run);
        if (checksManifest)
            h.SetupManifest(manifest.ManifestId, fault == "missing-manifest" ? null : manifest);
        if (fault == "bad-seal")
            h.Hash.Setup(m => m.ComputeHash(manifest)).Returns("mismatched-hash");

        ScopeContext? drain = fault switch
        {
            "foreign-drain" => new ScopeContext { TenantId = Guid.NewGuid() },
            "project-drain-purge" => new ScopeContext
            {
                TenantId = job.TenantId, WorkspaceId = job.WorkspaceId, ProjectId = job.ProjectId
            },
            _ => null,
        };
        using IDisposable? ambient = drain is null ? null : AmbientScopeContext.Push(drain);
        await h.DrainAsync();

        h.Runs.Verify(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, job)), job.RunId.GetValueOrDefault(),
            It.IsAny<CancellationToken>()), checksRun ? Times.Once() : Times.Never());
        h.Evidence.Verify(q => q.GetManifestForSummaryVerificationAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
            manifest.ManifestId, It.IsAny<CancellationToken>()), checksManifest ? Times.Once() : Times.Never());
        h.Runs.VerifyNoOtherCalls();
        h.Evidence.VerifyNoOtherCalls();
        h.Provenance.VerifyNoOtherCalls();
        h.Purge.VerifyNoOtherCalls();
        h.Review.VerifyNoOtherCalls();
        h.Rerank.VerifyNoOtherCalls();
        h.Stubs.VerifyNoOtherCalls();
        h.Outbox.Verify(o => o.MarkProcessedAsync(job.OutboxId, It.IsAny<CancellationToken>()),
            fault == "bad-seal" ? Times.Never() : Times.Once());
        h.Outbox.Verify(o => o.RecordDeadLetterAsync(job.OutboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            fault == "bad-seal" ? Times.Once() : Times.Never());
    }

    [Theory]
    [InlineData(PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization)]
    [InlineData(PostCommitProjectionWorkTypes.SampleRunPurgeForTenant)]
    [InlineData(PostCommitProjectionWorkTypes.ReviewCompletedEvent)]
    [InlineData(PostCommitProjectionWorkTypes.FindingPriorityRerank)]
    [InlineData(PostCommitProjectionWorkTypes.IacStubGeneration)]
    public async Task Valid_work_consumes_only_the_verified_binding(string workType)
    {
        ManifestDocument manifest = NewManifest();
        RunRecord run = RetrievalIndexingBindingTestSupport.CreateCommittedRun(manifest);
        PostCommitProjectionOutboxEntry job = new()
        {
            OutboxId = Guid.NewGuid(), WorkType = workType, RunId = run.RunId,
            TenantId = run.TenantId, WorkspaceId = run.WorkspaceId, ProjectId = run.ScopeProjectId,
            PayloadJson = $$"""{"projectId":"{{Guid.NewGuid():N}}"}"""
        };
        Harness h = new(job);
        h.SetupRun(run);
        h.SetupManifest(manifest.ManifestId, manifest);
        List<string> order = [];
        h.Hash.Setup(m => m.ComputeHash(manifest)).Callback(() => order.Add("seal")).Returns(manifest.ManifestHash);
        RunDetailDto detail = new()
        {
            Run = run, GoldenManifest = manifest,
            GraphSnapshot = new GraphSnapshot { RunId = run.RunId, GraphSnapshotId = manifest.GraphSnapshotId },
            FindingsSnapshot = new FindingsSnapshot { RunId = run.RunId, FindingsSnapshotId = manifest.FindingsSnapshotId },
            AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload())
        };
        switch (workType)
        {
            case PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization:
                h.Evidence.Setup(q => q.GetRunDetailForCommittedProjectionAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                    run, manifest, It.IsAny<CancellationToken>())).Callback(() => order.Add("evidence")).ReturnsAsync(detail);
                h.Provenance.Setup(p => p.TryMaterializeSnapshotAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                    detail, It.IsAny<CancellationToken>())).Callback(() => order.Add("dispatch")).Returns(Task.CompletedTask);
                break;
            case PostCommitProjectionWorkTypes.SampleRunPurgeForTenant:
                h.Purge.Setup(p => p.PurgeForTenantAsync(job.TenantId, It.IsAny<CancellationToken>()))
                    .Callback(() => order.Add("dispatch")).ReturnsAsync(new SampleRunPurgeResult());
                break;
            case PostCommitProjectionWorkTypes.ReviewCompletedEvent:
                h.Review.Setup(p => p.HandleAsync(It.Is<ReviewCompletedEvent>(e => e.ProjectId == job.ProjectId.ToString("N")
                    && e.RunId == run.RunId.ToString("N")), It.IsAny<CancellationToken>()))
                    .Callback(() => order.Add("dispatch")).Returns(Task.CompletedTask);
                break;
            case PostCommitProjectionWorkTypes.FindingPriorityRerank:
                h.Rerank.Setup(p => p.RerankForCommittedRunAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                    run, It.IsAny<CancellationToken>())).Callback(() => order.Add("dispatch")).Returns(Task.CompletedTask);
                break;
            case PostCommitProjectionWorkTypes.IacStubGeneration:
                h.Stubs.Setup(p => p.GenerateAndPersistStubsForCommittedRunAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                    run, It.IsAny<CancellationToken>())).Callback(() => order.Add("dispatch")).Returns(Task.CompletedTask);
                break;
        }

        using IDisposable? tenantDrain = workType == PostCommitProjectionWorkTypes.SampleRunPurgeForTenant
            ? AmbientScopeContext.Push(new ScopeContext { TenantId = job.TenantId }) : null;
        await h.DrainAsync();

        string[] expected = workType == PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization
            ? ["seal", "evidence", "dispatch"] : ["seal", "dispatch"];
        order.Should().Equal(expected);
        h.Outbox.Verify(o => o.MarkProcessedAsync(job.OutboxId, It.IsAny<CancellationToken>()), Times.Once());
    }

    private static ManifestDocument NewManifest() => new()
    {
        TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
        RunId = Guid.NewGuid(), ManifestId = Guid.NewGuid(), GraphSnapshotId = Guid.NewGuid(),
        FindingsSnapshotId = Guid.NewGuid(), DecisionTraceId = Guid.NewGuid(), ManifestHash = "sealed-projection"
    };

    private static bool SameScope(ScopeContext scope, PostCommitProjectionOutboxEntry job) =>
        scope.TenantId == job.TenantId && scope.WorkspaceId == job.WorkspaceId && scope.ProjectId == job.ProjectId;

    private sealed class Harness(PostCommitProjectionOutboxEntry job)
    {
        public Mock<IRunRepository> Runs { get; } = new(MockBehavior.Strict);
        public Mock<IAuthorityQueryService> Evidence { get; } = new(MockBehavior.Strict);
        public Mock<IManifestHashService> Hash { get; } = new(MockBehavior.Strict);
        public Mock<IProvenanceGraphAccessService> Provenance { get; } = new(MockBehavior.Strict);
        public Mock<ISampleRunPurgeService> Purge { get; } = new(MockBehavior.Strict);
        public Mock<IReviewCompletedEventHandler> Review { get; } = new(MockBehavior.Strict);
        public Mock<IFindingPriorityReranker> Rerank { get; } = new(MockBehavior.Strict);
        public Mock<IFindingIacStubGenerator> Stubs { get; } = new(MockBehavior.Strict);
        public Mock<IPostCommitProjectionOutboxRepository> Outbox { get; } = new();

        public void SetupRun(RunRecord? run) =>
            Runs.Setup(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                job.RunId!.Value, It.IsAny<CancellationToken>())).ReturnsAsync(run);

        public void SetupManifest(Guid manifestId, ManifestDocument? manifest) =>
            Evidence.Setup(q => q.GetManifestForSummaryVerificationAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                manifestId, It.IsAny<CancellationToken>())).ReturnsAsync(manifest);

        public async Task DrainAsync()
        {
            Outbox.Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync([job]);
            ServiceCollection services = [];
            services.AddScoped(_ => Runs.Object);
            services.AddScoped(_ => Evidence.Object);
            services.AddScoped(_ => Hash.Object);
            services.AddScoped(_ => Provenance.Object);
            services.AddScoped(_ => Purge.Object);
            services.AddScoped(_ => Review.Object);
            services.AddScoped(_ => Rerank.Object);
            services.AddScoped(_ => Stubs.Object);
            services.AddScoped(_ => Outbox.Object);
            services.AddScoped(_ => Mock.Of<IAuditService>());
            await using ServiceProvider provider = services.BuildServiceProvider();

            PostCommitProjectionOutboxProcessor processor = new(provider.GetRequiredService<IServiceScopeFactory>(),
                Options.Create(new PostCommitProjectionOutboxProcessorOptions()), TimeProvider.System,
                NullLogger<PostCommitProjectionOutboxProcessor>.Instance);
            (await processor.ProcessPendingBatchAsync(CancellationToken.None)).Should().Be(1);
        }
    }
}
