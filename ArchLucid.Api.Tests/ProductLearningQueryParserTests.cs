using ArchLucid.Api.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Deterministic query parsing for <c>/v1/product-learning/*</c> (58R).</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "58R")]
public sealed class ProductLearningQueryParserTests
{
    [SkippableFact]
    public void TryParseReportFormat_defaults_to_markdown()
    {
        bool ok = ProductLearningQueryParser.TryParseReportFormat(null, out string norm, out string? err);

        ok.Should().BeTrue();
        err.Should().BeNull();
        norm.Should().Be("markdown");
    }

    [SkippableFact]
    public void TryParseReportFormat_accepts_json_case_insensitively()
    {
        bool ok = ProductLearningQueryParser.TryParseReportFormat("JSON", out string norm, out string? err);

        ok.Should().BeTrue();
        err.Should().BeNull();
        norm.Should().Be("json");
    }

    [SkippableFact]
    public void TryParseReportFormat_rejects_unknown_values()
    {
        bool ok = ProductLearningQueryParser.TryParseReportFormat("yaml", out _, out string? err);

        ok.Should().BeFalse();
        err.Should().Contain("format");
    }

    [SkippableFact]
    public void TryParseMaxReportArtifacts_clamps_to_documented_bounds()
    {
        bool ok = ProductLearningQueryParser.TryParseMaxReportArtifacts("0", out _, out string? err);

        ok.Should().BeFalse();
        err.Should().Contain("maxReportArtifacts");
    }
}
