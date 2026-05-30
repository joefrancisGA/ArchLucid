using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SupportBundleTriageDrillCatalogTests
{
    [Fact]
    public void All_contains_five_seeded_drills_without_secrets()
    {
        IReadOnlyList<SupportBundleTriageDrillScenario> drills = SupportBundleTriageDrillCatalog.All;

        drills.Should().HaveCount(5);
        drills.Select(static drill => drill.DrillId).Should().Contain(
        [
            "auth-loop",
            "sql-not-ready",
            "aoai-missing",
            "proof-packet-hold",
            "missing-artifact-after-commit",
        ]);

        string markdown = SupportBundleTriageDrillCatalog.ToMarkdown();

        markdown.Should().NotContain("Bearer ");
        markdown.Should().NotContain("password");
        markdown.Should().Contain("auth-loop");
        markdown.Should().Contain("Next command");
    }

    [Fact]
    public void TryGet_returns_matching_drill_case_insensitively()
    {
        SupportBundleTriageDrillScenario? drill = SupportBundleTriageDrillCatalog.TryGet("SQL-NOT-READY");

        drill.Should().NotBeNull();
        drill!.Title.Should().Contain("SQL");
        drill.CorrelationFields.Should().NotBeEmpty();
        drill.NextCommand.Should().NotBeNullOrWhiteSpace();
    }
}
