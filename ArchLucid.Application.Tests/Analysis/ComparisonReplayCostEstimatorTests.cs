using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
///     Unit tests for <see cref="ComparisonReplayCostEstimator" /> heuristics (no replay execution).
/// </summary>
[Trait("Category", "Unit")]
public sealed class ComparisonReplayCostEstimatorTests
{
    [SkippableFact]
    public async Task TryEstimateAsync_second_call_uses_memory_cache()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1", ComparisonType = ComparisonTypes.EndToEndReplay, PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        _ = await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);
        _ = await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        repo.Verify(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task TryEstimateAsync_missing_record_returns_null()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((ComparisonRecord?)null);
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("missing", null, "artifact", false, CancellationToken.None);

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task TryEstimateAsync_returns_trimmed_comparison_record_id_from_stored_row()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "  c1  ",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}",
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result!.ComparisonRecordId.Should().Be("c1");
    }

    [SkippableFact]
    public async Task TryEstimateAsync_returns_trimmed_comparison_type_from_stored_row()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = $"  {ComparisonTypes.EndToEndReplay}  ",
                PayloadJson = "{}",
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result!.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
    }

    [SkippableFact]
    public async Task CompareQuality_TryEstimateAsync_canonicalizes_known_comparison_type_casing_from_stored_row()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = "  END-TO-END-REPLAY  ",
                PayloadJson = "{}",
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result!.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
    }

    [SkippableFact]
    public async Task CompareQuality_TryEstimateAsync_returns_empty_comparison_type_when_stored_row_is_whitespace_only()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = "   ",
                PayloadJson = "{}",
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result!.ComparisonType.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task TryEstimateAsync_trims_padded_comparison_record_id_before_load()
    {
        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1", ComparisonType = ComparisonTypes.EndToEndReplay, PayloadJson = "{}"
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1\n", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        repo.Verify(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>()), Times.Once);
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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
    public async Task CompareQuality_TryEstimateAsync_whitespace_only_payload_does_not_add_large_payload_factor()
    {
        Mock<IComparisonRecordRepository> repo = new();
        string whitespacePayload = new(' ', 600_000);
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = whitespacePayload,
            });
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result!.Factors.Should().NotContain(f => f.Contains("Large stored payload", StringComparison.Ordinal));
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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
    public async Task TryEstimateAsync_pascal_case_warning_only_manifestDiff_adds_factor()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "a".PadRight(32, 'a'),
            RightRunId = "b".PadRight(32, 'b'),
            ManifestDiff = new ManifestDiffResult { Warnings = ["Manifest metadata drift only."] },
        };
        string payloadJson = JsonSerializer.Serialize(report);

        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = payloadJson,
            });

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? rich =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        repo.Setup(r => r.GetByIdAsync("c2", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c2",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = "{}",
            });

        ComparisonReplayCostEstimate? baseline =
            await sut.TryEstimateAsync("c2", "markdown", "artifact", false, CancellationToken.None);

        rich.Should().NotBeNull();
        baseline.Should().NotBeNull();
        rich.ApproximateRelativeScore.Should().BeGreaterThan(baseline.ApproximateRelativeScore);
        rich.Factors.Should().Contain(f => f.Contains("warning-only", StringComparison.OrdinalIgnoreCase));
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

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.Factors.Should().Contain(f => f.Contains("Export record", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_pascal_case_export_record_diff_payload_adds_factor()
    {
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "l",
            RightExportRecordId = "r",
            LeftRunId = "lr",
            RightRunId = "rr",
            ChangedTopLevelFields = [..Enumerable.Range(1, 14).Select(static i => $"f{i}")],
            RequestDiff = new ExportRecordRequestDiff { ChangedFlags = [..Enumerable.Repeat("flag", 12)] },
        };
        string payloadJson = JsonSerializer.Serialize(diff);

        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                PayloadJson = payloadJson,
            });

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.Factors.Should().Contain(f => f.Contains("Export record", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_pascal_case_artifact_sizes_bytes_adds_factor()
    {
        const string pascalPayloadJson = """{"ArtifactSizesBytes":[600000,600000]}""";
        const string camelPayloadJson = """{"artifactSizesBytes":[600000,600000]}""";

        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = pascalPayloadJson,
            });
        repo.Setup(r => r.GetByIdAsync("c2", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c2",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = camelPayloadJson,
            });

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? pascalCase =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);
        ComparisonReplayCostEstimate? camelCase =
            await sut.TryEstimateAsync("c2", "markdown", "artifact", false, CancellationToken.None);

        pascalCase.Should().NotBeNull();
        camelCase.Should().NotBeNull();
        pascalCase.ApproximateRelativeScore.Should().Be(camelCase.ApproximateRelativeScore);
        pascalCase.Factors.Should()
            .Contain(f => f.Contains("referenced artifact", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task TryEstimateAsync_pascal_case_agent_presence_delta_adds_factor()
    {
        const string pascalPayloadJson =
            """{"AgentResultDiff":{"AgentDeltas":[{"LeftExists":false,"RightExists":true}]}}""";
        const string camelPayloadJson =
            """{"agentResultDiff":{"agentDeltas":[{"leftExists":false,"rightExists":true}]}}""";

        Mock<IComparisonRecordRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync("c1", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c1",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = pascalPayloadJson,
            });
        repo.Setup(r => r.GetByIdAsync("c2", It.IsAny<CancellationToken>())).ReturnsAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "c2",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                PayloadJson = camelPayloadJson,
            });

        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? pascalCase =
            await sut.TryEstimateAsync("c1", "markdown", "artifact", false, CancellationToken.None);
        ComparisonReplayCostEstimate? camelCase =
            await sut.TryEstimateAsync("c2", "markdown", "artifact", false, CancellationToken.None);

        pascalCase.Should().NotBeNull();
        camelCase.Should().NotBeNull();
        pascalCase.ApproximateRelativeScore.Should().Be(camelCase.ApproximateRelativeScore);
        pascalCase.Factors.Should()
            .Contain(f => f.Contains("Agent result deltas", StringComparison.OrdinalIgnoreCase));
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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

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
        ComparisonReplayCostEstimator sut = CreateSut(repo.Object);

        ComparisonReplayCostEstimate? result =
            await sut.TryEstimateAsync("c1", "docx", "verify", false, CancellationToken.None);

        result.Should().NotBeNull();
        result.ApproximateRelativeScore.Should().Be(12);
        result.RelativeCostBand.Should().Be("medium");
    }

    private static ComparisonReplayCostEstimator CreateSut(IComparisonRecordRepository repository) =>
        new(repository, new MemoryCache(new MemoryCacheOptions()));
}
