using ArchLucid.Application.Runs.Sample;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Sample;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SampleRunPurgeServiceTests
{
    [Fact]
    public async Task PurgeForTenantAsync_deletes_sample_runs_and_emits_platform_audit()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = tenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = Guid.NewGuid(),
                ProjectId = "sample-a",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsSample = true
            },
            CancellationToken.None);

        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = tenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = Guid.NewGuid(),
                ProjectId = "real-run",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsSample = false
            },
            CancellationToken.None);

        Mock<IPlatformAuditRepository> platformAudit = new();
        PlatformAuditEvent? captured = null;
        platformAudit
            .Setup(p => p.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        SampleRunPurgeService service = CreateService(runs, platformAudit.Object);

        SampleRunPurgeResult result = await service.PurgeForTenantAsync(tenantId, CancellationToken.None);

        result.RunsDeleted.Should().Be(1);
        (await runs.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Should().ContainSingle(r => !r.IsSample);
        captured.Should().NotBeNull();
        captured!.EventType.Should().Be(AuditEventTypes.SampleRunsPurged);
        captured.SubjectTenantId.Should().Be(Guid.Empty);
        captured.DataJson.Should().Contain("runsDeleted");
    }

    [Fact]
    public async Task PurgeExpiredAsync_respects_created_cutoff()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        DateTime oldUtc = TimeProvider.System.UtcNowDateTime().AddDays(-10);

        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = tenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = Guid.NewGuid(),
                ProjectId = "old-sample",
                CreatedUtc = oldUtc,
                IsSample = true
            },
            CancellationToken.None);

        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = tenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = Guid.NewGuid(),
                ProjectId = "fresh-sample",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsSample = true
            },
            CancellationToken.None);

        Mock<IPlatformAuditRepository> platformAudit = new();
        platformAudit
            .Setup(p => p.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        SampleRunPurgeService service = CreateService(runs, platformAudit.Object);
        DateTimeOffset cutoff = TimeProvider.System.GetUtcNow().AddDays(-7);

        SampleRunPurgeResult result = await service.PurgeExpiredAsync(cutoff, CancellationToken.None);

        result.RunsDeleted.Should().Be(1);
        IReadOnlyList<RunRecord> remaining = await runs.ListRecentInScopeAsync(scope, 10, CancellationToken.None);
        remaining.Should().ContainSingle(r => r.ProjectId == "fresh-sample");
    }

    private static SampleRunPurgeService CreateService(IRunRepository runs, IPlatformAuditRepository platformAudit)
    {
        IOptionsMonitor<SampleRunPurgeOptions> options = new FixedSampleRunPurgeOptionsMonitor(new SampleRunPurgeOptions { BatchSize = 500 });

        return new SampleRunPurgeService(
            runs,
            platformAudit,
            options,
            Mock.Of<ILogger<SampleRunPurgeService>>());
    }

    private sealed class FixedSampleRunPurgeOptionsMonitor(SampleRunPurgeOptions value) : IOptionsMonitor<SampleRunPurgeOptions>
    {
        public SampleRunPurgeOptions CurrentValue { get; } = value;

        public SampleRunPurgeOptions Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<SampleRunPurgeOptions, string?> listener) => new EmptyDisposable();

        private sealed class EmptyDisposable : IDisposable
        {
            public void Dispose()
            {
            }
        }
    }
}
