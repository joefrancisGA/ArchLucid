using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class CosmosGraphSnapshotOutboxAuthorizationTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("missing-tenant")]
    [InlineData("missing-workspace")]
    [InlineData("missing-project")]
    [InlineData("missing-run")]
    [InlineData("missing-graph")]
    [InlineData("foreign-drain")]
    [InlineData("purged-run")]
    [InlineData("foreign-run-scope")]
    [InlineData("different-run")]
    [InlineData("archived-run")]
    [InlineData("failed-run")]
    [InlineData("different-graph")]
    [InlineData("foreign-manifest-scope")]
    [InlineData("different-manifest-graph")]
    public async Task Rejected_job_never_loads_graph_or_writes_cosmos(string fault)
    {
        ManifestDocument manifest = NewManifest();
        RunRecord run = RetrievalIndexingBindingTestSupport.CreateCommittedRun(manifest);
        CosmosGraphSnapshotOutboxEntry job = NewJob(manifest, fault);
        switch (fault)
        {
            case "foreign-run-scope": run.ScopeProjectId = Guid.NewGuid(); break;
            case "different-run": run.RunId = Guid.NewGuid(); break;
            case "archived-run": run.ArchivedUtc = Now.UtcDateTime; break;
            case "failed-run": run.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed); break;
            case "different-graph": run.GraphSnapshotId = Guid.NewGuid(); break;
            case "foreign-manifest-scope": manifest.TenantId = Guid.NewGuid(); break;
            case "different-manifest-graph": manifest.GraphSnapshotId = Guid.NewGuid(); break;
        }

        bool readsRun = !fault.StartsWith("missing-", StringComparison.Ordinal) && fault != "foreign-drain";
        bool readsManifest = fault is "foreign-manifest-scope" or "different-manifest-graph";
        Harness h = new();
        h.Outbox.Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([job]);
        if (readsRun)
            h.Runs.Setup(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                    job.RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(fault == "purged-run" ? null : run);
        if (readsManifest)
            h.Query.Setup(q => q.GetManifestForSummaryVerificationAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                    manifest.ManifestId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(manifest);

        await using ServiceProvider services = h.BuildProvider();
        using IDisposable? drain = fault == "foreign-drain"
            ? AmbientScopeContext.Push(new ScopeContext { TenantId = Guid.NewGuid() }) : null;
        (await ProcessAsync(services)).Should().Be(1);

        h.Runs.Verify(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
            job.RunId, It.IsAny<CancellationToken>()), readsRun ? Times.Once() : Times.Never());
        h.Query.Verify(q => q.GetManifestForSummaryVerificationAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
            manifest.ManifestId, It.IsAny<CancellationToken>()), readsManifest ? Times.Once() : Times.Never());
        h.Loader.VerifyNoOtherCalls();
        h.Writer.VerifyNoOtherCalls();
        h.Outbox.Verify(o => o.MarkProcessedAsync(job.OutboxId, It.IsAny<CancellationToken>()), Times.Once);
        h.Outbox.Verify(o => o.DeferUntilAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Early_job_defers_without_failure_and_replicates_after_manifest_is_ready(bool committedManifestNotVisible)
    {
        ManifestDocument manifest = NewManifest();
        CosmosGraphSnapshotOutboxEntry job = NewJob(manifest, null);
        RunRecord committed = RetrievalIndexingBindingTestSupport.CreateCommittedRun(manifest);
        RunRecord early = RetrievalIndexingBindingTestSupport.CreateCommittedRun(manifest);
        early.LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit);
        early.GoldenManifestId = null;
        early.GraphSnapshotId = null;
        GraphSnapshot graph = new()
        {
            RunId = job.RunId, GraphSnapshotId = job.GraphSnapshotId, ContextSnapshotId = manifest.ContextSnapshotId
        };
        Harness h = new();
        h.Outbox.Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([job]);
        h.Runs.SetupSequence(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, job)),
                job.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(committedManifestNotVisible ? committed : early)
            .ReturnsAsync(committed);
        var lookups = h.Query.SetupSequence(q => q.GetManifestForSummaryVerificationAsync(
            It.Is<ScopeContext>(s => SameScope(s, job)), manifest.ManifestId, It.IsAny<CancellationToken>()));
        if (committedManifestNotVisible)
            lookups.ReturnsAsync((ManifestDocument?)null);
        lookups.ReturnsAsync(manifest);
        h.Loader.Setup(l => l.LoadAsync(It.Is<ScopeContext>(s => SameScope(s, job)), job.GraphSnapshotId,
            It.IsAny<CancellationToken>())).ReturnsAsync(graph);
        h.Writer.Setup(w => w.SaveAsync(graph, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await using ServiceProvider services = h.BuildProvider();
        (await ProcessAsync(services)).Should().Be(1);
        h.Loader.VerifyNoOtherCalls();
        h.Writer.VerifyNoOtherCalls();
        h.Outbox.Verify(o => o.MarkProcessedAsync(job.OutboxId, It.IsAny<CancellationToken>()), Times.Never);
        h.Outbox.Verify(o => o.DeferUntilAsync(job.OutboxId, job.LockedUntilUtc!.Value, Now.UtcDateTime.AddSeconds(15),
            It.IsAny<CancellationToken>()), Times.Once);

        (await ProcessAsync(services)).Should().Be(1);
        h.Loader.Verify(l => l.LoadAsync(It.Is<ScopeContext>(s => SameScope(s, job)), job.GraphSnapshotId,
            It.IsAny<CancellationToken>()), Times.Once);
        h.Writer.Verify(w => w.SaveAsync(graph, It.IsAny<CancellationToken>()), Times.Once);
        h.Outbox.Verify(o => o.MarkProcessedAsync(job.OutboxId, It.IsAny<CancellationToken>()), Times.Once);
        h.Outbox.Verify(o => o.RecordBackoffAfterProcessingFailureAsync(job.OutboxId, It.IsAny<DateTime>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        h.Outbox.Verify(o => o.RecordDeadLetterAsync(job.OutboxId, It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    private static ManifestDocument NewManifest() => new()
    {
        TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
        RunId = Guid.NewGuid(), ManifestId = Guid.NewGuid(), GraphSnapshotId = Guid.NewGuid(),
        ContextSnapshotId = Guid.NewGuid(), ManifestHash = "sealed-outbox-test-hash"
    };

    private static CosmosGraphSnapshotOutboxEntry NewJob(ManifestDocument manifest, string? fault) => new()
    {
        OutboxId = Guid.NewGuid(), LockedUntilUtc = Now.UtcDateTime.AddMinutes(5),
        TenantId = fault == "missing-tenant" ? Guid.Empty : manifest.TenantId,
        WorkspaceId = fault == "missing-workspace" ? Guid.Empty : manifest.WorkspaceId,
        ProjectId = fault == "missing-project" ? Guid.Empty : manifest.ProjectId,
        RunId = fault == "missing-run" ? Guid.Empty : manifest.RunId,
        GraphSnapshotId = fault == "missing-graph" ? Guid.Empty : manifest.GraphSnapshotId,
    };

    private static bool SameScope(ScopeContext scope, CosmosGraphSnapshotOutboxEntry job) =>
        scope.TenantId == job.TenantId && scope.WorkspaceId == job.WorkspaceId && scope.ProjectId == job.ProjectId;

    private static Task<int> ProcessAsync(ServiceProvider services) =>
        new CosmosGraphSnapshotOutboxProcessor(services.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new CosmosGraphSnapshotOutboxProcessorOptions()), new FixedTimeProvider(),
            NullLogger<CosmosGraphSnapshotOutboxProcessor>.Instance).ProcessPendingBatchAsync(CancellationToken.None);

    private sealed class FixedTimeProvider : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class Harness
    {
        public Mock<IRunRepository> Runs { get; } = new(MockBehavior.Strict);
        public Mock<IAuthorityQueryService> Query { get; } = new(MockBehavior.Strict);
        public Mock<ICosmosGraphSnapshotOutboxSqlLoader> Loader { get; } = new(MockBehavior.Strict);
        public Mock<ICosmosGraphSnapshotOutboxCosmosWriter> Writer { get; } = new(MockBehavior.Strict);
        public Mock<ICosmosGraphSnapshotOutboxRepository> Outbox { get; } = new();

        public ServiceProvider BuildProvider()
        {
            ServiceCollection services = [];
            services.AddScoped(_ => Runs.Object);
            services.AddScoped(_ => Query.Object);
            services.AddScoped(_ => Loader.Object);
            services.AddScoped(_ => Writer.Object);
            services.AddScoped(_ => Outbox.Object);
            CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterManifestHashService(services);
            return services.BuildServiceProvider();
        }
    }
}
