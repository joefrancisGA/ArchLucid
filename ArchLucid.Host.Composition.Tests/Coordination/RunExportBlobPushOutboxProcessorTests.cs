using System.Diagnostics;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Export;
using ArchLucid.Persistence.Coordination.Export;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class RunExportBlobPushOutboxProcessorTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_dead_letters_when_destination_rejected_at_processing_time()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Mock<IRunExportBlobPushOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunExportBlobPushOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    DestinationSasUrl = "https://127.0.0.1/evil?sas=token",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox
            .Setup(o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => audit.Object);
        services.AddScoped(_ => Mock.Of<IRunExportPackageBuilder>());
        services.AddScoped(_ => Mock.Of<IRunExportBlobPushService>());
        ServiceProvider provider = services.BuildServiceProvider();

        RunExportBlobPushOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new RunExportBlobPushOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<RunExportBlobPushOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(
            o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.RunExportBlobPushDeadLettered && e.RunId == runId),
                It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_marks_processed_when_run_export_no_longer_found()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Mock<IRunExportBlobPushOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunExportBlobPushOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    DestinationSasUrl = "https://acct.blob.core.windows.net/c/b?sas=token",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IRunExportPackageBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(It.IsAny<ScopeContext>(), runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.NotFound("missing", "https://archlucid.example.org/errors#run-not-found"));

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => builder.Object);
        services.AddScoped(_ => Mock.Of<IRunExportBlobPushService>());
        services.AddScoped(_ => Mock.Of<IAuditService>());
        ServiceProvider provider = services.BuildServiceProvider();

        RunExportBlobPushOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new RunExportBlobPushOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<RunExportBlobPushOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_sets_tenant_and_workspace_activity_tags()
    {
        List<Activity> stopped = [];
        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == ArchLucidMeterNames.AuthorityRunActivitySource;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        listener.ActivityStopped = stopped.Add;
        ActivitySource.AddActivityListener(listener);

        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Mock<IRunExportBlobPushOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunExportBlobPushOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = Guid.NewGuid(),
                    DestinationSasUrl = "https://acct.blob.core.windows.net/c/b?sas=token",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IRunExportPackageBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(It.IsAny<ScopeContext>(), runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.NotFound("missing", "https://archlucid.example.org/errors#run-not-found"));

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => builder.Object);
        services.AddScoped(_ => Mock.Of<IRunExportBlobPushService>());
        services.AddScoped(_ => Mock.Of<IAuditService>());
        ServiceProvider provider = services.BuildServiceProvider();

        RunExportBlobPushOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new RunExportBlobPushOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<RunExportBlobPushOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        stopped.Should().ContainSingle();
        stopped[0].GetTagItem(ActivityScopeTags.TenantIdTag).Should().Be(tenantId.ToString("D"));
        stopped[0].GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().Be(workspaceId.ToString("D"));
    }
}
