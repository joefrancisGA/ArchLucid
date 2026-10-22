using ArchLucid.Application.Audit;
using ArchLucid.Core.Explanation;

using ArtifactDescriptor = ArchLucid.Contracts.Persistence.Artifacts.ArtifactDescriptor;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Configuration.IntegrationSecrets;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch7Tests
{
    [Fact]
    public async Task JobRunTelemetry_success_unknown_job_and_configuration_error_paths()
    {
        JobRunTelemetry sut = new(NullLogger<JobRunTelemetry>.Instance);

        int success = await sut.RunWithTelemetryAsync(
            "coverage-success",
            _ => Task.FromResult(ArchLucidJobExitCodes.Success),
            CancellationToken.None);
        int unknown = await sut.RunWithTelemetryAsync(
            "coverage-unknown",
            _ => Task.FromResult(ArchLucidJobExitCodes.UnknownJob),
            CancellationToken.None);
        int config = await sut.RunWithTelemetryAsync(
            "coverage-config",
            _ => Task.FromResult(ArchLucidJobExitCodes.ConfigurationError),
            CancellationToken.None);

        success.Should().Be(ArchLucidJobExitCodes.Success);
        unknown.Should().Be(ArchLucidJobExitCodes.UnknownJob);
        config.Should().Be(ArchLucidJobExitCodes.ConfigurationError);
    }

    [Fact]
    public async Task JobRunTelemetry_exception_returns_job_failure()
    {
        JobRunTelemetry sut = new(NullLogger<JobRunTelemetry>.Instance);

        int exitCode = await sut.RunWithTelemetryAsync(
            "coverage-fail",
            _ => throw new InvalidOperationException("boom"),
            CancellationToken.None);

        exitCode.Should().Be(ArchLucidJobExitCodes.JobFailure);
    }

    [Fact]
    public async Task JobRunTelemetry_cancellation_rethrows_and_rejects_bad_args()
    {
        JobRunTelemetry sut = new(NullLogger<JobRunTelemetry>.Instance);
        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> canceled = () => sut.RunWithTelemetryAsync(
            "coverage-cancel",
            ct => Task.FromCanceled<int>(ct),
            cts.Token);

        await canceled.Should().ThrowAsync<OperationCanceledException>();

        Action nullLogger = () => _ = new JobRunTelemetry(null!);
        Func<Task> blankName = () =>
            sut.RunWithTelemetryAsync(" ", _ => Task.FromResult(0), CancellationToken.None);
        Func<Task> nullExecute = () =>
            sut.RunWithTelemetryAsync("job", null!, CancellationToken.None);

        nullLogger.Should().Throw<ArgumentNullException>();
        await blankName.Should().ThrowAsync<ArgumentException>();
        await nullExecute.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void DemoCommitPagePreviewMapper_builds_preview_and_caps_timeline()
    {
        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        RunRecord run = new()
        {
            RunId = runId,
            ProjectId = "proj",
            Description = "desc",
            CreatedUtc = DateTime.UtcNow,
            ContextSnapshotId = contextId,
            GraphSnapshotId = Guid.Empty,
            FindingsSnapshotId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            ArtifactBundleId = Guid.NewGuid(),
        };
        RunDetailDto detail = new() { Run = run };
        ManifestSummaryDto manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            DecisionCount = 3,
            WarningCount = 2,
            UnresolvedIssueCount = 1,
            Status = "ok",
        };
        List<ArtifactDescriptor> artifacts =
        [
            new()
            {
                ArtifactId = Guid.NewGuid(),
                ArtifactType = "md",
                Name = "n",
                Format = "text",
                CreatedUtc = DateTime.UtcNow,
                ContentHash = "c",
            },
        ];
        List<RunPipelineTimelineItemDto> timeline = Enumerable
            .Range(0, 12)
            .Select(i => new RunPipelineTimelineItemDto(
                Guid.NewGuid(),
                DateTime.UtcNow.AddMinutes(i),
                $"evt-{i}",
                "actor",
                "corr"))
            .ToList();
        RunExplanationSummary explanation = new()
        {
            Explanation = new ExplanationResult { Summary = "S" },
            ThemeSummaries = ["t"],
            OverallAssessment = "A",
            RiskPosture = "Low",
        };

        DemoCommitPagePreviewResponse? preview = DemoCommitPagePreviewMapper.TryBuild(
            DateTimeOffset.UtcNow,
            isDemoData: true,
            demoStatusMessage: null,
            detail,
            manifest,
            artifacts,
            timeline,
            explanation,
            NullLogger.Instance,
            runId);

        preview.Should().NotBeNull();
        preview!.Run.RunId.Should().Be(runId.ToString("N"));
        preview.AuthorityChain.ContextSnapshotId.Should().Be(contextId.ToString("N"));
        preview.AuthorityChain.GraphSnapshotId.Should().BeNull();
        preview.Manifest.HasWarnings.Should().BeTrue();
        preview.Manifest.HasUnresolvedIssues.Should().BeTrue();
        preview.Artifacts.Should().ContainSingle();
        preview.PipelineTimeline.Should().HaveCount(10);
        preview.DemoStatusMessage.Should().BeEmpty();
    }

    [Fact]
    public void DemoCommitPagePreviewMapper_returns_null_when_inputs_missing_or_timeline_empty()
    {
        Guid runId = Guid.NewGuid();
        RunExplanationSummary explanation = new()
        {
            Explanation = new ExplanationResult { Summary = "S" },
            ThemeSummaries = [],
            OverallAssessment = "A",
            RiskPosture = "Low",
        };

        DemoCommitPagePreviewResponse? missing = DemoCommitPagePreviewMapper.TryBuild(
            DateTimeOffset.UtcNow,
            isDemoData: false,
            demoStatusMessage: "msg",
            detail: null,
            manifestDto: null,
            descriptors: [],
            timeline: null,
            explanation: explanation,
            NullLogger.Instance,
            runId);

        missing.Should().BeNull();

        RunRecord run = new()
        {
            RunId = runId,
            ProjectId = "p",
            CreatedUtc = DateTime.UtcNow,
        };
        DemoCommitPagePreviewResponse? emptyTimeline = DemoCommitPagePreviewMapper.TryBuild(
            DateTimeOffset.UtcNow,
            isDemoData: false,
            demoStatusMessage: "msg",
            new RunDetailDto { Run = run },
            new ManifestSummaryDto
            {
                ManifestId = Guid.NewGuid(),
                RunId = runId,
                CreatedUtc = DateTime.UtcNow,
                ManifestHash = "h",
                RuleSetId = "rs",
                RuleSetVersion = "1",
                DecisionCount = 0,
                WarningCount = 0,
                UnresolvedIssueCount = 0,
                Status = "ok",
            },
            [],
            [],
            explanation,
            NullLogger.Instance,
            runId);

        emptyTimeline.Should().NotBeNull();
        emptyTimeline!.PipelineTimeline.Should().BeEmpty();
        emptyTimeline.DemoStatusMessage.Should().Be("msg");
    }

    [Fact]
    public async Task CompositeSecretProvider_prefers_overlay_then_falls_through()
    {
        InMemoryIntegrationSecretStore store = new();
        store.Upsert("overlay-key", "from-overlay");
        Mock<ISecretProvider> inner = new();
        inner
            .Setup(p => p.GetSecretAsync("inner-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync("from-inner");
        CompositeSecretProvider sut = new(inner.Object, store);

        string? overlay = await sut.GetSecretAsync("overlay-key", CancellationToken.None);
        string? fallback = await sut.GetSecretAsync("inner-key", CancellationToken.None);

        overlay.Should().Be("from-overlay");
        fallback.Should().Be("from-inner");

        Action nullInner = () => _ = new CompositeSecretProvider(null!, store);
        Action nullStore = () => _ = new CompositeSecretProvider(inner.Object, null!);
        Func<Task> blankName = () => sut.GetSecretAsync(" ", CancellationToken.None);

        nullInner.Should().Throw<ArgumentNullException>();
        nullStore.Should().Throw<ArgumentNullException>();
        await blankName.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task InMemoryIntegrationSecretWriter_upserts_into_store()
    {
        InMemoryIntegrationSecretStore store = new();
        InMemoryIntegrationSecretWriter writer = new(store);

        bool ok = await writer.TryUpsertSecretAsync(" SecretA ", "value", CancellationToken.None);

        ok.Should().BeTrue();
        store.TryGet("secreta", out string? value).Should().BeTrue();
        value.Should().Be("value");

        Action nullStore = () => _ = new InMemoryIntegrationSecretWriter(null!);
        nullStore.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null, true, false)]
    [InlineData("  ", true, false)]
    [InlineData("Sql", true, false)]
    [InlineData("sql", true, false)]
    [InlineData("InMemory", false, true)]
    [InlineData("Cosmos", false, false)]
    public void ArchLucidOptions_effective_storage_helpers(string? provider, bool expectSql, bool expectInMemory)
    {
        ArchLucidOptions.EffectiveIsSql(provider).Should().Be(expectSql);
        ArchLucidOptions.EffectiveIsInMemory(provider).Should().Be(expectInMemory);
    }
}
