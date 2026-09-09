using System.Diagnostics;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Export;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class RunExportBlobPushOutboxProcessorTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_pushes_ambient_scope_before_dead_letter_audit()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid entryTenantId = Guid.NewGuid();
        Guid entryWorkspaceId = Guid.NewGuid();
        Guid entryProjectId = Guid.NewGuid();
        AuditEvent? capturedAudit = null;

        Mock<IRunExportBlobPushOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunExportBlobPushOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = entryTenantId,
                    WorkspaceId = entryWorkspaceId,
                    ProjectId = entryProjectId,
                    DestinationSasUrl = "https://127.0.0.1/evil?sas=token",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox
            .Setup(o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditRepository> auditRepository = new();
        auditRepository
            .Setup(r => r.AppendAsync(
                It.IsAny<AuditEvent>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection>(),
                It.IsAny<System.Data.IDbTransaction>()))
            .Callback<AuditEvent, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (auditEvent, _, _, _) => capturedAudit = auditEvent)
            .Returns(Task.CompletedTask);

        HttpContextAccessor httpContextAccessor = new();
        HttpScopeContextProvider scopeProvider = new(httpContextAccessor);
        AuditService auditService = new(auditRepository.Object, httpContextAccessor, scopeProvider);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped<IAuditService>(_ => auditService);
        services.AddScoped(_ => Mock.Of<IRunExportPackageBuilder>());
        services.AddScoped(_ => Mock.Of<IRunExportBlobPushService>());
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
        ServiceProvider provider = services.BuildServiceProvider();

        RunExportBlobPushOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new RunExportBlobPushOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<RunExportBlobPushOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        capturedAudit.Should().NotBeNull();
        capturedAudit!.TenantId.Should().Be(entryTenantId, "audit enrichment must follow outbox entry ambient scope, not dev-default {0}", ScopeIds.DefaultTenant);
        capturedAudit.WorkspaceId.Should().Be(entryWorkspaceId);
        capturedAudit.ProjectId.Should().Be(entryProjectId);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_pushes_ambient_scope_before_exhaustion_dead_letter_audit()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid entryTenantId = Guid.NewGuid();
        Guid entryWorkspaceId = Guid.NewGuid();
        Guid entryProjectId = Guid.NewGuid();
        AuditEvent? capturedAudit = null;

        Mock<IRunExportBlobPushOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunExportBlobPushOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = entryTenantId,
                    WorkspaceId = entryWorkspaceId,
                    ProjectId = entryProjectId,
                    DestinationSasUrl = "https://acct.blob.core.windows.net/c/b?sas=token",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    AttemptCount = 47
                }
            ]);
        outbox
            .Setup(o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditRepository> auditRepository = new();
        auditRepository
            .Setup(r => r.AppendAsync(
                It.IsAny<AuditEvent>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection>(),
                It.IsAny<System.Data.IDbTransaction>()))
            .Callback<AuditEvent, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (auditEvent, _, _, _) => capturedAudit = auditEvent)
            .Returns(Task.CompletedTask);

        Mock<IRunExportPackageBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(It.IsAny<ScopeContext>(), runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.Success(
                [0x50, 0x4B, 0x03, 0x04],
                "application/zip",
                "export.zip",
                Guid.NewGuid()));

        Mock<IRunExportBlobPushService> pushService = new();
        pushService
            .Setup(p => p.PushAsync(runId, It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("transient blob upload failure"));

        HttpContextAccessor httpContextAccessor = new();
        HttpScopeContextProvider scopeProvider = new(httpContextAccessor);
        AuditService auditService = new(auditRepository.Object, httpContextAccessor, scopeProvider);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped<IAuditService>(_ => auditService);
        services.AddScoped(_ => builder.Object);
        services.AddScoped(_ => pushService.Object);
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
        ServiceProvider provider = services.BuildServiceProvider();

        RunExportBlobPushOutboxProcessorOptions options = new() { MaxAttemptsBeforeDeadLetter = 48 };
        RunExportBlobPushOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options),
            TimeProvider.System,
            NullLogger<RunExportBlobPushOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        capturedAudit.Should().NotBeNull();
        capturedAudit!.TenantId.Should().Be(entryTenantId, "retry-exhaustion dead-letter audit must follow outbox entry ambient scope, not dev-default {0}", ScopeIds.DefaultTenant);
        capturedAudit.WorkspaceId.Should().Be(entryWorkspaceId);
        capturedAudit.ProjectId.Should().Be(entryProjectId);
    }

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
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
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
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
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
    public async Task ProcessPendingBatchAsync_dead_letters_when_export_blocked_by_sealed_receipt_conflict()
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
        outbox
            .Setup(o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunExportPackageBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(It.IsAny<ScopeContext>(), runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.Conflict(
                "blocked",
                "https://archlucid.example.org/errors#decision-receipt-sealed-hash-mismatch"));

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => builder.Object);
        services.AddScoped(_ => Mock.Of<IRunExportBlobPushService>());
        services.AddScoped(_ => Mock.Of<IAuditService>());
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
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
        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_dead_letters_immediately_when_export_zip_is_empty()
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
        outbox
            .Setup(o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunExportPackageBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(It.IsAny<ScopeContext>(), runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.Success(
                [],
                "application/zip",
                "export.zip",
                Guid.NewGuid()));

        Mock<IRunExportBlobPushService> pushService = new();
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => builder.Object);
        services.AddScoped(_ => pushService.Object);
        services.AddScoped(_ => audit.Object);
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
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
        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        pushService.Verify(
            p => p.PushAsync(It.IsAny<Guid>(), It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.RunExportBlobPushDeadLettered && e.RunId == runId),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
        CoordinationOutboxSealedManifestHashGuardTestSupport.RegisterSealedManifestGuardServices(services, runId);
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
