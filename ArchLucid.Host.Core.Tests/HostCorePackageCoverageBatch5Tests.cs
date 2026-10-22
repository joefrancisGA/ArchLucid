using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Configuration.Secrets;
using ArchLucid.Host.Core.Services;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch5Tests
{
    [Fact]
    public void DataConsistency_options_expose_expected_defaults()
    {
        DataConsistencyProbeOptions probe = new();
        DataConsistencyEnforcementOptions enforcement = new();

        probe.OrphanProbeEnabled.Should().BeTrue();
        probe.OrphanProbeIntervalMinutes.Should().Be(60);
        enforcement.Mode.Should().Be(DataConsistencyEnforcementMode.Warn);
        enforcement.AlertThreshold.Should().Be(1);
    }

    [Fact]
    public async Task EnvironmentVariableSecretProvider_returns_null_for_missing_key()
    {
        EnvironmentVariableSecretProvider sut = new(new ConfigurationManager());

        string? secret = await sut.GetSecretAsync(
            "ARCHLUCID_COVERAGE_BATCH5_MISSING_" + Guid.NewGuid().ToString("N"),
            CancellationToken.None);

        secret.Should().BeNull();
    }

    [Fact]
    public async Task ComparisonReplayApiService_records_success_diagnostics()
    {
        Mock<IComparisonReplayService> inner = new();
        ReplayComparisonResult result = new()
        {
            ComparisonType = "EndToEnd",
            Format = "Markdown",
            ReplayMode = "Full",
            VerificationPassed = true,
            PersistedReplayRecordId = "replay-1",
        };
        inner.Setup(s => s.ReplayAsync(It.IsAny<ReplayComparisonRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(result);

        Mock<IReplayDiagnosticsRecorder> recorder = new();
        ComparisonReplayApiService sut = new(
            inner.Object,
            recorder.Object,
            NullLogger<ComparisonReplayApiService>.Instance);

        ReplayComparisonResult actual = await sut.ReplayAsync(
            new ReplayComparisonRequest
            {
                ComparisonRecordId = "cmp-1",
                Format = "Markdown",
                ReplayMode = "Full",
                PersistReplay = true,
            },
            metadataOnly: false,
            CancellationToken.None);

        actual.VerificationPassed.Should().BeTrue();
        recorder.Verify(
            r => r.Record(It.Is<ReplayDiagnosticsEntry>(e => e.Success && e.ComparisonRecordId == "cmp-1")),
            Times.Once);
    }

    [Fact]
    public async Task ComparisonReplayApiService_records_failure_and_rethrows_run_not_found()
    {
        Mock<IComparisonReplayService> inner = new();
        inner.Setup(s => s.ReplayAsync(It.IsAny<ReplayComparisonRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException("missing-run"));

        Mock<IReplayDiagnosticsRecorder> recorder = new();
        ComparisonReplayApiService sut = new(
            inner.Object,
            recorder.Object,
            NullLogger<ComparisonReplayApiService>.Instance);

        Func<Task> act = () => sut.ReplayAsync(
            new ReplayComparisonRequest { ComparisonRecordId = "cmp-missing", Format = "Json", ReplayMode = "Meta" },
            metadataOnly: true,
            CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
        recorder.Verify(
            r => r.Record(It.Is<ReplayDiagnosticsEntry>(e => !e.Success && e.MetadataOnly)),
            Times.Once);
    }

    [Fact]
    public async Task ComparisonReplayApiService_delegates_drift_analysis()
    {
        Mock<IComparisonReplayService> inner = new();
        DriftAnalysisResult drift = new() { DriftDetected = true, Summary = "drift" };
        inner.Setup(s => s.AnalyzeDriftAsync("cmp-d", It.IsAny<CancellationToken>()))
            .ReturnsAsync(drift);

        ComparisonReplayApiService sut = new(
            inner.Object,
            Mock.Of<IReplayDiagnosticsRecorder>(),
            NullLogger<ComparisonReplayApiService>.Instance);

        DriftAnalysisResult actual = await sut.AnalyzeDriftAsync("cmp-d", CancellationToken.None);

        actual.DriftDetected.Should().BeTrue();
        inner.Verify(s => s.AnalyzeDriftAsync("cmp-d", It.IsAny<CancellationToken>()), Times.Once);
    }
}
