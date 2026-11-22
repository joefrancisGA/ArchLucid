using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Traceability;

[Trait("Suite", "Core")]
public sealed class TraceabilityBundleBuilderTests
{
    [SkippableFact]
    public async Task BuildAsync_WhenRunMissing_ReturnsNullAndDoesNotQueryAudit()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(s => s.GetRunDetailAsync("missing-run", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Mock<IAuditRepository> audit = new();
        TraceabilityBundleBuilder sut = new(
            runDetail.Object,
            audit.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>());
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(), };

        byte[]? zip = await sut.BuildAsync("missing-run", scope, 10_000_000, CancellationToken.None);

        zip.Should().BeNull();
        audit.Verify(
            a => a.GetFilteredAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task BuildAsync_WhenRunPresent_ReturnsZipWithExpectedEntries()
    {
        Guid runGuid = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = runGuid.ToString("N"), RequestId = "req-1", Status = ArchitectureRunStatus.Committed, },
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(s => s.GetRunDetailAsync(runGuid.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetFilteredAsync(
                tenantId,
                workspaceId,
                projectId,
                It.Is<AuditEventFilter>(f => f.RunId == runGuid && f.Take == 500),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        TraceabilityBundleBuilder sut = new(
            runDetail.Object,
            audit.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>());
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, };

        byte[]? zipBytes = await sut.BuildAsync(runGuid.ToString("N"), scope, 10_000_000, CancellationToken.None);

        zipBytes.Should().NotBeNull();
        ReadOnlySpan<byte> head = zipBytes.AsSpan(0, Math.Min(4, zipBytes.Length));
        head[0].Should().Be(0x50);
        head[1].Should().Be(0x4B);

        using MemoryStream ms = new(zipBytes);
        await using ZipArchive zip = new(ms, ZipArchiveMode.Read, leaveOpen: false);
        zip.GetEntry("run-summary.json").Should().NotBeNull();
        zip.GetEntry("audit-events.json").Should().NotBeNull();
        zip.GetEntry("audit-evidence-summary.json").Should().NotBeNull();
        zip.GetEntry("audit-evidence-summary.md").Should().NotBeNull();
        zip.GetEntry("decision-traces.json").Should().NotBeNull();
        zip.GetEntry("README.txt").Should().NotBeNull();
    }

    [Theory]
    [InlineData(1000, false)]
    [InlineData(1001, true)]
    public async Task BuildAsync_UsesBoundedAuditPagesAndReportsOnlyActualOverflow(
        int eventCount,
        bool expectedTruncation)
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(service => service.GetRunDetailAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = runId.ToString("N"), RequestId = "req" },
            });
        InMemoryAuditRepository audit = new();
        DateTime occurredUtc = new(2026, 11, 20, 0, 0, 0, DateTimeKind.Utc);
        for (int index = 0; index < eventCount; index++)
        {
            await audit.AppendAsync(new AuditEvent
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                OccurredUtc = occurredUtc,
                EventType = "RunCreated",
            }, CancellationToken.None);
        }

        TraceabilityBundleBuilder sut = new(
            runDetail.Object, audit, Mock.Of<IAuthorityQueryService>(), Mock.Of<IManifestHashService>());

        byte[]? bytes = await sut.BuildAsync(runId.ToString("N"), scope, 10_000_000, CancellationToken.None);

        bytes.Should().NotBeNull();
        using MemoryStream input = new(bytes!);
        await using ZipArchive zip = new(input, ZipArchiveMode.Read);
        using JsonDocument events = await JsonDocument.ParseAsync(zip.GetEntry("audit-events.json")!.Open());
        events.RootElement.GetArrayLength().Should().Be(1000);
        events.RootElement.EnumerateArray().Select(row => row.GetProperty("eventId").GetGuid())
            .Should().OnlyHaveUniqueItems();

        using StreamReader readme = new(zip.GetEntry("README.txt")!.Open());
        (await readme.ReadToEndAsync()).Contains("Audit events capped", StringComparison.Ordinal)
            .Should().Be(expectedTruncation);
    }

    [SkippableFact]
    public async Task BuildAsync_WhenZipExceedsMax_ThrowsTraceabilityBundleTooLargeException()
    {
        Guid runGuid = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = runGuid.ToString("N"), RequestId = "req-2", Status = ArchitectureRunStatus.Committed, },
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(s => s.GetRunDetailAsync(runGuid.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetFilteredAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        TraceabilityBundleBuilder sut = new(
            runDetail.Object,
            audit.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>());
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(), };

        Func<Task> act = async () =>
            _ = await sut.BuildAsync(runGuid.ToString("N"), scope, maxZipBytes: 1, CancellationToken.None);

        await act.Should().ThrowAsync<TraceabilityBundleTooLargeException>();
    }
}
