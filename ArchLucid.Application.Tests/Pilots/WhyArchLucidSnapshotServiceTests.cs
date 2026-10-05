using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

/// <summary>
/// Unit tests for <see cref="WhyArchLucidSnapshotService"/> â€” the application service behind
/// <c>GET /v1/pilots/why-archlucid-snapshot</c>, used by the operator-shell <c>/why-archlucid</c> proof page.
/// </summary>
[Trait("Suite", "Core")]
public sealed class WhyArchLucidSnapshotServiceTests
{
    [SkippableFact]
    public async Task BuildAsync_returns_canonical_demo_run_id_and_aggregated_counters()
    {
        InstrumentationCounterSnapshot counters = new()
        {
            RunsCreatedTotal = 11, FindingsProducedBySeverity = new Dictionary<string, long>(StringComparer.Ordinal) { ["Critical"] = 2, ["High"] = 5, },
        };

        Mock<IInstrumentationCounterSnapshotProvider> provider = new();
        provider.Setup(p => p.GetSnapshot()).Returns(counters);

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetByScopeAsync(
                ScopeIds.DefaultTenant,
                ScopeIds.DefaultWorkspace,
                ScopeIds.DefaultProject,
                WhyArchLucidSnapshotResponse.AuditRowCountCap + 1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([new AuditEvent { EventType = "x" }, new AuditEvent { EventType = "y" }]);

        DateTimeOffset fixedUtc = new(2026, 4, 20, 12, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(fixedUtc);

        WhyArchLucidSnapshotService sut = new(
            provider.Object,
            audit.Object,
            clock,
            NullLogger<WhyArchLucidSnapshotService>.Instance);

        WhyArchLucidSnapshotResponse result = await sut.BuildAsync(CancellationToken.None);

        result.GeneratedUtc.Should().Be(fixedUtc);
        result.DemoRunId.Should().Be(ContosoRetailDemoIdentifiers.RunBaseline);
        result.RunsCreatedTotal.Should().Be(11);
        result.FindingsProducedBySeverity.Should().ContainKey("Critical").WhoseValue.Should().Be(2);
        result.FindingsProducedBySeverity.Should().ContainKey("High").WhoseValue.Should().Be(5);
        result.AuditRowCount.Should().Be(2);
        result.AuditRowCountTruncated.Should().BeFalse();
        result.EstimatedManualWorkHoursSaved.Should().BeApproximately(22.39d, 0.001d);
        result.EstimatedManualWorkHoursSavedMethodology.Should().NotBeNullOrWhiteSpace();
    }

    [SkippableFact]
    public async Task BuildAsync_when_audit_rows_equal_cap_does_not_mark_truncated()
    {
        int cap = WhyArchLucidSnapshotResponse.AuditRowCountCap;
        AuditEvent[] capped = new AuditEvent[cap];

        for (int i = 0; i < capped.Length; i++)
            capped[i] = new AuditEvent { EventType = "x" };

        Mock<IInstrumentationCounterSnapshotProvider> provider = new();
        provider.Setup(p => p.GetSnapshot()).Returns(new InstrumentationCounterSnapshot());

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetByScopeAsync(
                ScopeIds.DefaultTenant,
                ScopeIds.DefaultWorkspace,
                ScopeIds.DefaultProject,
                cap + 1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(capped);

        WhyArchLucidSnapshotService sut = new(
            provider.Object,
            audit.Object,
            TimeProvider.System,
            NullLogger<WhyArchLucidSnapshotService>.Instance);

        WhyArchLucidSnapshotResponse result = await sut.BuildAsync(CancellationToken.None);

        result.AuditRowCount.Should().Be(cap);
        result.AuditRowCountTruncated.Should().BeFalse();
    }

    [SkippableFact]
    public async Task BuildAsync_marks_audit_row_count_as_truncated_when_more_than_cap_exist()
    {
        int cap = WhyArchLucidSnapshotResponse.AuditRowCountCap;
        AuditEvent[] overCap = new AuditEvent[cap + 1];

        for (int i = 0; i < overCap.Length; i++)
            overCap[i] = new AuditEvent { EventType = "x" };

        Mock<IInstrumentationCounterSnapshotProvider> provider = new();
        provider.Setup(p => p.GetSnapshot()).Returns(new InstrumentationCounterSnapshot());

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetByScopeAsync(
                ScopeIds.DefaultTenant,
                ScopeIds.DefaultWorkspace,
                ScopeIds.DefaultProject,
                cap + 1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(overCap);

        WhyArchLucidSnapshotService sut = new(
            provider.Object,
            audit.Object,
            TimeProvider.System,
            NullLogger<WhyArchLucidSnapshotService>.Instance);

        WhyArchLucidSnapshotResponse result = await sut.BuildAsync(CancellationToken.None);

        result.AuditRowCount.Should().Be(cap);
        result.AuditRowCountTruncated.Should().BeTrue();
        result.EstimatedManualWorkHoursSaved.Should().BeApproximately(10.0d, 0.001d);
    }

    [SkippableFact]
    public async Task BuildAsync_swallows_audit_repository_failures_and_reports_zero_rows()
    {
        Mock<IInstrumentationCounterSnapshotProvider> provider = new();
        provider.Setup(p => p.GetSnapshot()).Returns(new InstrumentationCounterSnapshot { RunsCreatedTotal = 3 });

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("repository unavailable"));

        WhyArchLucidSnapshotService sut = new(
            provider.Object,
            audit.Object,
            TimeProvider.System,
            NullLogger<WhyArchLucidSnapshotService>.Instance);

        WhyArchLucidSnapshotResponse result = await sut.BuildAsync(CancellationToken.None);

        result.RunsCreatedTotal.Should().Be(3);
        result.AuditRowCount.Should().Be(0);
        result.AuditRowCountTruncated.Should().BeFalse();
        result.EstimatedManualWorkHoursSaved.Should().BeApproximately(6.0d, 0.001d);
    }

    [SkippableFact]
    public async Task BuildAsync_propagates_cancellation_from_audit_repository()
    {
        Mock<IInstrumentationCounterSnapshotProvider> provider = new();
        provider.Setup(p => p.GetSnapshot()).Returns(new InstrumentationCounterSnapshot());

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        WhyArchLucidSnapshotService sut = new(
            provider.Object,
            audit.Object,
            TimeProvider.System,
            NullLogger<WhyArchLucidSnapshotService>.Instance);

        Func<Task> act = () => sut.BuildAsync(new CancellationToken(canceled: true));

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
