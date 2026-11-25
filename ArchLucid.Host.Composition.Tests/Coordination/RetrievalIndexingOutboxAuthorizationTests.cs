using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Retrieval;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class RetrievalIndexingOutboxAuthorizationTests
{
    [Theory]
    [InlineData("missing-tenant")]
    [InlineData("missing-workspace")]
    [InlineData("missing-project")]
    [InlineData("missing-run-id")]
    [InlineData("foreign-drain-tenant")]
    [InlineData("foreign-drain-workspace")]
    [InlineData("foreign-drain-project")]
    [InlineData("no-run")]
    [InlineData("foreign-tenant")]
    [InlineData("foreign-workspace")]
    [InlineData("foreign-project")]
    [InlineData("different-run")]
    [InlineData("uncommitted")]
    [InlineData("archived")]
    [InlineData("missing-manifest")]
    [InlineData("different-manifest")]
    [InlineData("foreign-manifest-project")]
    [InlineData("foreign-manifest-run")]
    [InlineData("changed-graph-anchor")]
    [InlineData("changed-findings-anchor")]
    [InlineData("changed-trace-anchor")]
    [InlineData("unsealed")]
    [InlineData("invalid-seal")]
    public async Task Claimed_job_stops_before_cache_backed_read_when_binding_is_not_verified(string fault)
    {
        ManifestDocument manifest = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(), ManifestId = Guid.NewGuid(), GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(), DecisionTraceId = Guid.NewGuid(),
            ManifestHash = "verified-manifest-hash"
        };
        RunRecord run = RetrievalIndexingBindingTestSupport.CreateCommittedRun(manifest);
        RetrievalIndexingOutboxEntry entry = new()
        {
            TenantId = fault == "missing-tenant" ? Guid.Empty : run.TenantId,
            WorkspaceId = fault == "missing-workspace" ? Guid.Empty : run.WorkspaceId,
            ProjectId = fault == "missing-project" ? Guid.Empty : run.ScopeProjectId,
            RunId = fault == "missing-run-id" ? Guid.Empty : run.RunId,
            OutboxId = Guid.NewGuid()
        };
        Guid manifestId = manifest.ManifestId;
        switch (fault)
        {
            case "foreign-tenant": run.TenantId = Guid.NewGuid(); break;
            case "foreign-workspace": run.WorkspaceId = Guid.NewGuid(); break;
            case "foreign-project": run.ScopeProjectId = Guid.NewGuid(); break;
            case "different-run": run.RunId = Guid.NewGuid(); break;
            case "archived": run.ArchivedUtc = TimeProvider.System.UtcNowDateTime(); break;
            case "uncommitted": run.LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit); break;
            case "different-manifest": manifest.ManifestId = Guid.NewGuid(); break;
            case "foreign-manifest-project": manifest.ProjectId = Guid.NewGuid(); break;
            case "foreign-manifest-run": manifest.RunId = Guid.NewGuid(); break;
            case "changed-graph-anchor": run.GraphSnapshotId = Guid.NewGuid(); break;
            case "changed-findings-anchor": run.FindingsSnapshotId = Guid.NewGuid(); break;
            case "changed-trace-anchor": run.DecisionTraceId = Guid.NewGuid(); break;
            case "unsealed": manifest.ManifestHash = ""; break;
        }

        bool foreignDrain = fault.StartsWith("foreign-drain-", StringComparison.Ordinal);
        bool reachesRun = !foreignDrain &&
            fault is not ("missing-tenant" or "missing-workspace" or "missing-project" or "missing-run-id");
        bool reachesManifest = fault is "missing-manifest" or "different-manifest" or "foreign-manifest-project" or
            "foreign-manifest-run" or "changed-graph-anchor" or "changed-findings-anchor" or "changed-trace-anchor" or
            "unsealed" or "invalid-seal";
        bool sealFailure = fault is "unsealed" or "invalid-seal";
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        if (reachesRun)
        {
            runs.Setup(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, entry)),
                    entry.RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(fault == "no-run" ? null : run);
        }
        Mock<IAuthorityQueryService> evidence = new(MockBehavior.Strict);
        if (reachesManifest)
        {
            evidence.Setup(q => q.GetManifestForSummaryVerificationAsync(
                    It.Is<ScopeContext>(s => SameScope(s, entry)), manifestId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(fault == "missing-manifest" ? null : manifest);
        }
        Mock<IArtifactQueryService> artifacts = new(MockBehavior.Strict);
        Mock<IRetrievalRunCompletionIndexer> indexer = new(MockBehavior.Strict);
        Mock<IRetrievalIndexingOutboxRepository> outbox = new();
        outbox.Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);
        ServiceCollection services = [];
        services.AddScoped(_ => runs.Object);
        services.AddScoped(_ => evidence.Object);
        services.AddScoped(_ => artifacts.Object);
        services.AddScoped(_ => indexer.Object);
        services.AddScoped(_ => outbox.Object);
        Mock<IManifestHashService> hash = new(MockBehavior.Strict);
        hash.Setup(h => h.ComputeHash(manifest)).Returns("different-computed-hash");
        services.AddScoped(_ => hash.Object);
        await using ServiceProvider provider = services.BuildServiceProvider();

        RetrievalIndexingOutboxProcessor processor = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new RetrievalIndexingOutboxProcessorOptions()), TimeProvider.System,
            NullLogger<RetrievalIndexingOutboxProcessor>.Instance);
        using IDisposable? ambientDrain = foreignDrain ? AmbientScopeContext.Push(new ScopeContext
        {
            TenantId = fault == "foreign-drain-tenant" ? Guid.NewGuid() : entry.TenantId,
            WorkspaceId = fault == "foreign-drain-workspace" ? Guid.NewGuid() : entry.WorkspaceId,
            ProjectId = fault == "foreign-drain-project" ? Guid.NewGuid() : entry.ProjectId,
        }) : null;
        (await processor.ProcessPendingBatchAsync(CancellationToken.None)).Should().Be(1);

        runs.Verify(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, entry)),
                entry.RunId, It.IsAny<CancellationToken>()), reachesRun ? Times.Once() : Times.Never());
        evidence.Verify(q => q.GetManifestForSummaryVerificationAsync(It.Is<ScopeContext>(s => SameScope(s, entry)),
                manifestId, It.IsAny<CancellationToken>()), reachesManifest ? Times.Once() : Times.Never());
        evidence.VerifyNoOtherCalls(); // Includes the graph/cache-backed detail loader.
        runs.VerifyNoOtherCalls();
        artifacts.VerifyNoOtherCalls();
        indexer.VerifyNoOtherCalls();
        hash.Verify(h => h.ComputeHash(manifest), fault == "invalid-seal" ? Times.Once() : Times.Never());
        outbox.Verify(o => o.MarkProcessedAsync(entry.OutboxId, It.IsAny<CancellationToken>()),
            sealFailure ? Times.Never() : Times.Once());
        outbox.Verify(o => o.RecordDeadLetterAsync(entry.OutboxId,
            It.Is<string>(reason => reason.Contains("sealed manifest hash", StringComparison.Ordinal)),
            It.IsAny<CancellationToken>()), sealFailure ? Times.Once() : Times.Never());
        outbox.Verify(o => o.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, It.IsAny<DateTime>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never());
    }

    private static bool SameScope(ScopeContext scope, RetrievalIndexingOutboxEntry job) =>
        scope.TenantId == job.TenantId && scope.WorkspaceId == job.WorkspaceId && scope.ProjectId == job.ProjectId;
}
