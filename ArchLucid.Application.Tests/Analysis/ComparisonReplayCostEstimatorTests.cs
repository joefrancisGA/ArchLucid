using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
///     Unit tests for <see cref="ComparisonReplayCostEstimator" /> heuristics (no replay execution).
/// </summary>
[Trait("Category", "Unit")]
public sealed class ComparisonReplayCostEstimatorTests
{
    [SkippableFact]
    public async Task TryEstimateAsync_missing_record_returns_null()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((ComparisonRecord?)null);
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("missing", null, "artifact", false, CancellationToken.None);

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryEstimateAsync_end_to_end_artifact_markdown_is_low_band()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1", ComparisonType = ComparisonTypes.EndToEndReplay, PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.RelativeCostBand.Should().Be("low");
        result.ReplayMode.Should().Be("artifact");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_invalid_replay_mode_throws_ArgumentException()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord { ComparisonRecordId = "c1", ComparisonType = ComparisonTypes.EndToEndReplay });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        Func<Task> act = async () =>
            await sut.TryEstimateAsync("c1", null, "not-a-mode", false, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task TryEstimateAsync_persistReplay_adds_score_and_factor()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1", ComparisonType = ComparisonTypes.EndToEndReplay, PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? withPersist =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", true, CancellationToken.None);
        ComparisonReplayCostEstimate? withoutPersist =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        withPersist.Should().NotBeNull();
        withoutPersist.Should().NotBeNull();
        withPersist.ApproximateRelativeScore.Should().BeGreaterThan(withoutPersist.ApproximateRelativeScore);
        withPersist.Factors.Should().Contain(f => f.Contains("PersistReplay", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_large_payload_adds_factor()
    {
        Mock<IComparisonRecordRepository> repo = new();
        string largePayload = new('x', 500_001);
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = largePayload
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.Factors.Should().Contain(f => f.Contains("Large stored payload", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_manifest_delta_depth_adds_factor_and_raises_score()
    {
        Mock<IComparisonRecordRepository> repo = new();
        string payloadJson = JsonSerializer.Serialize(new
        {
            manifestDelta = Enumerable.Range(1, 90).Select(static i => new { key = $"k{i}" }).ToArray()
        });

        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = payloadJson
            });

        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? rich =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        repo.Setup(r => r.GetByIdAsync("c2", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c2",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}"
            });

        ComparisonReplayCostEstimate? baseline =
            await sut.TryEstimateAsync("c2", "markdown", "artifact", false, CancellationToken.None);

        rich.Should().NotBeNull();
        baseline.Should().NotBeNull();
        rich.ApproximateRelativeScore.Should().BeGreaterThan(baseline.ApproximateRelativeScore);
        rich.Factors.Should().Contain(f => f.Contains("manifest delta", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_persisted_manifestDiff_structural_surface_adds_factor_and_score()
    {
        JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "a".PadRight(32, 'a'),
            RightRunId = "b".PadRight(32, 'b'),
            ManifestDiff = new ManifestDiffResult { AddedServices = [..Enumerable.Repeat("service", 35)] }
        };
        string payloadJson = JsonSerializer.Serialize(report, jsonOptions);

        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = payloadJson
            });

        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? rich =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        repo.Setup(r => r.GetByIdAsync("c2", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c2",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}"
            });

        ComparisonReplayCostEstimate? baseline =
            await sut.TryEstimateAsync("c2", "markdown", "artifact", false, CancellationToken.None);

        rich.Should().NotBeNull();
        baseline.Should().NotBeNull();
        rich.ApproximateRelativeScore.Should().BeGreaterThan(baseline.ApproximateRelativeScore);
        rich.Factors.Should()
            .Contain(f => f.Contains("manifest", StringComparison.OrdinalIgnoreCase) && f.Contains("structural", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_export_record_diff_payload_with_many_changed_fields_adds_factor()
    {
        JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web);
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "l",
            RightExportRecordId = "r",
            LeftRunId = "lr",
            RightRunId = "rr",
            ChangedTopLevelFields = [..Enumerable.Range(1, 14).Select(static i => $"f{i}")],
            RequestDiff = new ExportRecordRequestDiff { ChangedFlags = [..Enumerable.Repeat("flag", 12)] }
        };
        string payloadJson = JsonSerializer.Serialize(diff, jsonOptions);

        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                PayloadJson = payloadJson
            });

        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.Factors.Should().Contain(f => f.Contains("Export record", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_low_band_upper_bound_score_4_is_low()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "html", "artifact", true, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(4);
        result.RelativeCostBand.Should().Be("low");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_medium_band_lower_bound_score_5_is_medium()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "regenerate", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(5);
        result.RelativeCostBand.Should().Be("medium");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_medium_band_upper_bound_score_12_is_medium()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "html", "verify", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(12);
        result.RelativeCostBand.Should().Be("medium");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_high_band_pdf_verify_scores_15()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "pdf", "verify", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(15);
        result.RelativeCostBand.Should().Be("high");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_score_13_from_verify_plus_nonstandard_format_is_high_band()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "yaml", "verify", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(13);
        result.RelativeCostBand.Should().Be("high");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_unknown_comparison_type_scores_high_band()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = "not-replayable",
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(25);
        result.RelativeCostBand.Should().Be("high");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_export_record_diff_verify_docx_hits_medium_band_edge_12()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = new(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "docx", "verify", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(12);
        result.RelativeCostBand.Should().Be("medium");
    }
}
