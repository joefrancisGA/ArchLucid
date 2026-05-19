using System.Globalization;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.TerraformAdvisory;

using FluentAssertions;

namespace ArchLucid.Application.Tests.TerraformAdvisory;
[Trait("Category", "Unit")]

public sealed class TerraformAdvisorySnippetTemplatesTests
{
    [Fact]
    public void Example_snippet_includes_standard_advisory_banner()
    {
        string snippet =
            TerraformAdvisorySnippetTemplates.ExampleRightSizeVmSnippet("finding-1", "rec-a");

        snippet.Should().Contain(TerraformAdvisorySnippetTemplates.AdvisoryHeaderLine);
    }

    [Fact]
    public void Citation_formatter_includes_schema_and_collection_ts()

    {
        AzureExtractorNormalizedManifest m = new(
            1,
            "1",
            DateTimeOffset.Parse("2026-05-06T03:04:05Z"),
            "sub-1",
            "scope",
            [],
            "az",
            "{}");

        string proof = AzureExtractorCitationFormatter.FormatCostProofPoint(m);

        proof.Should().Contain("schemaVersion=1");

        proof.Should().Contain("collectionTimestampUtc=");
    }

    [Fact]
    public void FormatStoredPackageCitation_includes_package_id()

    {
        string cite = AzureExtractorCitationFormatter.FormatStoredPackageCitation(
            Guid.Parse("11111111222233334444555566667777"),
            1,
            DateTime.Parse("2026-05-06T03:04:05Z", CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind));

        cite.Should().Contain("packageId=11111111222233334444555566667777");

        cite.Should().Contain("schemaVersion=1");
    }
}
