using ArchLucid.Application.Agents;

using FluentAssertions;

using Microsoft.Extensions.Hosting;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class RepoFaithfulnessHarnessSummaryReaderTests
{
    [Fact]
    public async Task TryReadLatestAsync_when_format_version_is_whitespace_uses_default()
    {
        string root = CreateTempContentRoot();
        WriteSummary(
            root,
            """
            {
              "formatVersion": "   ",
              "casesEvaluated": 10,
              "positiveReadinessSupportRatio": 0.9,
              "negativeControlSupportRatio": 0.1,
              "combinedDiagnosticSupportRatio": 0.5,
              "floorMinSupportRatio": 0.8
            }
            """);

        FaithfulnessHarnessSummary? summary = await ReadFromRootAsync(root);

        summary.Should().NotBeNull();
        summary!.FormatVersion.Should().Be("1.0");
    }

    [Fact]
    public async Task TryReadLatestAsync_trims_surrounding_whitespace_on_format_version()
    {
        string root = CreateTempContentRoot();
        WriteSummary(
            root,
            """
            {
              "formatVersion": "  2.1  ",
              "casesEvaluated": 10,
              "positiveReadinessSupportRatio": 0.9,
              "negativeControlSupportRatio": 0.1,
              "combinedDiagnosticSupportRatio": 0.5,
              "floorMinSupportRatio": 0.8
            }
            """);

        FaithfulnessHarnessSummary? summary = await ReadFromRootAsync(root);

        summary.Should().NotBeNull();
        summary!.FormatVersion.Should().Be("2.1");
    }

    private static async Task<FaithfulnessHarnessSummary?> ReadFromRootAsync(string contentRoot)
    {
        Mock<IHostEnvironment> environment = new();
        environment.Setup(e => e.ContentRootPath).Returns(contentRoot);

        RepoFaithfulnessHarnessSummaryReader reader = new(environment.Object);

        return await reader.TryReadLatestAsync(CancellationToken.None);
    }

    private static string CreateTempContentRoot()
    {
        string root = Path.Combine(Path.GetTempPath(), "archlucid-faithfulness-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(root, "docs", "quality"));
        return root;
    }

    private static void WriteSummary(string contentRoot, string json)
    {
        string path = Path.Combine(contentRoot, "docs", "quality", "faithfulness-summary.json");
        File.WriteAllText(path, json);
    }
}
